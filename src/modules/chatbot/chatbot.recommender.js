import {
  executeRecommendationPlan,
  recommendationNeededCategoryMatches,
  searchDeterministicRecommendations
} from "@/modules/recommendation/recommendation.service";

export function findDeterministicCatalogRecommendations(options = {}) {
  return searchDeterministicRecommendations(options);
}

export function executeChatbotRecommendationPlan(options = {}) {
  return executeRecommendationPlan(options);
}

export function recommendationGroupMatches(entry, category) {
  return recommendationNeededCategoryMatches(entry, category);
}
