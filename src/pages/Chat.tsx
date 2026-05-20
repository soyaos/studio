import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "react-router-dom";

import { streamChat, type ChatMessage } from "../api/chat";
import ApiKeyManager from "../components/ApiKeyManager";
import MessageBubble, {
  type ChatMessageVM,
} from "../components/MessageBubble";
import ModelPicker from "../components/ModelPicker";

const SYSTEM_KEY = "soya.studio.systemPrompt";
const STREAM_KEY = "soya.studio.streaming";

function newId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export default function Chat() {
  const [params, setParams] = useSearchParams();
  const initialModel = params.get("model") ?? "";

  const [model, setModel] = useState(initialModel);
  const [systemPrompt, setSystemPrompt] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return window.localStorage.getItem(SYSTEM_KEY) ?? "";
  });
  const [systemOpen, setSystemOpen] = useState(false);
  const [streaming, setStreaming] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return window.localStorage.getItem(STREAM_KEY) !== "off";
  });
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessageVM[]>([]);
  const [busy, setBusy] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const sessionRef = useRef<{ cancelled: boolean } | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Persist preferences.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (systemPrompt) window.localStorage.setItem(SYSTEM_KEY, systemPrompt);
    else window.localStorage.removeItem(SYSTEM_KEY);
  }, [systemPrompt]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STREAM_KEY, streaming ? "on" : "off");
  }, [streaming]);

  // Reflect ?model= back into the URL when the user changes it.
  useEffect(() => {
    if (!model) return;
    if (params.get("model") === model) return;
    const next = new URLSearchParams(params);
    next.set("model", model);
    setParams(next, { replace: true });
  }, [model, params, setParams]);

  // Auto-scroll on new content.
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  const canSend = !!model.trim() && !!input.trim() && !busy;

  const send = useCallback(() => {
    if (!canSend) return;
    const userMsg: ChatMessageVM = {
      id: newId(),
      role: "user",
      content: input.trim(),
    };

    // Build the wire-format history (system + prior user/assistant + new).
    const history: ChatMessage[] = [];
    if (systemPrompt.trim()) {
      history.push({ role: "system", content: systemPrompt.trim() });
    }
    for (const m of messages) {
      if (m.role !== "user" && m.role !== "assistant") continue;
      if (!m.content.trim()) continue;
      history.push({ role: m.role, content: m.content });
    }
    history.push({ role: "user", content: userMsg.content });

    const assistantId = newId();
    const startedAt = Date.now();
    const assistantMsg: ChatMessageVM = {
      id: assistantId,
      role: "assistant",
      content: "",
      streaming: streaming,
      streamState: streaming ? "dialing" : undefined,
      startedAt,
    };
    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput("");
    setBusy(true);

    if (streaming) {
      // Per-send session captured by closure. Stop flips `cancelled` to true,
      // and every async callback below checks it BEFORE mutating state — so
      // any chunk that lands after the user pressed Stop is dropped at the
      // UI layer, regardless of whether the network actually managed to
      // tear down the upstream request in time.
      const session = { cancelled: false };
      sessionRef.current = session;

      const controller = streamChat(
        { model, messages: history },
        {
          onOpen() {
            if (session.cancelled) return;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, streamState: "waiting" }
                  : m,
              ),
            );
          },
          onDelta(delta) {
            if (session.cancelled) return;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? {
                      ...m,
                      content: m.content + delta,
                      streamState: "streaming",
                    }
                  : m,
              ),
            );
          },
          onDone(usage) {
            if (session.cancelled) return;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? {
                      ...m,
                      streaming: false,
                      streamState: undefined,
                      usage,
                    }
                  : m,
              ),
            );
            setBusy(false);
            abortRef.current = null;
            sessionRef.current = null;
          },
          onError(err) {
            if (session.cancelled) return;
            setMessages((prev) => [
              ...prev.filter((m) => m.id !== assistantId),
              {
                id: newId(),
                role: "error",
                content: err.message,
              },
            ]);
            setBusy(false);
            abortRef.current = null;
            sessionRef.current = null;
          },
        },
      );
      abortRef.current = controller;
    } else {
      // Non-streaming path: one POST, full response.
      (async () => {
        try {
          const res = await fetch("/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${window.localStorage.getItem("soya.studio.apiKey") ?? "sk-soya-dev-local"}`,
            },
            body: JSON.stringify({
              model,
              messages: history,
              stream: false,
            }),
          });
          if (!res.ok) {
            throw new Error(
              `HTTP ${res.status} ${res.statusText} — ${await res
                .text()
                .catch(() => "")}`,
            );
          }
          const data = (await res.json()) as {
            choices?: Array<{ message?: { content?: string } }>;
            usage?: ChatMessageVM["usage"];
          };
          const text = data.choices?.[0]?.message?.content ?? "";
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: text, streaming: false, usage: data.usage }
                : m,
            ),
          );
        } catch (err) {
          setMessages((prev) => [
            ...prev.filter((m) => m.id !== assistantId),
            {
              id: newId(),
              role: "error",
              content: err instanceof Error ? err.message : String(err),
            },
          ]);
        } finally {
          setBusy(false);
        }
      })();
    }
  }, [canSend, input, messages, model, streaming, systemPrompt]);

  const stop = useCallback(() => {
    // 1. Flip the session flag so every in-flight onDelta/onDone callback
    //    bails out before touching state. This works even if the network
    //    abort below propagates slowly or if a chunk is already in the
    //    reader's buffer — UI stops the instant the user clicks.
    if (sessionRef.current) sessionRef.current.cancelled = true;
    sessionRef.current = null;

    // 2. Tear down the actual network so we stop billing tokens upstream
    //    (the AbortController triggers fetch() → ReadableStream cancel).
    abortRef.current?.abort();
    abortRef.current = null;

    // 3. Mark the visible bubble as cancelled so the user sees [stopped]
    //    instead of a half-finished message that never resumes.
    setBusy(false);
    setMessages((prev) =>
      prev.map((m) =>
        m.streaming
          ? { ...m, streaming: false, streamState: "cancelled" }
          : m,
      ),
    );
  }, []);

  const clear = useCallback(() => {
    stop();
    setMessages([]);
  }, [stop]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const placeholder = useMemo(() => {
    if (!model) return "Pick a model above to start chatting.";
    return "Message…  (Enter to send · Shift+Enter for newline)";
  }, [model]);

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Chat</h1>
          <p className="text-sm text-soya-muted mt-1">
            POSTs to{" "}
            <code className="font-mono text-xs">/v1/chat/completions</code>{" "}
            on the connected SoyaOS gateway.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-xs text-soya-muted">
            <input
              type="checkbox"
              className="accent-soya-accent"
              checked={streaming}
              onChange={(e) => setStreaming(e.target.checked)}
            />
            stream
          </label>
          <button className="btn-ghost" onClick={clear} disabled={busy && false}>
            Clear
          </button>
        </div>
      </header>

      <section className="card p-4 grid gap-4 sm:grid-cols-2">
        <ModelPicker value={model} onChange={setModel} />
        <ApiKeyManager />
        <div className="sm:col-span-2 flex flex-col gap-1">
          <button
            type="button"
            onClick={() => setSystemOpen((v) => !v)}
            className="self-start text-xs font-medium uppercase tracking-wider text-soya-muted hover:text-soya-ink"
          >
            {systemOpen ? "▾" : "▸"} System prompt (optional)
          </button>
          {systemOpen ? (
            <textarea
              className="input font-mono text-xs"
              rows={3}
              placeholder="e.g. You are SoyaOS, a warm and concise assistant."
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
            />
          ) : null}
        </div>
      </section>

      <section
        ref={listRef}
        className="card p-4 flex flex-col gap-3 min-h-[420px] max-h-[60vh] overflow-y-auto"
      >
        {messages.length === 0 ? (
          <div className="m-auto text-center text-sm text-soya-muted">
            <p>No messages yet.</p>
            <p className="mt-1">
              Try: <span className="font-mono">say hello in soybean style</span>
            </p>
          </div>
        ) : (
          messages.map((m) => <MessageBubble key={m.id} message={m} />)
        )}
      </section>

      <section className="card p-3">
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            className="input flex-1 resize-y min-h-[44px] max-h-[200px]"
            rows={1}
            placeholder={placeholder}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={!model}
          />
          {busy ? (
            <button className="btn-danger" onClick={stop}>
              Stop
            </button>
          ) : (
            <button
              className="btn-primary"
              onClick={send}
              disabled={!canSend}
            >
              Send
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
