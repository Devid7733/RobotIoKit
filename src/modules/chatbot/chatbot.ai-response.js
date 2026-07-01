import { callAiChat } from "@/lib/ai-chat";

const PROTECTED_FLOW_PATTERNS = [
  /\border\s+(?:status|history|tracking|number)\b/i,
  /\bpayment\s+status\b/i,
  /\bcheckout\b/i,
  /\blog(?:in|ged|ging)?\b/i,
  /\bsign\s*in\b/i,
  /\bauth(?:entication|orization)?\b/i,
  /\bemail\s+verification\b/i,
  /\bverify\s+email\b/i,
  /\badmin\b/i,
  /\bsettings?\b/i,
  /ស្ថានភាព/i,
  /បញ្ជាទិញ/i,
  /ទូទាត់/i,
  /ចូល/i,
  /ផ្ទៀងផ្ទាត់/i
];

const UNSAFE_OUTPUT_PATTERNS = [
  /(?:\/products|\/robot-kits)\//i,
  /\b(?:Recommended matches|Matched products|Matched kits|top matched|ranking|score|database result|raw sql)\b/i,
  /^\s*[{[]/,
  /```/
];

function isChatbotAiEnabled() {
  return String(process.env.CHATBOT_AI_ENABLED || "").toLowerCase() === "true";
}

function cleanText(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function unique(values = []) {
  return [...new Set(values.map(cleanText).filter(Boolean))];
}

function getPriceValues(items = []) {
  return items.map((item) => Number(item.price)).filter((price) => Number.isFinite(price));
}

function getFilterSummary(reply = "") {
  const text = cleanText(reply);
  const priceMatch =
    text.match(/\b(?:under|below|above|over|between|cheaper than|more expensive than)\s+\$?\d+(?:\.\d+)?(?:\s+(?:and|to)\s+\$?\d+(?:\.\d+)?)?/i) ||
    text.match(/\$?\d+(?:\.\d+)?\s*(?:and|to|-)\s*\$?\d+(?:\.\d+)?/i);

  return priceMatch ? priceMatch[0] : "";
}

function containsProtectedFlowText(message = "", reply = "") {
  const text = `${message || ""} ${reply || ""}`;
  return PROTECTED_FLOW_PATTERNS.some((pattern) => pattern.test(text));
}

function containsItemName(reply = "", itemNames = []) {
  const text = cleanText(reply).toLowerCase();

  return itemNames.some((name) => {
    const normalizedName = cleanText(name).toLowerCase();
    return normalizedName && text.includes(normalizedName);
  });
}

function extractMoneyValues(reply = "") {
  return [...String(reply || "").matchAll(/\$\s*(\d+(?:\.\d+)?)/g)].map((match) => Number(match[1]));
}

function hasOnlyAllowedPrices(reply = "", context = {}) {
  const outputPrices = extractMoneyValues(reply);

  if (!outputPrices.length) {
    return true;
  }

  const itemPrices = getPriceValues(context.items || []);
  const filterPrices = extractMoneyValues(context.filterSummary || "");
  const fallbackPrices = extractMoneyValues(context.fallbackReply || "");
  const allowedPrices = [...itemPrices, ...filterPrices, ...fallbackPrices];

  return outputPrices.every((price) => allowedPrices.some((allowedPrice) => Math.abs(Number(allowedPrice) - Number(price)) < 0.01));
}

function isValidAiReply(reply = "", context = {}) {
  const text = cleanText(reply);

  if (!text || text.length > 420) {
    return false;
  }

  if (UNSAFE_OUTPUT_PATTERNS.some((pattern) => pattern.test(text))) {
    return false;
  }

  if (!hasOnlyAllowedPrices(text, context)) {
    return false;
  }

  if (!context.allowItemNames && containsItemName(text, context.itemNames || [])) {
    return false;
  }

  return true;
}

export function buildChatbotResponseContext({ message = "", reply = "", response = {} } = {}) {
  const items = Array.isArray(response.catalogMatches) ? response.catalogMatches : [];
  const itemNames = unique(items.map((item) => item.name || item.title));
  const categories = unique(items.map((item) => item.category));
  const itemTypes = unique(items.map((item) => (item.type === "project" ? "robot project" : item.type === "kit" ? "robot kit" : "product")));
  const projectTypes = unique(items.flatMap((item) => (Array.isArray(item.projectTypes) ? item.projectTypes : [])));
  const priceValues = getPriceValues(items);

  return {
    language: response.language || "en",
    intent: response.detectedIntent || response.responseMode || "catalog_response",
    responseMode: response.responseMode || null,
    resultCount: items.length,
    itemTypes,
    categories,
    projectTypes,
    filterSummary: getFilterSummary(reply),
    priceRange: priceValues.length
      ? {
          min: Math.min(...priceValues),
          max: Math.max(...priceValues)
        }
      : null,
    itemNames,
    fallbackReply: cleanText(reply),
    allowItemNames: Boolean(response.catalogContext?.includeDescriptions),
    shouldRewrite:
      isChatbotAiEnabled() &&
      items.length > 0 &&
      !response.modelPrompt &&
      response.responseMode !== "fallback" &&
      !containsProtectedFlowText(message, reply)
  };
}

function buildAiResponsePrompt(context) {
  const responseLanguage = context.language === "km" ? "Khmer" : "English";
  const itemNameRule = context.allowItemNames
    ? "You may mention product names only if they appear in itemNames."
    : "Do not mention product names; product cards already show them.";

  return `Rewrite the deterministic chatbot fallback into one short customer-facing sentence.

Use only this structured application result:
${JSON.stringify(context, null, 2)}

Rules:
- Respond in ${responseLanguage}.
- Preserve the meaning of fallbackReply.
- Use only provided categories, item types, project types, counts, filters, and prices.
- Do not invent products, robot kits, prices, stock, categories, compatibility, availability, specifications, policies, or URLs.
- ${itemNameRule}
- Do not list items one by one.
- Do not mention internal ranking, scores, routes, SQL, database implementation, or AI.
- Keep it natural, concise, and helpful.`;
}

export async function rewriteChatbotReplyWithAi({ message = "", reply = "", response = {} } = {}) {
  const context = buildChatbotResponseContext({ message, reply, response });

  if (!context.shouldRewrite) {
    return reply;
  }

  const rewrittenReply = await callAiChat([
    {
      role: "system",
      content:
        "You are a safe wording layer for RobotIoKit. Application logic already selected the products and facts. You only rewrite wording, and you must not add facts."
    },
    {
      role: "user",
      content: buildAiResponsePrompt(context)
    }
  ]);
  const cleanedReply = cleanText(rewrittenReply);

  return isValidAiReply(cleanedReply, context) ? cleanedReply : reply;
}
