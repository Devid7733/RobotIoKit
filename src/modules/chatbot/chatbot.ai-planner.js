import { callAiChat } from "@/lib/ai-chat";
import { detectProjectTypes, normalizeQuery } from "@/modules/chatbot/chatbot.catalog";

export const AI_CHAT_INTENTS = [
  "catalog_query",
  "catalog_sort",
  "catalog_filter",
  "catalog_aggregate",
  "catalog_detail",
  "catalog_availability",
  "catalog_category_summary",
  "robotics_education",
  "recommend_project_parts",
  "project_explanation",
  "how_to_build",
  "troubleshooting",
  "compatibility_question",
  "compare_products",
  "find_product",
  "fallback"
];

export const AI_RESPONSE_MODES = [
  "listing",
  "project_recommendation",
  "educational",
  "detail",
  "comparison",
  "troubleshooting",
  "fallback"
];

export const AI_PROJECT_TYPES = [
  "line_follower",
  "obstacle_avoider",
  "robot_car",
  "robot_arm",
  "arduino_beginner",
  "iot_robot",
  "environment_monitoring",
  "wireless_control",
  "power_system",
  "general_robotics"
];

const ALLOWED_SORT_FIELDS = ["price", "stock", "name", "createdAt", "popularity", "relevance"];
const ALLOWED_DIRECTIONS = ["asc", "desc"];
const ALLOWED_OPERATORS = ["gt", "gte", "lt", "lte"];
const ALLOWED_STOCK_FILTERS = ["in_stock", "out_of_stock", "any"];
const ALLOWED_ITEM_TYPES = ["product", "kit", "all", "category"];
const ALLOWED_STORE_DATA_INTENTS = [
  "catalog_sort",
  "catalog_filter",
  "catalog_aggregate",
  "catalog_detail",
  "catalog_availability",
  "catalog_category_summary",
  "robotics_education"
];
const ALLOWED_CATEGORY_METRICS = ["count"];
const VIRTUAL_NEEDS_CATEGORIES = ["Displays", "Environment Monitoring", "Wireless Communication"];
const MIN_AI_PLAN_CONFIDENCE = 0.45;

function unique(values = []) {
  return [...new Set(values.filter(Boolean))];
}

function isAiPlannerEnabled() {
  return String(process.env.CHATBOT_AI_ENABLED || "").toLowerCase() === "true";
}

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanStringArray(value) {
  return Array.isArray(value)
    ? unique(value.map(cleanString).filter((item) => item.length > 0)).slice(0, 12)
    : [];
}

// Name + slug only — aliases/tags/compatibility roughly doubled the planner
// prompt without improving plan quality (the app resolves mentions later).
function getCatalogItemIdentity(item) {
  return [item.name, item.slug].filter(Boolean).join(" ");
}

function getPriceStats(items = []) {
  const prices = items.map((item) => Number(item.price)).filter((price) => Number.isFinite(price));

  if (!prices.length) {
    return null;
  }

  return {
    min: Math.min(...prices),
    max: Math.max(...prices)
  };
}

export function getKnownProjectTypes() {
  return AI_PROJECT_TYPES;
}

export function buildSafeCatalogSummary({ products = [], robotKits = [], knownCategories = [], knownProjectTypes = AI_PROJECT_TYPES } = {}) {
  const productNames = products.map(getCatalogItemIdentity).filter(Boolean);
  const kitNames = robotKits.map(getCatalogItemIdentity).filter(Boolean);
  const productPrices = getPriceStats(products);
  const kitPrices = getPriceStats(robotKits);

  return [
    `Categories: ${knownCategories.join(", ") || "none"}`,
    `Allowed projectTypes: ${knownProjectTypes.join(", ")}`,
    `Product names, slugs, SKUs, aliases, and model-like identifiers: ${productNames.slice(0, 120).join("; ") || "none"}`,
    `Robot kit names, slugs, SKUs, and model-like identifiers: ${kitNames.slice(0, 80).join("; ") || "none"}`,
    productPrices ? `Product price range: $${productPrices.min.toFixed(2)} to $${productPrices.max.toFixed(2)}` : "Product price range: unavailable",
    kitPrices ? `Kit price range: $${kitPrices.min.toFixed(2)} to $${kitPrices.max.toFixed(2)}` : "Kit price range: unavailable",
    "Kits exist, but availability, stock, URLs, and final prices must be checked by the application.",
    "Allowed catalog item fields for planning: name, slug, sku, category, itemType, price range intent, stock intent, projectTypes, productMentions."
  ].join("\n");
}

