import { apiFetch } from "./client";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface Usage {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  /**
   * Set when the upstream finish_reason ≠ "stop" — e.g. "length" when
   * max_tokens was hit, "content_filter" when the model refused, "error"
   * when SoyaOS gateway saw the upstream stream fail. UIs can render a
   * pill next to the usage line so the truncation is obvious.
   */
  finish_reason?: string;
}

export interface ChatStreamEvents {
  /**
   * Called as soon as the HTTP response opens with a 2xx status, before the
   * first SSE frame is read. UIs use this to flip from "dialing the
   * upstream" to "waiting for first token" — upstreams like DashScope can
   * spend tens of seconds buffering before the first delta lands, so the
   * distinction matters for perceived responsiveness.
   */
  onOpen?(): void;
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
  /**
   * SoyaOS gateway emits this when the upstream stream fails mid-flight
   * (e.g. context deadline, network reset). OpenAI itself also occasionally
   * surfaces `error` at the top level on stream interruptions. Either way
   * the client should treat it as a hard fail, not a silent done.
   */
  error?: { message: string; type?: string; code?: string };
}

/**
 * Streams a chat completion via SSE. Returns an AbortController so the
 * caller can cancel. Compatible with the OpenAI /v1/chat/completions
 * `stream: true` protocol that SoyaOS speaks.
 */
export function streamChat(
  args: {
    model: string;
    messages: ChatMessage[];
    /** Hard cap on response length. Forwarded to the upstream OpenAI-Compat
     *  /v1/chat/completions max_tokens. Omit for upstream-default. */
    maxTokens?: number;
    /** 0..1 (or 0..2 for some upstreams). Omit for upstream-default. */
    temperature?: number;
  },
  events: ChatStreamEvents,
): AbortController {
  const controller = new AbortController();

  (async () => {
    let lastUsage: Usage | undefined;
    try {
      const body: Record<string, unknown> = {
        model: args.model,
        messages: args.messages,
        stream: true,
      };
      if (args.maxTokens && args.maxTokens > 0) body.max_tokens = args.maxTokens;
      if (args.temperature != null) body.temperature = args.temperature;
      const res = await apiFetch("/v1/chat/completions", {
        method: "POST",
        signal: controller.signal,
        body: JSON.stringify(body),
      });
      if (!res.ok || !res.body) {
        const text = await res.text().catch(() => "");
        throw new Error(
          `HTTP ${res.status} ${res.statusText}${text ? ` — ${text}` : ""}`,
        );
      }

      events.onOpen?.();
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
              if (chunk.error) {
                // Structured upstream-error frame from SoyaOS gateway.
                // Surface it instead of letting the loop fall through to
                // a phantom onDone — otherwise a 90s timeout looks like
                // a complete short answer.
                throw new Error(chunk.error.message);
              }
              const choice = chunk.choices?.[0];
              const delta = choice?.delta?.content;
              if (delta) events.onDelta(delta);
              if (chunk.usage) lastUsage = chunk.usage;
              // finish_reason="length" / "content_filter" / "error" all
              // mean the response is incomplete — let the UI know via
              // onDone so it can decorate the bubble accordingly.
              if (choice?.finish_reason && choice.finish_reason !== "stop") {
                events.onDone({ ...lastUsage, finish_reason: choice.finish_reason });
                return;
              }
            } catch (err) {
              if (err instanceof Error && err.message) {
                events.onError(err);
                return;
              }
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
