const DEFAULT_OLLAMA_URL = "http://127.0.0.1:11434";
const DEFAULT_OLLAMA_MODEL = "aisingapore/Llama-SEA-LION-v3-8B-IT:q4_0";

export async function callAiChat(messages = []) {
  try {
    const response = await fetch(
      `${process.env.OLLAMA_URL || DEFAULT_OLLAMA_URL}/api/chat`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: process.env.OLLAMA_MODEL || DEFAULT_OLLAMA_MODEL,
          stream: false,
          messages
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(15000)
      }
    );

    if (!response.ok) {
      throw new Error(`Ollama request failed with status ${response.status}.`);
    }

    const payload = await response.json();
    const content = payload?.message?.content;

    if (!content) {
      throw new Error("Ollama response did not include message content.");
    }

    return content;
  } catch (error) {
    if (error.name === "TimeoutError" || error.name === "AbortError") {
      console.warn("Ollama request timed out after 15s, using fallback reply.");
    } else {
      console.warn("Ollama request failed, using fallback reply.", error.message);
    }

    return "";
  }
}

export async function* streamAiChat(messages = []) {
  const response = await fetch(
    `${process.env.OLLAMA_URL || DEFAULT_OLLAMA_URL}/api/chat`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OLLAMA_MODEL || DEFAULT_OLLAMA_MODEL,
        stream: true,
        messages
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(30000)
    }
  );

  if (!response.ok) {
    throw new Error(`Ollama streaming request failed with status ${response.status}.`);
  }

  if (!response.body) {
    throw new Error("Ollama streaming response has no body.");
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
        if (!line.trim()) continue;
        try {
          const data = JSON.parse(line);
          if (data.message?.content) {
            yield data.message.content;
          }
          if (data.done) return;
        } catch {
          // skip malformed NDJSON lines
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