function extractJsonObject(text = "") {
  const trimmed = String(text || "").trim();

  if (!trimmed) {
    return null;
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) {
      return null;
    }

    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

function buildPlannerPrompt({ userMessage, normalizedQuery, language, catalogSummary, knownCategories, knownProjectTypes }) {
  return `You are not answering the user.
You are creating a JSON plan for the application.
Output JSON only.
Do not include markdown.
Do not invent product names.
If unsure, use broad categories/projectTypes instead of fake products.
Products/prices/stock/URLs/availability will be resolved by the app from the database.
For Khmer input, understand the meaning but keep product names in English.

Allowed categories are: ${knownCategories.join(", ")}
Allowed projectTypes are: ${knownProjectTypes.join(", ")}
Allowed intents are: ${AI_CHAT_INTENTS.join(", ")}
Allowed responseMode values are: ${AI_RESPONSE_MODES.join(", ")}

Required JSON shape:
{
  "intent": "catalog_query | recommend_project_parts | project_explanation | how_to_build | troubleshooting | compatibility_question | compare_products | find_product | fallback",
  "goal": "short user goal",
  "itemType": "product | kit | all",
  "categories": [],
  "projectTypes": [],
  "productMentions": [],
  "neededCategories": [],
  "filters": {
    "priceMin": 0,
    "priceMax": 0,
    "priceComparison": { "operator": "gt | gte | lt | lte", "referenceProduct": "catalog product or kit mention" },
    "stock": "in_stock | out_of_stock | any"
  },
  "sort": { "field": "price | stock | name | relevance", "direction": "asc | desc" },
  "needsStoreProducts": true,
  "needsGeneralRoboticsKnowledge": false,
  "responseMode": "listing | project_recommendation | educational | detail | comparison | troubleshooting | fallback",
  "confidence": 0.0
}

Alternative JSON shape for store-data fallback questions:
{
  "intent": "catalog_sort | catalog_filter | catalog_aggregate | catalog_detail | catalog_availability | catalog_category_summary | robotics_education | fallback",
  "goal": "short user goal",
  "entityType": "product | kit | all | category",
  "category": "one allowed category or empty string",
  "mention": "catalog product or kit mention, or empty string",
  "topic": "robotics topic, beginner, or empty string",
  "sortBy": "price | stock | name | createdAt | popularity",
  "direction": "asc | desc",
  "stock": "in_stock | out_of_stock | any",
  "metric": "count",
  "limit": 1,
  "responseMode": "listing | detail | educational | fallback",
  "confidence": 0.0
}

Never create orders, update orders, update payments, access admin data, access users, access secrets, generate SQL, generate raw Prisma queries, or request arbitrary tables.

Planning rules:
- When the user states a budget, always set filters.priceMax and/or filters.priceMin.
- When the user describes a goal instead of a product, prefer intent recommend_project_parts with projectTypes and neededCategories.

Examples:
User: "something for my school project to follow a line, under $30"
Plan: {"intent":"recommend_project_parts","goal":"line follower school project under $30","itemType":"product","categories":[],"projectTypes":["line_follower"],"productMentions":[],"neededCategories":["Sensors","Controllers","Motors & Drivers","Power"],"filters":{"priceMax":30,"stock":"in_stock"},"sort":{"field":"relevance","direction":"desc"},"needsStoreProducts":true,"needsGeneralRoboticsKnowledge":true,"responseMode":"project_recommendation","confidence":0.85}

User: "ខ្ញុំចង់បានអ្វីមួយសម្រាប់គម្រោងសាលា ដើរតាមខ្សែ ក្រោម $30"
Plan: {"intent":"recommend_project_parts","goal":"line follower school project under $30","itemType":"product","categories":[],"projectTypes":["line_follower"],"productMentions":[],"neededCategories":["Sensors","Controllers","Motors & Drivers","Power"],"filters":{"priceMax":30,"stock":"in_stock"},"sort":{"field":"relevance","direction":"desc"},"needsStoreProducts":true,"needsGeneralRoboticsKnowledge":true,"responseMode":"project_recommendation","confidence":0.85}

User: "which robot kit is best for a total beginner?"
Plan: {"intent":"catalog_query","goal":"beginner robot kit recommendation","itemType":"kit","categories":[],"projectTypes":["general_robotics"],"productMentions":[],"neededCategories":[],"filters":{"stock":"in_stock"},"sort":{"field":"relevance","direction":"desc"},"needsStoreProducts":true,"needsGeneralRoboticsKnowledge":false,"responseMode":"project_recommendation","confidence":0.8}

Safe catalog summary:
${catalogSummary}

User message:
${userMessage}

Normalized query:
${normalizedQuery}

Detected language:
${language === "km" ? "Khmer" : "English"}`;
}

function parseMoneyRange(query) {
  const between = query.match(/\bbetween\s*\$?\s*(\d+(?:\.\d+)?)\s*(?:and|to|-)\s*\$?\s*(\d+(?:\.\d+)?)/i);
  if (between) {
    const first = Number(between[1]);
    const second = Number(between[2]);
    return { priceMin: Math.min(first, second), priceMax: Math.max(first, second) };
  }

  const under =
    query.match(/\b(?:under|below|less than|cheaper than)\s*\$?\s*(\d+(?:\.\d+)?)/i) ||
    query.match(/(?:under|below|cheap|budget)\s+(\d+(?:\.\d+)?)/i) ||
    query.match(/(?:ក្រោម|តិចជាង|មិនលើស)\s*\$?\s*(\d+(?:\.\d+)?)/i);
  if (under) {
    return { priceMax: Number(under[1]) };
  }

  const over = query.match(/\b(?:over|above|more than|greater than|more expensive than)\s*\$?\s*(\d+(?:\.\d+)?)/i);
  if (over) {
    return { priceMin: Number(over[1]) };
  }

  return {};
}

function inferCategories(query, knownCategories) {
  const matches = [];

  for (const category of knownCategories) {
    const normalizedCategory = normalizeQuery(category);
    const words = normalizedCategory.split(/\s+/).filter((word) => word.length > 2);

    if (normalizedCategory && (query.includes(normalizedCategory) || words.some((word) => query.includes(word)))) {
      matches.push(category);
    }
  }

  if (/\bsensors?\b/.test(query) && knownCategories.includes("Sensors")) {
    matches.push("Sensors");
  }

  if (/\bcontrollers?\b|\bboards?\b|\bmicrocontrollers?\b/.test(query) && knownCategories.includes("Controllers")) {
    matches.push("Controllers");
  }

  return unique(matches);
}

function inferProductMentionAfterComparison(query) {
  const match =
    query.match(/\b(?:more expensive than|higher than|above|greater than|cheaper than|less than|lower than)\s+(.+)$/i) ||
    query.match(/(?:ថ្លៃជាង|តម្លៃខ្ពស់ជាង|ថោកជាង)\s+(.+)$/i);
  return match ? cleanString(match[1]).replace(/[?.!]+$/g, "") : "";
}

function buildLocalPlan({ userMessage, normalizedQuery, language, knownCategories }) {
  const raw = String(userMessage || "");
  const query = normalizeQuery(normalizedQuery || raw);
  const rawLower = raw.toLowerCase();
  const categories = inferCategories(query, knownCategories);
  const category = categories[0] || "";
  const isKitQuery = /\bkits?\b|\brobot kits?\b/.test(query);
  const isProductQuery = /\bproducts?\b|\bparts?\b|\bcomponents?\b|\bsensors?\b|\bcontrollers?\b|\bmodules?\b|\bstore\b/.test(query);
  const entityType = isKitQuery && !isProductQuery ? "kit" : isProductQuery && !isKitQuery ? "product" : "all";

  if (/\bwhich categor(?:y|ies).*\b(most|highest|largest|more)\b.*\bproducts?\b|\bcategory\b.*\bmost products?\b/i.test(query)) {
    return {
      intent: "catalog_category_summary",
      goal: raw,
      entityType: "category",
      category: "",
      mention: "",
      topic: "",
      sortBy: "name",
      direction: "desc",
      stock: "any",
      metric: "count",
      limit: 3,
      responseMode: "listing",
      confidence: 0.82
    };
  }

  if (/\b(?:in stock|available|out of stock|unavailable)\b/i.test(query)) {
    return {
      intent: "catalog_availability",
      goal: raw,
      entityType,
      category,
      mention: "",
      topic: "",
      sortBy: "stock",
      direction: query.includes("out of stock") || query.includes("unavailable") ? "asc" : "desc",
      stock: query.includes("out of stock") || query.includes("unavailable") ? "out_of_stock" : "in_stock",
      metric: "count",
      limit: 8,
      responseMode: "listing",
      confidence: 0.84
    };
  }

  if (/\b(most expensive|highest price|priciest|cheapest|lowest price|newest|latest|most popular|popular)\b/i.test(query)) {
    const wantsAscending = /\b(cheapest|lowest price)\b/i.test(query);
    const wantsNewest = /\b(newest|latest)\b/i.test(query);
    const wantsPopular = /\b(most popular|popular)\b/i.test(query);
    const topLimitMatch = query.match(/\btop\s+([1-8])\b/i);

    return {
      intent: "catalog_sort",
      goal: raw,
      entityType,
      category,
      mention: "",
      topic: "",
      sortBy: wantsNewest ? "createdAt" : wantsPopular ? "popularity" : "price",
      direction: wantsAscending ? "asc" : "desc",
      stock: "any",
      metric: "count",
      limit: topLimitMatch ? Number(topLimitMatch[1]) : 1,
      responseMode: "listing",
      confidence: 0.86
    };
  }

  if (/\b(tell me about|what is|explain)\b/i.test(query)) {
    const detailMention = raw.match(/\b(?:ESP32|Arduino\s+Uno|HC-?SR04|TCRT5000|L298N|TB6612FNG|DRV8833|SG90|DHT11|PWM)\b/i)?.[0] || "";

    if (detailMention && detailMention.toLowerCase() !== "pwm") {
      return {
        intent: "catalog_detail",
        goal: raw,
        entityType: "all",
        category,
        mention: detailMention,
        topic: "",
        sortBy: "name",
        direction: "asc",
        stock: "any",
        metric: "count",
        limit: 1,
        responseMode: "detail",
        confidence: 0.82
      };
    }

    if (detailMention.toLowerCase() === "pwm" || /\b(pwm|pulse width modulation)\b/i.test(query)) {
      return {
        intent: "robotics_education",
        goal: raw,
        entityType: "all",
        category: "",
        mention: "",
        topic: "PWM",
        sortBy: "name",
        direction: "asc",
        stock: "any",
        metric: "count",
        limit: 0,
        responseMode: "educational",
        confidence: 0.82
      };
    }
  }

  if (/\bbeginners?\b|\bstarter\b/i.test(query) && /\b(good|best|products?|kits?|parts?)\b/i.test(query)) {
    return {
      intent: "catalog_filter",
      goal: raw,
      entityType,
      category,
      mention: "",
      topic: "beginner",
      sortBy: "popularity",
      direction: "desc",
      stock: "any",
      metric: "count",
      limit: 8,
      responseMode: "listing",
      confidence: 0.78
    };
  }

  if (/\bwhy\b.*\bmotor driver\b|\bwhat is\b.*\bmotor driver\b|\bhow does\b.*\b(line[\s-]*following|ultrasonic|sensor|motor driver)\b/i.test(query)) {
    return {
      intent: "robotics_education",
      goal: raw,
      entityType: "all",
      category: "",
      mention: "",
      topic: query.includes("motor driver") ? "motor driver" : query.includes("line") ? "line follower" : query.includes("ultrasonic") ? "ultrasonic sensor" : "robotics",
      sortBy: "name",
      direction: "asc",
      stock: "any",
      metric: "count",
      limit: 3,
      responseMode: "educational",
      confidence: 0.72
    };
  }

  const projectTypes = unique([
    ...detectProjectTypes(query),
    ...(query.includes("greenhouse") || query.includes("weather station") || rawLower.includes("ផ្ទះកញ្ចក់") || rawLower.includes("ដំណាំ")
      ? ["environment_monitoring"]
      : []),
    ...(query.includes("controlled by phone") || query.includes("phone control") || rawLower.includes("ទូរស័ព្ទ")
      ? ["wireless_control", "robot_car"]
      : [])
  ]);
  const moneyRange = parseMoneyRange(query);
  const wantsMostExpensive = /\b(most expensive|highest price|priciest)\b/.test(query) || query.includes("expensive") || rawLower.includes("ថ្លៃបំផុត");
  const wantsCheapest = /\b(cheapest|lowest price|cheap|low price)\b/.test(query) || rawLower.includes("ថោកបំផុត");
  const comparisonMention = inferProductMentionAfterComparison(rawLower) || inferProductMentionAfterComparison(query);
  const isPriceComparison =
    Boolean(comparisonMention) &&
    (/\b(more expensive than|higher than|above|greater than|cheaper than|less than|lower than)\b/.test(query) ||
      /ថ្លៃជាង|តម្លៃខ្ពស់ជាង|ថោកជាង/.test(rawLower));
  const projectQuestion =
    projectTypes.length > 0 &&
    /\b(can i build|what project|project|which parts|what sensor|should i use|how can i|how to|make|build|controlled by phone|greenhouse)\b/.test(query) ||
    /ទូរស័ព្ទ|ផ្ទះកញ្ចក់|ដំណាំ/.test(rawLower);

  if (isPriceComparison || Object.keys(moneyRange).length || wantsMostExpensive || wantsCheapest) {
    const filters = { stock: "any", ...moneyRange };

    if (isPriceComparison) {
      filters.priceComparison = {
        operator: /\b(cheaper than|less than|lower than)\b/.test(query) || /ថោកជាង/.test(rawLower) ? "lt" : "gt",
        referenceProduct: comparisonMention
      };
    }

    return {
      intent: "catalog_query",
      goal: raw,
      itemType: isKitQuery && !isProductQuery ? "kit" : isProductQuery && !isKitQuery ? "product" : "all",
      categories,
      projectTypes,
      productMentions: comparisonMention ? [comparisonMention] : [],
      neededCategories: [],
      filters,
      sort: {
        field: "price",
        direction: wantsCheapest || /\b(cheaper than|less than|lower than|under|below)\b/.test(query) ? "asc" : "desc"
      },
      needsStoreProducts: true,
      needsGeneralRoboticsKnowledge: false,
      responseMode: "listing",
      confidence: 0.78
    };
  }

  if (projectQuestion) {
    const neededCategories = [];

    if (projectTypes.includes("environment_monitoring")) {
      neededCategories.push("Sensors", "Controllers", "Displays", "Power", "IoT & Communication");
    }

    if (projectTypes.includes("wireless_control") || projectTypes.includes("iot_robot")) {
      neededCategories.push("IoT & Communication", "Controllers", "Power", "Motors & Drivers");
    }

    if (projectTypes.includes("robot_car")) {
      neededCategories.push("Controllers", "Motors & Drivers", "Power", "Accessories", "Sensors", "IoT & Communication");
    }

    const productMentions = raw.match(/\b[A-Z]{2,}\d+[A-Z0-9-]*\b|\bDHT\d+\b|\bOLED\b|\bESP32\b|\bArduino\s+Uno\b|\bBluetooth\b/gi) || [];

    return {
      intent: /\bhow\b/.test(query) ? "how_to_build" : "recommend_project_parts",
      goal: raw,
      itemType: "product",
      categories: [],
      projectTypes: projectTypes.length ? projectTypes : ["general_robotics"],
      productMentions: unique(productMentions),
      neededCategories: unique(neededCategories),
      filters: { stock: "any" },
      sort: { field: "relevance", direction: "desc" },
      needsStoreProducts: true,
      needsGeneralRoboticsKnowledge: true,
      responseMode: /\bwhich parts|what sensor|should i use\b/.test(query) ? "project_recommendation" : "educational",
      confidence: 0.7
    };
  }

  const wantsProduct =
    /\b(i want|i need|looking for|buy|purchase)\b/.test(query) || /ចង់បាន|ចង់ទិញ|ត្រូវការ/.test(rawLower);

  const isShoppingQuery =
    wantsProduct ||
    isKitQuery ||
    isProductQuery ||
    /\b(show|find|get|buy|recommend|suggest|list|price|stock|how much|available)\b/.test(query);

  if (!isShoppingQuery) {
    return {
      intent: "robotics_education",
      goal: raw,
      entityType: "all",
      category: "",
      mention: "",
      topic: raw,
      sortBy: "name",
      direction: "asc",
      stock: "any",
      metric: "count",
      limit: 3,
      responseMode: "educational",
      confidence: 0.5
    };
  }

  return null;
}

export function validateAiChatPlan(plan, { knownCategories = [], knownProjectTypes = AI_PROJECT_TYPES, allowUnresolvedProductMentions = false } = {}) {
  if (!plan || typeof plan !== "object" || Array.isArray(plan)) {
    return null;
  }

  const allowedTopLevelFields = new Set([
    "intent",
    "goal",
    "itemType",
    "categories",
    "projectTypes",
    "productMentions",
    "neededCategories",
    "filters",
    "sort",
    "needsStoreProducts",
    "needsGeneralRoboticsKnowledge",
    "responseMode",
    "confidence",
    "entityType",
    "category",
    "mention",
    "topic",
    "sortBy",
    "direction",
    "stock",
    "metric",
    "limit"
  ]);

  for (const key of Object.keys(plan)) {
    if (!allowedTopLevelFields.has(key)) {
      return null;
    }
  }

  if (!AI_CHAT_INTENTS.includes(plan.intent)) {
    return null;
  }

  const confidence = Number(plan.confidence);
  if (!Number.isFinite(confidence) || confidence < MIN_AI_PLAN_CONFIDENCE) {
    return null;
  }

  const rawCategories = cleanStringArray(plan.categories);
  const category = cleanString(plan.category);
  const categories = rawCategories.filter((categoryName) => knownCategories.includes(categoryName));
  if (rawCategories.length !== categories.length || (category && !knownCategories.includes(category))) {
    return null;
  }

  const projectTypes = cleanStringArray(plan.projectTypes).filter((projectType) => knownProjectTypes.includes(projectType));
  if (cleanStringArray(plan.projectTypes).length !== projectTypes.length) {
    return null;
  }

  const neededCategories = cleanStringArray(plan.neededCategories).filter(
    (category) => knownCategories.includes(category) || VIRTUAL_NEEDS_CATEGORIES.includes(category)
  );
  if (cleanStringArray(plan.neededCategories).length !== neededCategories.length) {
    return null;
  }

  const filters = {};
  const rawFilters = plan.filters && typeof plan.filters === "object" && !Array.isArray(plan.filters) ? plan.filters : {};
  const allowedFilterFields = new Set(["priceMin", "priceMax", "priceComparison", "stock"]);

  for (const key of Object.keys(rawFilters)) {
    if (!allowedFilterFields.has(key)) {
      return null;
    }
  }

  if (rawFilters.priceMin !== undefined) {
    const priceMin = Number(rawFilters.priceMin);
    if (!Number.isFinite(priceMin) || priceMin < 0) return null;
    filters.priceMin = priceMin;
  }

  if (rawFilters.priceMax !== undefined) {
    const priceMax = Number(rawFilters.priceMax);
    if (!Number.isFinite(priceMax) || priceMax < 0) return null;
    filters.priceMax = priceMax;
  }

  if (filters.priceMin !== undefined && filters.priceMax !== undefined && filters.priceMin > filters.priceMax) {
    return null;
  }

  if (rawFilters.stock !== undefined) {
    if (!ALLOWED_STOCK_FILTERS.includes(rawFilters.stock)) return null;
    filters.stock = rawFilters.stock;
  }

  if (rawFilters.priceComparison !== undefined) {
    const comparison = rawFilters.priceComparison;
    if (!comparison || typeof comparison !== "object" || Array.isArray(comparison)) return null;
    if (!ALLOWED_OPERATORS.includes(comparison.operator)) return null;
    const referenceProduct = cleanString(comparison.referenceProduct);
    if (!referenceProduct) return null;
    filters.priceComparison = {
      operator: comparison.operator,
      referenceProduct
    };
  }

  const sort = {};
  if (plan.sort !== undefined) {
    if (!plan.sort || typeof plan.sort !== "object" || Array.isArray(plan.sort)) return null;
    const allowedSortKeys = new Set(["field", "direction"]);
    for (const key of Object.keys(plan.sort)) {
      if (!allowedSortKeys.has(key)) return null;
    }
    if (!ALLOWED_SORT_FIELDS.includes(plan.sort.field)) return null;
    if (!ALLOWED_DIRECTIONS.includes(plan.sort.direction)) return null;
    sort.field = plan.sort.field;
    sort.direction = plan.sort.direction;
  }

  const entityType = plan.entityType === undefined ? undefined : cleanString(plan.entityType);
  if (entityType !== undefined && !ALLOWED_ITEM_TYPES.includes(entityType)) {
    return null;
  }

  const itemType = plan.itemType === undefined ? entityType || "all" : plan.itemType;
  if (!ALLOWED_ITEM_TYPES.includes(itemType)) {
    return null;
  }

  if (plan.responseMode !== undefined && !AI_RESPONSE_MODES.includes(plan.responseMode)) {
    return null;
  }

  const productMentions = cleanStringArray(plan.productMentions);
  if (!allowUnresolvedProductMentions && productMentions.length && plan.intent === "fallback") {
    return null;
  }

  const sortBy = cleanString(plan.sortBy);
  if (sortBy && !ALLOWED_SORT_FIELDS.filter((field) => field !== "relevance").includes(sortBy)) {
    return null;
  }

  const direction = cleanString(plan.direction);
  if (direction && !ALLOWED_DIRECTIONS.includes(direction)) {
    return null;
  }

  const stock = cleanString(plan.stock);
  if (stock && !ALLOWED_STOCK_FILTERS.includes(stock)) {
    return null;
  }

  const metric = cleanString(plan.metric);
  if (metric && !ALLOWED_CATEGORY_METRICS.includes(metric)) {
    return null;
  }

  const limit = plan.limit === undefined ? undefined : Number(plan.limit);
  if (limit !== undefined && (!Number.isInteger(limit) || limit < 0 || limit > 8 || (limit < 1 && plan.intent !== "robotics_education"))) {
    return null;
  }

  return {
    intent: plan.intent,
    goal: cleanString(plan.goal) || plan.intent,
    itemType,
    entityType: entityType || itemType,
    categories,
    category,
    projectTypes,
    productMentions,
    mention: cleanString(plan.mention),
    topic: cleanString(plan.topic),
    neededCategories,
    filters,
    sort: sort.field ? sort : undefined,
    sortBy: sortBy || undefined,
    direction: direction || undefined,
    stock: stock || undefined,
    metric: metric || undefined,
    limit: limit === undefined ? undefined : limit,
    needsStoreProducts: Boolean(plan.needsStoreProducts),
    needsGeneralRoboticsKnowledge: Boolean(plan.needsGeneralRoboticsKnowledge || plan.intent === "robotics_education"),
    responseMode: plan.responseMode || (ALLOWED_STORE_DATA_INTENTS.includes(plan.intent) ? "listing" : "fallback"),
    confidence: Math.min(1, Math.max(0, confidence))
  };
}

export async function buildAiChatPlan({ userMessage, normalizedQuery, language, catalogSummary, knownCategories, knownProjectTypes }) {
  const localPlan = buildLocalPlan({ userMessage, normalizedQuery, language, knownCategories });

  if (!isAiPlannerEnabled()) {
    return validateAiChatPlan(localPlan, { knownCategories, knownProjectTypes, allowUnresolvedProductMentions: true });
  }

  const content = await callAiChat([
    {
      role: "system",
      content: "You create strict JSON plans for a grounded ecommerce robotics chatbot. Return JSON only."
    },
    {
      role: "user",
      content: buildPlannerPrompt({
        userMessage,
        normalizedQuery,
        language,
        catalogSummary,
        knownCategories,
        knownProjectTypes
      })
    }
  ], { maxTokens: 500 });
  const modelPlan = validateAiChatPlan(extractJsonObject(content), {
    knownCategories,
    knownProjectTypes,
    allowUnresolvedProductMentions: true
  });

  return modelPlan || validateAiChatPlan(localPlan, { knownCategories, knownProjectTypes, allowUnresolvedProductMentions: true });
}
