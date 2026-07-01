const DEFAULT_OLLAMA_URL = "http://127.0.0.1:11434";
const DEFAULT_OLLAMA_MODEL = "aisingapore/Llama-SEA-LION-v3-8B-IT:q4_0";

export async function callOllamaChat(messages = []) {
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
        signal: AbortSignal.timeout(8000)
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
      console.warn("Ollama request timed out after 8s, using fallback reply.");
    } else {
      console.warn("Ollama request failed, using fallback reply.", error.message);
    }
    // Return empty string so the caller's `rewrittenReply.trim() || reply`
    // guard naturally falls back to the deterministic base reply.
    return "";
  }
}
