"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import Icon from "@/components/common/Icon";

const STORAGE_KEY = "robotiokit-chat-history";
const FIXED_FOLLOW_UPS = ["What robot projects I can build", "Store location", "Delivery fee"];

const quickPrompts = {
  en: [
    "What robot projects can I build?",
    "Track my order",
    "Build a line-following robot",
    "Build an obstacle-avoiding robot",
    "Store location",
    "Delivery fee information"
  ],
  km: [
    "បង្ហាញ robot kits ប៉ុណ្ណោះ",
    "ស្ថានភាពការបញ្ជាទិញរបស់ខ្ញុំ",
    "ខ្ញុំចង់ធ្វើឡានរ៉ូបូតពេញលេញ",
    "គម្រោង Arduino សម្រាប់អ្នកចាប់ផ្តើម",
    "បង្ហាញ sensor តម្លៃថោក"
  ]
};

const fallbackPrompts = {
  en: ["Show robot kits only", "Build a complete robot car", "Show cheap sensors"],
  km: ["បង្ហាញ robot kits ប៉ុណ្ណោះ", "ខ្ញុំចង់ធ្វើឡានរ៉ូបូតពេញលេញ", "បង្ហាញ sensor តម្លៃថោក"]
};

fallbackPrompts.en = FIXED_FOLLOW_UPS;
fallbackPrompts.km = FIXED_FOLLOW_UPS;

function sanitizeRecommendedItem(item) {
  return {
    id: item.id || "",
    name: item.name || "",
    title: item.title || item.name || "",
    type: item.type || "product",
    slug: item.slug || "",
    routeUrl: item.routeUrl || "",
    category: item.category || "",
    price: item.price ?? null,
    stock: item.stock ?? null,
    description: item.description || "",
    specifications: item.specifications || [],
    voltage: item.voltage || "",
    voltages: item.voltages || [],
    compatibility: item.compatibility || item.compatibilityInfo || [],
    compatibilityInfo: item.compatibilityInfo || item.compatibility || [],
    parts: item.parts || [],
    locationLink: item.locationLink || "",
    group: item.group || "",
    level: item.level || "",
    query: item.query || "",
    projectTypes: item.projectTypes || [],
    includeDescription: Boolean(item.includeDescription),
    displayMode: item.displayMode || (item.includeDescription ? "detail" : "listing")
  };
}

function createWelcomeMessage(language = "en") {
  return {
    role: "bot",
    content:
      language === "km"
        ? "សួស្តី! សួរខ្ញុំអំពី robot kits, parts, compatibility, KHQR ឬការដឹកជញ្ជូន។"
        : "Hi! I can help you find robot kits, sensors, controllers, motors, and beginner parts.",
    items: [],
    followUps: [],
    language
  };
}

function detectKhmer(value) {
  return /[\u1780-\u17ff]/.test(String(value || ""));
}

function formatPrice(price) {
  return price === null || price === undefined ? "Price unavailable" : `$${Number(price).toFixed(2)}`;
}

function getStockState(item) {
  if (item.type === "project") {
    return { label: "Project", tone: "bg-blue-50 text-blue-700" };
  }

  if (item.stock === null || item.stock === undefined) {
    return { label: "Check stock", tone: "bg-slate-100 text-slate-600" };
  }

  const stock = Number(item.stock || 0);

  if (stock <= 0) {
    return { label: "Out of stock", tone: "bg-red-50 text-red-600" };
  }

  if (stock <= 5) {
    return { label: `Low stock: ${stock}`, tone: "bg-amber-50 text-amber-700" };
  }

  return { label: `In stock: ${stock}`, tone: "bg-emerald-50 text-emerald-700" };
}

function getItemHref(item) {
  if (item.routeUrl) {
    return item.routeUrl;
  }

  if (!item.slug) {
    return null;
  }

  return item.type === "kit" ? `/robot-kits/${item.slug}` : `/products/${item.slug}`;
}

