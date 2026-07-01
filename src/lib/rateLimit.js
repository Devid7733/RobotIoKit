const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 10;

// Module-level store persists across requests within the same Node.js process.
const store = new Map();

/**
 * Returns true if the request is allowed, false if the IP has exceeded the limit.
 * Entries are cleaned up lazily when their window expires.
 */
export function rateLimit(ip) {
  const now = Date.now();
  const entry = store.get(ip);

  if (!entry || now > entry.resetAt) {
    store.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }

  entry.count += 1;
  return entry.count <= MAX_REQUESTS;
}
