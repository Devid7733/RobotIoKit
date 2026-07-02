const NEWS_FEEDS = [
  { source: "IEEE Spectrum", url: "https://spectrum.ieee.org/feeds/topic/robotics.rss" },
  { source: "The Robot Report", url: "https://www.therobotreport.com/feed/" },
  { source: "Robohub", url: "https://robohub.org/feed/" },
  { source: "ScienceDaily", url: "https://www.sciencedaily.com/rss/computers_math/robotics.xml" }
];

const FEED_TIMEOUT_MS = 6000;
const CACHE_TTL_MS = Number(process.env.NEWS_CACHE_TTL_MINUTES || 30) * 60 * 1000;
const SUMMARY_MAX_LENGTH = 220;

// Per warm serverless instance only; cold starts pay one refetch, bounded by
// FEED_TIMEOUT_MS per feed. next.revalidate below covers the cross-instance case
// via the Vercel Data Cache.
let newsCache = { items: [], fetchedAt: 0, inflight: null };

function decodeEntities(text = "") {
  return text
    .replace(/&#(\d+);/g, (_, code) => {
      const parsed = Number(code);
      return Number.isFinite(parsed) ? String.fromCodePoint(parsed) : "";
    })
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => {
      const parsed = Number.parseInt(code, 16);
      return Number.isFinite(parsed) ? String.fromCodePoint(parsed) : "";
    })
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function getTag(block, name) {
  const match = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i"));
  if (!match) {
    return "";
  }

  let value = match[1].trim();
  const cdata = value.match(/^<!\[CDATA\[([\s\S]*?)\]\]>$/);
  if (cdata) {
    value = cdata[1].trim();
  }

  return decodeEntities(value.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

export function parseRssItems(xml = "", source = "") {
  const items = [];
  const blocks = String(xml).match(/<item[\s>][\s\S]*?<\/item>/gi) || [];

  for (const block of blocks) {
    const title = getTag(block, "title");
    const link = getTag(block, "link");

    if (!title) {
      continue;
    }

    const pubDateRaw = getTag(block, "pubDate") || getTag(block, "dc:date");
    const publishedAt = pubDateRaw ? new Date(pubDateRaw) : null;
    let summary = getTag(block, "description");

    if (summary.length > SUMMARY_MAX_LENGTH) {
      summary = `${summary.slice(0, SUMMARY_MAX_LENGTH).replace(/\s+\S*$/, "")}…`;
    }

    items.push({
      title,
      link,
      source,
      publishedAt: publishedAt && !Number.isNaN(publishedAt.getTime()) ? publishedAt : null,
      summary
    });
  }

  return items;
}

async function fetchFeed(feed) {
  const response = await fetch(feed.url, {
    headers: { "User-Agent": "RobotIoKitBot/1.0 (+robot news for store chatbot)" },
    signal: AbortSignal.timeout(FEED_TIMEOUT_MS),
    next: { revalidate: 1800 }
  });

  if (!response.ok) {
    throw new Error(`Feed ${feed.source} responded with status ${response.status}.`);
  }

  return parseRssItems(await response.text(), feed.source);
}

async function refreshNews({ limit, maxAgeDays }) {
  const results = await Promise.allSettled(NEWS_FEEDS.map((feed) => fetchFeed(feed)));
  const merged = [];
  const seenTitles = new Set();
  const cutoff = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;

  const allItems = results
    .filter((result) => result.status === "fulfilled")
    .flatMap((result) => result.value)
    .sort((a, b) => (b.publishedAt?.getTime() || 0) - (a.publishedAt?.getTime() || 0));

  for (const item of allItems) {
    const titleKey = item.title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

    if (seenTitles.has(titleKey)) {
      continue;
    }

    if (item.publishedAt && item.publishedAt.getTime() < cutoff) {
      continue;
    }

    seenTitles.add(titleKey);
    merged.push(item);

    if (merged.length >= limit) {
      break;
    }
  }

  if (!merged.length) {
    throw new Error("No robot news items could be fetched from any feed.");
  }

  return merged;
}

export async function getRobotNews({ limit = 8, maxAgeDays = 30 } = {}) {
  const now = Date.now();

  if (newsCache.items.length && now - newsCache.fetchedAt < CACHE_TTL_MS) {
    console.info("[news] cache_hit", { items: newsCache.items.length });
    return newsCache.items.slice(0, limit);
  }

  if (!newsCache.inflight) {
    newsCache.inflight = refreshNews({ limit: Math.max(limit, 8), maxAgeDays })
      .then((items) => {
        newsCache = { items, fetchedAt: Date.now(), inflight: null };
        console.info("[news] refresh", { items: items.length });
        return items;
      })
      .catch((error) => {
        newsCache.inflight = null;
        console.warn("[news] refresh_failed, serving stale cache.", error.message);
        // stale-on-error: keep whatever we had, even past TTL
        return newsCache.items;
      });
  }

  const items = await newsCache.inflight;
  return (items || []).slice(0, limit);
}

export function formatNewsDate(publishedAt) {
  if (!publishedAt) {
    return "recent";
  }

  return publishedAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function buildNewsContext(items = []) {
  return items
    .map(
      (item, index) =>
        `${index + 1}. [${item.source} — ${formatNewsDate(item.publishedAt)}] ${item.title}${item.summary ? ` — ${item.summary}` : ""}`
    )
    .join("\n");
}