function getItemTypeLabel(item) {
  if (item.type === "project") {
    return "Robot Project";
  }

  if (item.type === "kit") {
    return "Robot Kit";
  }

  return item.category || "Product";
}

function getRecommendationBadges(item) {
  const badges = [];
  const stock = Number(item.stock ?? 0);
  const text = `${item.name || ""} ${item.description || ""} ${item.level || ""} ${(item.reasonLabels || []).join(" ")}`.toLowerCase();

  if (item.level?.toLowerCase() === "beginner" || text.includes("beginner")) {
    badges.push({ label: "Beginner Friendly", tone: "bg-blue-50 text-blue-700" });
  }

  if (text.includes("popular") || text.includes("featured")) {
    badges.push({ label: "Popular", tone: "bg-orange-50 text-orange-700" });
  }

  if (item.stock !== null && item.stock !== undefined && stock > 0) {
    badges.push(stock <= 5 ? { label: "Low Stock", tone: "bg-amber-50 text-amber-700" } : { label: "In Stock", tone: "bg-emerald-50 text-emerald-700" });
  }

  return badges.slice(0, 3);
}

function ProjectCard({ item, onSelect }) {
  const title = item.title || item.name;
  const query = item.query || `Build a ${title}`;

  return (
    <button
      type="button"
      onClick={() => onSelect(query)}
      className="group rounded-2xl border border-blue-100 bg-white p-3 text-left shadow-[0_10px_22px_rgba(15,23,42,0.04)] transition hover:border-brand-blue/30 hover:bg-blue-50/40 focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
    >
      <div className="flex gap-3">
        <div className="flex h-16 w-16 flex-none items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-brand-blue transition group-hover:bg-white">
          <Icon name="chip" className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700">
              Robot Project
            </span>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
              Buildable
            </span>
          </div>
          <div className="mt-1 line-clamp-2 break-words text-sm font-semibold leading-5 text-slate-900 transition group-hover:text-brand-blue" title={title}>
            {title}
          </div>
          <div className="mt-1 text-xs font-medium text-slate-500">Show required parts</div>
        </div>
      </div>
    </button>
  );
}

function RecommendationCard({ item }) {
  const href = getItemHref(item);
  const stockState = getStockState(item);
  const badges = getRecommendationBadges(item);
  const viewLabel = item.type === "kit" ? "View Kit" : "View Product";
  const showDescription = Boolean(item.includeDescription);
  const title = item.title || item.name;
  const image = item.imageUrl ? (
    <img
      src={item.imageUrl}
      alt=""
      className="h-16 w-16 flex-none rounded-xl border border-slate-100 object-cover"
      loading="lazy"
    />
  ) : (
    <div className="flex h-16 w-16 flex-none items-center justify-center rounded-xl bg-slate-100 text-slate-400">
      <Icon name={item.type === "kit" ? "cube" : "package"} className="h-6 w-6" />
    </div>
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-[0_10px_22px_rgba(15,23,42,0.04)]">
      <div className="flex gap-3">
        {href ? (
          <Link href={href} className="flex-none rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue/30" aria-label={`View ${title}`} prefetch={false}>
            {image}
          </Link>
        ) : (
          image
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
              {getItemTypeLabel(item)}
            </span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${stockState.tone}`}>
              {stockState.label}
            </span>
          </div>
          {href ? (
            <Link
              href={href}
              className="mt-1 block min-w-0 text-sm font-semibold leading-5 text-slate-900 transition hover:text-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
              title={title}
              prefetch={false}
            >
              <span className="line-clamp-2 break-words">{title}</span>
            </Link>
          ) : (
            <div className="mt-1 line-clamp-2 break-words text-sm font-semibold leading-5 text-slate-900" title={title}>
              {title}
            </div>
          )}
          <div className="mt-1 text-sm font-bold text-brand-blue">{formatPrice(item.price)}</div>
        </div>
      </div>

      {showDescription && item.description ? <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">{item.description}</p> : null}

      <div className="mt-2 flex flex-wrap gap-1.5">
        {badges.map((badge) => (
          <span key={badge.label} className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${badge.tone}`}>
            {badge.label}
          </span>
        ))}
        {item.voltage ? <span className="rounded-full bg-cyan-50 px-2 py-0.5 text-[10px] font-semibold text-cyan-700">{item.voltage}</span> : null}
        {item.level ? <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-700">{item.level}</span> : null}
      </div>

      {href ? (
        <Link
          href={href}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
          prefetch={false}
        >
          {viewLabel}
          <Icon name="arrowRight" className="h-4 w-4" />
        </Link>
      ) : null}
    </div>
  );
}

