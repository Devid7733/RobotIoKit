import {
  enrichCatalogItem,
  normalizeQuery,
  searchRelevantCatalogItems
} from "@/modules/chatbot/chatbot.catalog";

function normalizeMention(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function scoreMentionAgainstSource(mention = "", source = {}) {
  const normalizedMention = normalizeMention(mention);
  const identityText = normalizeMention([source.name, source.slug, source.sku].join(" "));

  if (!normalizedMention || !identityText) {
    return 0;
  }

  if (identityText.includes(normalizedMention)) {
    return 100;
  }

  return normalizedMention
    .split(/\s+/)
    .filter((term) => term.length > 2)
    .reduce((total, term) => total + (identityText.includes(term) ? 12 : 0), 0);
}

export function getRecommendationCatalogItems(products = [], robotKits = []) {
  return [
    ...products.map((source) => ({ type: "product", source, enriched: enrichCatalogItem(source, "product") })),
    ...robotKits.map((source) => ({ type: "kit", source, enriched: enrichCatalogItem(source, "kit") }))
  ];
}

export function resolveRecommendationMention(mention = "", catalogItems = []) {
  const normalizedMention = normalizeMention(mention);

  if (!normalizedMention) {
    return null;
  }

  return (
    catalogItems
      .map((entry) => {
        const identityText = normalizeMention([
          entry.source.name,
          entry.source.slug,
          entry.source.sku,
          ...(entry.enriched.aliases || []),
          ...(entry.enriched.tags || []),
          ...(entry.enriched.useCases || [])
        ].join(" "));
        const score = Math.max(
          scoreMentionAgainstSource(mention, entry.source),
          identityText.includes(normalizedMention) ? 100 : 0,
          normalizedMention
            .split(/\s+/)
            .filter((term) => term.length > 2)
            .reduce((total, term) => total + (identityText.includes(term) ? 12 : 0), 0)
        );

        return { ...entry, score };
      })
      .filter((entry) => entry.score > 0)
      .sort((first, second) => second.score - first.score || Number(first.enriched.price || 0) - Number(second.enriched.price || 0))[0] || null
  );
}

export function recommendationNeededCategoryMatches(entry, neededCategory = "") {
  const category = String(neededCategory || "");
  const normalized = normalizeQuery(category);

  if (!normalized) {
    return false;
  }

  if (entry.enriched.category === category) {
    return true;
  }

  if (category === "Displays" && entry.enriched.subcategories?.includes("display")) {
    return true;
  }

  if (category === "Environment Monitoring" && entry.enriched.subcategories?.includes("environment_monitoring")) {
    return true;
  }

  if (category === "Wireless Communication" && entry.enriched.subcategories?.includes("wireless_communication")) {
    return true;
  }

  return [entry.enriched.category, ...(entry.enriched.tags || []), ...(entry.enriched.useCases || [])]
    .map((value) => normalizeQuery(value))
    .some((value) => value.includes(normalized) || normalized.includes(value));
}

export function scoreRecommendationCatalogItem(entry, plan, normalizedQuery, resolvedMentions = []) {
  const searchable = normalizeQuery([
    entry.enriched.name,
    entry.enriched.category,
    entry.enriched.description,
    ...(entry.enriched.tags || []),
    ...(entry.enriched.aliases || []),
    ...(entry.enriched.useCases || []),
    ...(entry.enriched.projectTypes || []),
    ...(entry.enriched.subcategories || [])
  ].join(" "));
  let score = entry.enriched.searchPriority || 0;
  const reasonCodes = [];

  if (plan.categories?.includes(entry.enriched.category)) {
    score += 80;
    reasonCodes.push("category");
  }

  const projectMatches = (plan.projectTypes || []).filter((projectType) => entry.enriched.projectTypes?.includes(projectType));
  if (projectMatches.length) {
    score += 70 + projectMatches.length * 10;
    reasonCodes.push("projectType");
  }

  const neededMatches = (plan.neededCategories || []).filter((category) => recommendationNeededCategoryMatches(entry, category));
  if (neededMatches.length) {
    score += 65 + neededMatches.length * 5;
    reasonCodes.push("projectType");
  }

  if (plan.projectTypes?.includes("environment_monitoring") && entry.enriched.category === "Sensors" && !entry.enriched.subcategories?.includes("environment_monitoring")) {
    score -= 90;
  }

  if (
    (plan.projectTypes?.includes("wireless_control") || plan.projectTypes?.includes("iot_robot")) &&
    entry.enriched.category === "IoT & Communication" &&
    !entry.enriched.subcategories?.includes("wireless_communication")
  ) {
    score -= 60;
  }

  if (plan.projectTypes?.includes("power_system") && entry.enriched.category === "Power" && !entry.enriched.subcategories?.includes("power_management")) {
    score -= 50;
  }

  if (resolvedMentions.some((mention) => mention.source.id === entry.source.id && mention.type === entry.type)) {
    score += 120;
    reasonCodes.push("exactName");
  }

  const queryTerms = normalizedQuery.split(/\s+/).filter((term) => term.length > 3);
  const matchedTerms = queryTerms.filter((term) => searchable.includes(term));
  if (matchedTerms.length) {
    score += Math.min(45, matchedTerms.length * 8);
    reasonCodes.push("description");
  }

  if (entry.enriched.stock > 0) {
    score += 12;
    reasonCodes.push("stock");
  }

  return { entry, score, reasonCodes: reasonCodes.length ? [...new Set(reasonCodes)] : ["description"] };
}

export function applyRecommendationFilters(entries, plan, resolvedComparisonReference) {
  const filters = plan.filters || {};

  return entries.filter(({ entry }) => {
    const price = Number(entry.enriched.price || 0);
    const stock = Number(entry.enriched.stock || 0);

    if (plan.itemType === "product" && entry.type !== "product") return false;
    if (plan.itemType === "kit" && entry.type !== "kit") return false;
    if (plan.categories?.length && !plan.categories.includes(entry.enriched.category)) return false;
    if (filters.stock === "in_stock" && stock <= 0) return false;
    if (filters.stock === "out_of_stock" && stock > 0) return false;
    if (filters.priceMin !== undefined && price < filters.priceMin) return false;
    if (filters.priceMax !== undefined && price > filters.priceMax) return false;

    if (filters.priceComparison && resolvedComparisonReference) {
      const referencePrice = Number(resolvedComparisonReference.enriched.price || 0);
      const sameReference =
        entry.type === resolvedComparisonReference.type &&
        (entry.source.id === resolvedComparisonReference.source.id ||
          normalizeMention(entry.source.slug) === normalizeMention(resolvedComparisonReference.source.slug) ||
          normalizeMention(entry.source.name) === normalizeMention(resolvedComparisonReference.source.name) ||
          normalizeMention(entry.source.name).includes(normalizeMention(filters.priceComparison.referenceProduct)));
      if (sameReference) return false;
      if (filters.priceComparison.operator === "gt" && !(price > referencePrice)) return false;
      if (filters.priceComparison.operator === "gte" && !(price >= referencePrice)) return false;
      if (filters.priceComparison.operator === "lt" && !(price < referencePrice)) return false;
      if (filters.priceComparison.operator === "lte" && !(price <= referencePrice)) return false;
    }

    return true;
  });
}

export function sortRecommendationResults(scoredEntries, plan) {
  const sort = plan.sort || { field: "relevance", direction: "desc" };
  const direction = sort.direction === "asc" ? 1 : -1;

  return scoredEntries.sort((first, second) => {
    if (sort.field === "price") {
      return direction * (Number(first.entry.enriched.price || 0) - Number(second.entry.enriched.price || 0)) || second.score - first.score;
    }

    if (sort.field === "stock") {
      return direction * (Number(first.entry.enriched.stock || 0) - Number(second.entry.enriched.stock || 0)) || second.score - first.score;
    }

    if (sort.field === "name") {
      return direction * first.entry.enriched.name.localeCompare(second.entry.enriched.name);
    }

    return second.score - first.score || Number(second.entry.enriched.stock || 0) - Number(first.entry.enriched.stock || 0);
  });
}

export function executeRecommendationPlan({ input = "", plan, products = [], robotKits = [] } = {}) {
  const catalogItems = getRecommendationCatalogItems(products, robotKits);
  const resolvedMentions = (plan.productMentions || [])
    .map((mention) => resolveRecommendationMention(mention, catalogItems))
    .filter(Boolean);
  const comparisonReference = plan.filters?.priceComparison
    ? resolveRecommendationMention(plan.filters.priceComparison.referenceProduct, catalogItems)
    : null;

  if (plan.filters?.priceComparison && !comparisonReference) {
    return { items: [], comparisonReference: null };
  }

  const normalizedQuery = normalizeQuery([input, plan.goal, ...(plan.projectTypes || []), ...(plan.neededCategories || [])].join(" "));
  const candidateScores = catalogItems.map((entry) => scoreRecommendationCatalogItem(entry, plan, normalizedQuery, resolvedMentions));
  const filtered = applyRecommendationFilters(candidateScores, plan, comparisonReference).filter((entry) => {
    if (plan.responseMode === "listing") {
      return true;
    }

    return entry.score >= 35 || resolvedMentions.some((mention) => mention.source.id === entry.entry.source.id);
  });
  const sorted = sortRecommendationResults(filtered, plan);
  const limit = plan.responseMode === "listing" ? 8 : 6;

  return {
    items: sorted.slice(0, limit),
    comparisonReference
  };
}

export function searchDeterministicRecommendations(options = {}) {
  return searchRelevantCatalogItems(options);
}
