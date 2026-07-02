import { buildNewsContext, formatNewsDate, getRobotNews } from "@/lib/robot-news";

const EXPLICIT_NEWS_PATTERN = /\b(news|headlines?)\b|ព័ត៌មានថ្មី|ដំណឹងថ្មី/i;

const NEWS_INTENT_PATTERN =
  /\b(news|headlines?|what'?s\s+(new|happening)|latest\s+(in|on|about)\s+(robotics|robots?|ai|tech(nology)?)|recent\s+(developments?|advances?|breakthroughs?)\b|robot(ics)?\s+(this\s+(week|month|year)|trends?|trending))\b/i;

const KHMER_NEWS_WORDS = /ព័ត៌មាន|ដំណឹង|បច្ចុប្បន្នភាព/;
const KHMER_TOPIC_WORDS = /រ៉ូបូត|បច្ចេកវិទ្យា/;

const STORE_TERMS_PATTERN =
  /\b(price|stock|buy|order|kits?|products?|delivery|in\s+store|available|availability)\b|តម្លៃ|ទិញ|ឈុត|ដឹកជញ្ជូន/i;

export function isChatbotNewsEnabled() {
  return String(process.env.CHATBOT_NEWS_ENABLED || "true").toLowerCase() !== "false";
}

// Detection uses ONLY the raw message, never the synonym-normalized input:
// the normalizer maps ព័ត៌មាន (also plain "information") to the token "news"
// and រ៉ូបូត to "kit ... robot", so normalized text would both steal
// product-info questions and block genuine Khmer news questions.
export function detectNewsIntent(rawMessage = "") {
  if (!isChatbotNewsEnabled()) {
    return false;
  }

  const raw = String(rawMessage || "");
  const hasExplicitNewsWord = EXPLICIT_NEWS_PATTERN.test(raw);

  // Store terms win over vague news phrasing ("latest robot kits" stays a
  // catalog query) unless the user literally says news/ព័ត៌មានថ្មី.
  if (STORE_TERMS_PATTERN.test(raw) && !hasExplicitNewsWord) {
    return false;
  }

  if (NEWS_INTENT_PATTERN.test(raw)) {
    return true;
  }

  return KHMER_NEWS_WORDS.test(raw) && KHMER_TOPIC_WORDS.test(raw);
}

function getNewsFollowUps(language = "en") {
  return language === "km"
    ? ["ព័ត៌មានរ៉ូបូតបន្ថែម", "បង្ហាញឈុតរ៉ូបូត", "តើខ្ញុំអាចសាងសង់គម្រោងអ្វីបាន?"]
    : ["More robot news", "Show robot kits", "What robot projects can I build?"];
}

function getNewsFallbackReply(items = [], language = "en") {
  if (!items.length) {
    return language === "km"
      ? "សូមអភ័យទោស ខ្ញុំមិនអាចទាញយកព័ត៌មានរ៉ូបូតថ្មីៗបានទេឥឡូវនេះ។ សូមសាកល្បងម្តងទៀតបន្តិចក្រោយ។"
      : "Sorry, I couldn't fetch the latest robot news right now. Please try again in a moment.";
  }

  const heading =
    language === "km" ? "នេះជាព័ត៌មានរ៉ូបូតថ្មីៗពីប្រភពល្បីៗ៖" : "Here are the latest robot news headlines from trusted sources:";
  const lines = items.slice(0, 3).map((item, index) => {
    const date = formatNewsDate(item.publishedAt);
    return `${index + 1}. ${item.title} (${item.source}, ${date})${item.link ? ` — ${item.link}` : ""}`;
  });

  return [heading, ...lines].join("\n");
}

function buildNewsModelPrompt({ message, newsContext, language }) {
  const responseLanguage = language === "km" ? "Khmer" : "English";

  return `User message:
${message}

Detected language:
${responseLanguage}

ROBOT NEWS CONTEXT (fetched from public robotics news RSS feeds; the ONLY current news you may cite):
${newsContext}

Rules:
- Summarize and discuss ONLY the headlines above; name the source and date for each item you mention.
- You may add background explanation from general robotics knowledge, but never invent events, dates, product launches, or announcements.
- If the question is not covered by these headlines, say so and offer the closest related items.
- Pick the 3-5 most relevant/interesting items unless the user asks about a specific topic.
- If the detected language is Khmer, summarize naturally in Khmer, keeping company names, robot names, and source names in English.
- Answer in ${responseLanguage}.`;
}

export async function getNewsResponse(rawMessage, language = "en") {
  const items = await getRobotNews({ limit: 8 });
  const newsItems = items.map((item) => ({
    title: item.title,
    link: item.link,
    source: item.source,
    publishedAt: item.publishedAt ? item.publishedAt.toISOString() : null,
    publishedAtText: formatNewsDate(item.publishedAt),
    summary: item.summary
  }));

  return {
    reply: getNewsFallbackReply(items, language),
    catalogMatches: [],
    catalogSummary: null,
    newsItems,
    followUps: getNewsFollowUps(language),
    modelPrompt: items.length ? buildNewsModelPrompt({ message: rawMessage, newsContext: buildNewsContext(items), language }) : null,
    modelPromptMode: "news",
    responseMode: "news"
  };
}
