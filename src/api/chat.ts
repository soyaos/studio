import { apiFetch } from "./client";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface Usage {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
}

export interface ChatStreamEvents {
  /** Called every time more text arrives. `delta` is the new chunk only. */
  onDelta(delta: string): void;
  /** Called once at the end. usage may be undefined if not provided. */
  onDone(usage?: Usage): void;
  /** Called on transport / parse error. The caller should stop the stream. */
  onError(err: Error): void;
}

interface StreamChunk {
  choices?: Array<{
    delta?: { content?: string };
    finish_reason?: string | null;
  }>;
  usage?: Usage;
}

/**
 * Streams a chat completion via SSE. Returns an AbortController so the
 * caller can cancel. Compatible with the OpenAI /v1/chat/completions
 * `stream: true` protocol that SoyaOS speaks.
 */
export function streamChat(
  args: { model: string; messages: ChatMessage[] },
  events: ChatStreamEvents,
): AbortController {
  const controller = new AbortController();

  (async () => {
    let lastUsage: Usage | undefined;
    try {
      const res = await apiFetch("/v1/chat/completions", {
        method: "POST",
        signal: controller.signal,
        body: JSON.stringify({
          model: args.model,
          messages: args.messages,
          stream: true,
        }),
      });
      if (!res.ok || !res.body) {
        const text = await res.text().catch(() => "");
        throw new Error(
          `HTTP ${res.status} ${res.statusText}${text ? ` — ${text}` : ""}`,
        );
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // SSE frames are delimited by a blank line. Process complete frames
        // and keep the trailing partial one in the buffer.
        let idx: number;
        while ((idx = buffer.indexOf("\n\n")) !== -1) {
          const frame = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 2);
          for (const line of frame.split("\n")) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const payload = trimmed.slice(5).trim();
            if (!payload || payload === "[DONE]") {
              if (payload === "[DONE]") {
                events.onDone(lastUsage);
                return;
              }
              continue;
            }
            try {
              const chunk = JSON.parse(payload) as StreamChunk;
              const delta = chunk.choices?.[0]?.delta?.content;
              if (delta) events.onDelta(delta);
              if (chunk.usage) lastUsage = chunk.usage;
            } catch {
              // Ignore individual frame parse errors — the stream may
              // still be recoverable.
            }
          }
        }
      }
      // Stream ended without an explicit [DONE].
      events.onDone(lastUsage);
    } catch (err) {
      if ((err as DOMException)?.name === "AbortError") return;
      events.onError(err instanceof Error ? err : new Error(String(err)));
    }
  })();

  return controller;
}
