import { chatbotRules } from "@/modules/chatbot/chatbot.config";

function getSearchableFields(item) {
  const voltageText = Array.isArray(item.voltages) ? item.voltages.join(" ") : item.voltage;

  return [item.name, item.description, item.overview, item.category, item.level, voltageText]
    .map((value) => String(value || "").toLowerCase())
    .filter(Boolean);
}

export function findCatalogMatches(message, catalogItems = []) {
  const lower = String(message || "").toLowerCase();
  const terms = lower.split(/\s+/).filter((word) => word.length > 2);

  const matches = catalogItems.filter((item) => {
    const searchableText = getSearchableFields(item).join(" ");
    return searchableText.includes(lower) || terms.some((word) => searchableText.includes(word));
  });

  return matches.slice(0, 3);
}

export function findMatchingRule(message) {
  const input = String(message || "").trim().toLowerCase();

  return chatbotRules.find((rule) => rule.intents.some((intent) => input.includes(intent.toLowerCase()))) || null;
}
