const SEA_LION_BASE_URL = "https://api.sea-lion.ai/v1";
const DEFAULT_SEA_LION_MODEL = "aisingapore/Qwen-SEA-LION-v4-32B-IT";

function seaLionHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.SEA_LION_API_KEY}`
  };
}

export async function callAiChat(messages = []) {
  try {
    const response = await fetch(`${SEA_LION_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: seaLionHeaders(),
      body: JSON.stringify({
        model: process.env.SEA_LION_MODEL || DEFAULT_SEA_LION_MODEL,
        stream: false,
        max_completion_tokens: 1100,
        messages
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      throw new Error(`SEA-LION request failed with status ${response.status}.`);
    }

    const payload = await response.json();
    const content = payload?.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("SEA-LION response did not include message content.");
    }

    return content;
  } catch (error) {
    if (error.name === "TimeoutError" || error.name === "AbortError") {
      console.warn("SEA-LION request timed out after 15s, using fallback reply.");
    } else {
      console.warn("SEA-LION request failed, using fallback reply.", error.message);
    }

    return "";
  }
}

export async function* streamAiChat(messages = []) {
  const response = await fetch(`${SEA_LION_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: seaLionHeaders(),
    body: JSON.stringify({
      model: process.env.SEA_LION_MODEL || DEFAULT_SEA_LION_MODEL,
      stream: true,
      max_completion_tokens: 1100,
      messages
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(35000)
  });

  if (!response.ok) {
    throw new Error(`SEA-LION streaming request failed with status ${response.status}.`);
  }

  if (!response.body) {
    throw new Error("SEA-LION streaming response has no body.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;

        const data = trimmed.slice("data:".length).trim();
        if (data === "[DONE]") return;

        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) yield delta;
        } catch {
          // skip malformed SSE chunks
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