function groupRecommendationItems(items = []) {
  return items.reduce((groups, item) => {
    const group = item.group || "";
    const existing = groups.find((entry) => entry.group === group);

    if (existing) {
      existing.items.push(item);
      return groups;
    }

    groups.push({ group, items: [item] });
    return groups;
  }, []);
}

function RecommendationList({ items, onProjectSelect }) {
  const groups = groupRecommendationItems(items);
  const hasGroups = groups.some((entry) => entry.group);

  if (!hasGroups) {
    return (
      <div className="mt-3 grid gap-2">
        {items.map((catalogItem) => (
          catalogItem.type === "project" ? (
            <ProjectCard key={`${catalogItem.type}-${catalogItem.slug || catalogItem.title}`} item={catalogItem} onSelect={onProjectSelect} />
          ) : (
            <RecommendationCard key={`${catalogItem.type}-${catalogItem.id || catalogItem.slug}`} item={catalogItem} />
          )
        ))}
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-3">
      {groups.map((entry) => (
        <section key={entry.group || "Recommendations"} className="space-y-2">
          {entry.group ? (
            <div className="px-1 text-xs font-bold uppercase tracking-wide text-slate-500">
              {entry.group}
            </div>
          ) : null}
          {entry.items.map((catalogItem) => (
            catalogItem.type === "project" ? (
              <ProjectCard key={`${catalogItem.group || "item"}-${catalogItem.type}-${catalogItem.slug || catalogItem.title}`} item={catalogItem} onSelect={onProjectSelect} />
            ) : (
              <RecommendationCard key={`${catalogItem.group || "item"}-${catalogItem.type}-${catalogItem.id || catalogItem.slug}`} item={catalogItem} />
            )
          ))}
        </section>
      ))}
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="mr-10 rounded-2xl border border-slate-200/80 bg-white px-4 py-3.5 shadow-[0_12px_24px_rgba(15,23,42,0.05)]">
      <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
        <span>Assistant is typing</span>
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-300 [animation-delay:0ms]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-300 [animation-delay:150ms]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-300 [animation-delay:300ms]" />
        </span>
      </div>
    </div>
  );
}

function PromptChips({ prompts, onSelect, disabled }) {
  if (!prompts.length) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {prompts.map((prompt) => (
        <button
          key={prompt}
          type="button"
          onClick={() => onSelect(prompt)}
          className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold leading-5 text-brand-blue transition hover:border-brand-blue/25 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={disabled}
        >
          {prompt}
        </button>
      ))}
    </div>
  );
}

function LinkifiedText({ text }) {
  const parts = String(text || "").split(/(https?:\/\/[^\s]+)/g);

  return parts.map((part, index) => {
    if (!/^https?:\/\//i.test(part)) {
      return part;
    }

    const cleanUrl = part.replace(/[),.]+$/g, "");
    const trailing = part.slice(cleanUrl.length);

    return (
      <span key={`${cleanUrl}-${index}`}>
        <a
          href={cleanUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-brand-blue underline decoration-brand-blue/30 underline-offset-2 hover:decoration-brand-blue"
        >
          Open map
        </a>
        {trailing}
      </span>
    );
  });
}

