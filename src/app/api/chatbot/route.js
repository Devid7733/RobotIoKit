export const maxDuration = 60;

import { streamAiChat } from "@/lib/ai-chat";
import { rewriteChatbotReplyWithAi } from "@/modules/chatbot/chatbot.ai-response";
import { parseCatalogQuery } from "@/modules/chatbot/chatbot.parser";
import { getChatbotReplyData } from "@/modules/chatbot/chatbot.service";
import { auth } from "@/lib/auth";
import { getUserOrdersPaginated } from "@/modules/order/order.service";
import { rateLimit } from "@/lib/rateLimit";
import { toClientErrorMessage } from "@/lib/apiError";

const FIXED_FOLLOW_UPS = ["Latest robot news", "Track my order", "Store location"];

function isChatbotAiEnabled() {
  return String(process.env.CHATBOT_AI_ENABLED || "").toLowerCase() === "true";
}

function cleanChatbotReply(reply = "") {
  return String(reply || "")
    .replace(/\s*\((?:\/products|\/robot-kits)\/[^)\s]+\)/g, "")
    .replace(/\b(?:\/products|\/robot-kits)\/[^\s).,]+/g, "")
    .replace(/\b(?:Recommended matches|Matched products|Matched kits|top matched|ranking|score):?\s*/gi, "")
    .replace(/I found these relevant catalog matches:?/gi, "I found a few suitable options that may help:")
    .replace(/relevant catalog options/gi, "suitable options")
    .replace(/catalog options/gi, "options")
    .replace(/live catalog match/gi, "matching product")
    .replace(/No catalog match/gi, "I couldn't find a matching product right now.")
    .replace(/retrieval result/gi, "result")
    .replace(/matched items/gi, "items")
    .replace(/database result/gi, "result")
    .replace(/\s+/g, " ")
    .replace(/\s+([.,!?។])/g, "$1")
    .trim()
    .replace(/^["'](.+)["']$/s, "$1");
}

function buildOrderContext(orders) {
  if (!orders || !orders.length) return "";
  const lines = ["CUSTOMER'S RECENT ORDERS (use only to answer order tracking questions):"];
  for (const order of orders.slice(0, 2)) {
    const date = order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-US") : "unknown date";
    lines.push(
      `- Order #${order.orderNumber}: status=${order.status}, placed=${date}, total=$${Number(order.total || 0).toFixed(2)}, payment=${order.paymentMethod || "unknown"}`
    );
  }
  lines.push("Do not invent order details not listed above. If the customer has no orders here, tell them you cannot find any orders.");
  return lines.join("\n");
}

function buildGroundedSystemPrompt(modelPromptMode, language, orderContext = "") {
  const responseLanguage = language === "km" ? "Khmer" : "English";
  const orderSection = orderContext ? `\n\n${orderContext}` : "";

  if (modelPromptMode === "educational") {
    return `You are an expert robotics and electronics tutor and shopping assistant for RobotIoKit, a robotics component store in Phnom Penh, Cambodia.
Use the STORE TRUTH section in the user prompt as the only source for store products, robot kits, prices, stock, links, and availability.
You may use general robotics and electronics knowledge for concepts, project logic, algorithms, wiring, and troubleshooting.
Never invent store product names, prices, stock, URLs, or availability. Only mention products/kits listed in STORE TRUTH.
Keep official product and model names exactly as provided, in English (e.g., Arduino Uno, ESP32, HC-SR04, L298N, SG90).
If answering in Khmer, write naturally in Khmer but preserve technical model names in English.
Be warm and encouraging — many customers are students and beginners.
Give complete, step-by-step, structured answers: for builds include the parts list, wiring overview, code logic, and how to test; for concepts include how it works and a practical example.
Don't pad with filler, but don't cut technical detail short either. Be direct and practical.
Answer in ${responseLanguage}.${orderSection}`;
  }

  if (modelPromptMode === "general") {
    return `You are an expert robotics and electronics tutor for RobotIoKit, a robotics component store in Phnom Penh, Cambodia.
Answer ANY robotics, robot-kit, electronics, embedded-programming, or technology question thoroughly and step by step, like a great teacher.
Use your full general knowledge — concepts, history, algorithms, wiring, code logic, comparisons, and troubleshooting are all fair game.
Never invent specific RobotIoKit product names, prices, stock, URLs, or availability; you may only reference the store at the category level described in the user prompt.
Keep official technical and model names in English (e.g., Arduino Uno, ESP32, HC-SR04, L298N, SG90).
If answering in Khmer, write naturally in Khmer but preserve technical model names in English.
Be warm and encouraging — many customers are students and beginners.
Answer in ${responseLanguage}.${orderSection}`;
  }

  if (modelPromptMode === "news") {
    return `You are an expert robotics tutor and news presenter for RobotIoKit, a robotics component store in Phnom Penh, Cambodia.
The user prompt contains a ROBOT NEWS CONTEXT section fetched from trusted robotics news feeds (IEEE Spectrum, The Robot Report, Robohub, ScienceDaily).
Treat that section as your ONLY source of current events; always attribute the source and date of each item you mention.
You may add background explanation from general robotics knowledge, but never invent events, announcements, or dates.
Keep company names, robot names, and source names in English, even in Khmer answers.
Be engaging and clear — many readers are students discovering robotics.
Answer in ${responseLanguage}.${orderSection}`;
  }

  if (modelPromptMode === "order_status") {
    return `You are a helpful order-status assistant for RobotIoKit, a robotics component store in Phnom Penh, Cambodia.
The user is asking about their order status or tracking. Rely ONLY on the CUSTOMER'S RECENT ORDERS section below, if present, for the order number, status, date, and total.
Never invent an order number, status, date, or total.
If no CUSTOMER'S RECENT ORDERS section is present, or it says no orders were found, politely tell the user to sign in to their account and check the Orders page, or contact the store with their order number for help.
Answer in ${responseLanguage}.${orderSection}`;
  }

  return `You are a helpful product assistant for RobotIoKit, a robotics component store in Phnom Penh, Cambodia.
Use only the catalog context provided in the user prompt. Do not invent products, prices, stock, voltage, compatibility, or specifications.
If a specific detail is missing from the catalog context, say: "I cannot confirm that from our product data."
Keep official product and model names in English (e.g., Arduino Uno, ESP32, HC-SR04, TCRT5000, L298N, SG90).
If answering in Khmer, write naturally in Khmer but keep technical model names in English.
Answer as thoroughly as the question needs — a short paragraph or a few bullet points is fine. Don't pad with filler, but don't cut technical detail short either. Be friendly and helpful.
Answer in ${responseLanguage}.${orderSection}`;
}

function logChatbotEvent(event, details = {}) {
  console.info(`[chatbot] ${event}`, details);
}

export async function POST(request) {
  const encoder = new TextEncoder();

  function send(controller, data) {
    controller.enqueue(encoder.encode(JSON.stringify(data) + "\n"));
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  if (!rateLimit(ip)) {
    return new Response(
      JSON.stringify({ ok: false, message: "Too many requests. Please try again later." }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ ok: false, message: "Invalid request body." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const history = Array.isArray(body?.history)
    ? body.history
        .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
        .slice(-6)
    : [];

  let orderContext = "";
  try {
    const session = await auth();
    if (session?.user?.id) {
      const { orders } = await getUserOrdersPaginated(session.user.id, 1, 2);
      orderContext = buildOrderContext(orders);
    }
  } catch {
    // order context is optional — never block the chatbot
  }

  const parsedQuery = parseCatalogQuery(body?.message || "");
  logChatbotEvent("query", {
    message: body?.message || "",
    detectedIntent: parsedQuery.intent,
    entityType: parsedQuery.entityType,
    filters: parsedQuery.filters
  });

  let chatbotReply;
  try {
    chatbotReply = await getChatbotReplyData(body?.message, { lastRecommendedItems: body?.lastRecommendedItems });
  } catch (error) {
    return new Response(
      JSON.stringify({ ok: false, message: toClientErrorMessage(error, "Unable to get chatbot response.") }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const itemCount = Array.isArray(chatbotReply.catalogMatches) ? chatbotReply.catalogMatches.length : 0;
  logChatbotEvent("result", {
    detectedIntent: parsedQuery.intent,
    responseMode: chatbotReply.responseMode || "unknown",
    itemCount,
    hasLocationLink: Boolean(chatbotReply.locationLink)
  });

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Metadata arrives first so the client can show product cards immediately
        send(controller, {
          type: "meta",
          items: chatbotReply.catalogMatches || [],
          followUps: FIXED_FOLLOW_UPS,
          locationLink: chatbotReply.locationLink || "",
          news: chatbotReply.newsItems || [],
          language: chatbotReply.language
        });

        if (isChatbotAiEnabled() && chatbotReply.modelPrompt) {
          const systemContent = buildGroundedSystemPrompt(chatbotReply.modelPromptMode, chatbotReply.language, orderContext);
          const messages = [
            { role: "system", content: systemContent },
            ...history,
            { role: "user", content: chatbotReply.modelPrompt }
          ];

          // Deep tutor/news answers need more room, especially in Khmer
          // (Khmer script tokenizes at roughly 2-3x tokens per visible character)
          const maxTokens = ["educational", "general", "news"].includes(chatbotReply.modelPromptMode) ? 1400 : 1100;

          let accumulated = "";
          let aiSucceeded = false;

          try {
            for await (const chunk of streamAiChat(messages, { maxTokens })) {
              accumulated += chunk;
              send(controller, { type: "text", delta: chunk });
            }
            aiSucceeded = Boolean(accumulated.trim());
          } catch (error) {
            console.error("[chatbot] Streaming AI failed:", error.message);
          }

          if (!aiSucceeded) {
            // AI produced nothing — fall back to the deterministic draft reply
            const fallback = cleanChatbotReply(chatbotReply.reply);
            send(controller, { type: "text", delta: fallback });
            send(controller, { type: "done", cleanedText: fallback });
          } else {
            const cleaned = cleanChatbotReply(accumulated);
            // Only send cleanedText when cleaning actually changed something
            send(controller, { type: "done", ...(cleaned !== accumulated ? { cleanedText: cleaned } : {}) });
          }
        } else {
          // Non-streaming path: simple listing rewrite
          let reply = chatbotReply.reply;
          if (isChatbotAiEnabled()) {
            try {
              reply = await rewriteChatbotReplyWithAi({ message: body?.message, reply, response: chatbotReply });
            } catch {}
          }
          const cleaned = cleanChatbotReply(reply);
          send(controller, { type: "text", delta: cleaned });
          send(controller, { type: "done" });
        }
      } catch (error) {
        try {
          send(controller, {
            type: "error",
            message: toClientErrorMessage(error, "Unable to get chatbot response.")
          });
        } catch {}
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no"
    }
  });
}
