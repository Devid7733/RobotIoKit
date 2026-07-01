export function getDeliveryFee(location = "") {
  const normalized = location.trim().toLowerCase();
  return normalized.includes("phnom penh") ? 1.5 : 2.5;
}