export default function ChatWindow({ onClose }) {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState("en");
  const [messages, setMessages] = useState([createWelcomeMessage("en")]);
  const [lastRecommendedItems, setLastRecommendedItems] = useState([]);
  const scrollRef = useRef(null);

  const activeQuickPrompts = useMemo(() => quickPrompts[language] || quickPrompts.en, [language]);

  useEffect(() => {
    try {
      const saved = window.sessionStorage.getItem(STORAGE_KEY);

      if (!saved) {
        return;
      }

      const parsed = JSON.parse(saved);

      if (Array.isArray(parsed?.messages) && parsed.messages.length) {
        setMessages(parsed.messages);
      }

      if (parsed?.language === "km" || parsed?.language === "en") {
        setLanguage(parsed.language);
      }

      if (Array.isArray(parsed?.lastRecommendedItems)) {
        setLastRecommendedItems(parsed.lastRecommendedItems.slice(0, 10));
      }
    } catch {
      window.sessionStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ messages, language, lastRecommendedItems }));
  }, [messages, language, lastRecommendedItems]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth"
    });
  }, [messages, isLoading]);

  async function submitMessage(value) {
    const trimmedValue = String(value || "").trim();

    if (!trimmedValue || isLoading) {
      return;
    }

    if (detectKhmer(trimmedValue)) {
      setLanguage("km");
    }

    const history = messages
      .filter((m) => m.role === "user" || m.role === "bot")
      .slice(-6)
      .map((m) => ({ role: m.role === "bot" ? "assistant" : "user", content: m.content }));

    setMessages((prev) => [
      ...prev,
      { role: "user", content: trimmedValue },
      { role: "bot", content: "", items: [], followUps: [], language }
    ]);
    setMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmedValue,
          lastRecommendedItems: lastRecommendedItems.slice(0, 10),
          history
        })
      });

      if (!response.ok || !response.body) {
        throw new Error("Network error");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let botItems = [];
      let botLanguage = language;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const event = JSON.parse(line);

            if (event.type === "meta") {
              botItems = event.items || [];
              botLanguage = event.language || language;
              setLanguage(botLanguage);
              const catalogItems = botItems.filter((item) => item.type !== "project");
              if (catalogItems.length) {
                setLastRecommendedItems(catalogItems.map(sanitizeRecommendedItem).slice(0, 10));
              }
            } else if (event.type === "text") {
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last?.role === "bot") {
                  updated[updated.length - 1] = {
                    ...last,
                    content: last.content + event.delta,
                    items: botItems,
                    language: botLanguage
                  };
                }
                return updated;
              });
            } else if (event.type === "done") {
              if (event.cleanedText) {
                setMessages((prev) => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  if (last?.role === "bot") {
                    updated[updated.length - 1] = { ...last, content: event.cleanedText };
                  }
                  return updated;
                });
              }
            } else if (event.type === "error") {
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last?.role === "bot") {
                  updated[updated.length - 1] = {
                    ...last,
                    content: event.message || "I ran into a problem answering that.",
                    followUps: fallbackPrompts[botLanguage]
                  };
                }
                return updated;
              });
            }
          } catch {
            // skip malformed event lines
          }
        }
      }
    } catch (error) {
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last?.role === "bot") {
          updated[updated.length - 1] = {
            ...last,
            content: error instanceof Error ? error.message : "I ran into a problem answering that.",
            followUps: fallbackPrompts[language]
          };
        }
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    submitMessage(message);
  }

  function clearChat() {
    const freshMessage = createWelcomeMessage(language);
    setMessages([freshMessage]);
    setMessage("");
    setLastRecommendedItems([]);
    window.sessionStorage.removeItem(STORAGE_KEY);
  }

  return (
    <div className="flex h-[min(720px,calc(100dvh-24px))] w-[calc(100vw-24px)] flex-col overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.22)] sm:h-[600px] sm:max-h-[calc(100dvh-120px)] sm:w-[400px]">
      <div className="flex flex-none items-center gap-3 border-b border-blue-500/10 bg-brand-blue px-4 py-3.5 text-white">
        <div className="flex h-10 w-10 flex-none items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20">
          <Icon name="chip" className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-display text-base font-semibold leading-5">Robot Assistant</div>
          <p className="mt-0.5 truncate text-xs leading-5 text-blue-50">Ask about kits, parts, KHQR, or delivery</p>
        </div>
        <button
          type="button"
          onClick={clearChat}
          className="flex h-9 w-9 flex-none items-center justify-center rounded-full text-white/90 transition hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/40"
          aria-label="Clear chat"
          title="Clear chat"
        >
          <Icon name="trash" className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 flex-none items-center justify-center rounded-full text-white/90 transition hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/40"
          aria-label="Minimize chatbot"
          title="Minimize"
        >
          <Icon name="xCircle" className="h-5 w-5" />
        </button>
      </div>

      <div ref={scrollRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-slate-50 px-3.5 py-4 [scrollbar-width:none] sm:px-4 [&::-webkit-scrollbar]:hidden">
        {messages.map((item, index) => {
          const isBot = item.role === "bot";
          const hasNoMatches = isBot && !item.items?.length && item.followUps?.length && index > 0;
          const isWelcome = isBot && index === 0;

          return (
            <div key={`${item.role}-${index}`} className={isBot ? "mr-3" : "ml-auto max-w-[84%]"}>
              <div
                className={`whitespace-pre-wrap break-words rounded-2xl px-4 py-3 text-sm leading-6 ${
                  detectKhmer(item.content) ? "font-sans leading-7" : ""
                } ${
                  isBot
                    ? "border border-slate-200/80 bg-white text-slate-700 shadow-[0_12px_24px_rgba(15,23,42,0.05)]"
                    : "bg-brand-blue text-white shadow-[0_14px_30px_rgba(37,99,235,0.2)]"
                }`}
              >
                <LinkifiedText text={item.content} />
              </div>

              {isWelcome ? (
                <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_12px_24px_rgba(15,23,42,0.04)]">
                  <PromptChips prompts={activeQuickPrompts} onSelect={submitMessage} disabled={isLoading} />
                </div>
              ) : null}

              {item.items?.length ? <RecommendationList items={item.items} onProjectSelect={submitMessage} /> : null}

              {hasNoMatches ? (
                <div className="mt-3 rounded-2xl border border-dashed border-slate-300 bg-white px-3 py-3 text-xs leading-5 text-slate-500">
                  {item.language === "km" ? "សាកល្បងសំណួរទាក់ទងនឹង project, budget ឬ voltage ដើម្បីឲ្យខ្ញុំរកបានត្រឹមត្រូវជាងមុន។" : "Try a project, budget, category, or voltage prompt for better matches."}
                </div>
              ) : null}

              {isBot && item.followUps?.length ? (
                <div className="mt-3">
                  <PromptChips prompts={item.followUps} onSelect={submitMessage} disabled={isLoading} />
                </div>
              ) : null}
            </div>
          );
        })}

        {isLoading && !messages.at(-1)?.content ? <TypingIndicator /> : null}
      </div>

      <div className="flex-none border-t border-slate-200 bg-white px-3.5 py-3.5 sm:px-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            value={message}
            onChange={(event) => {
              const nextValue = event.target.value;
              setMessage(nextValue);
              if (detectKhmer(nextValue)) {
                setLanguage("km");
              }
            }}
            className="input-base rounded-full bg-slate-50 py-2.5 pr-3 text-sm leading-6"
            placeholder={language === "km" ? "សួរអំពី kits, parts ឬតម្លៃ..." : "Ask about kits, parts, or payment..."}
            type="text"
            disabled={isLoading}
          />
          <button
            type="submit"
            className="inline-flex h-11 w-11 flex-none items-center justify-center rounded-full bg-brand-blue text-white shadow-[0_12px_24px_rgba(37,99,235,0.22)] transition hover:bg-[#163fe0] focus:outline-none focus:ring-4 focus:ring-brand-blue/20 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isLoading || !message.trim()}
            aria-label="Send message"
          >
            {isLoading ? "..." : <Icon name="arrowRight" className="h-5 w-5" />}
          </button>
        </form>
      </div>
    </div>
  );
}
