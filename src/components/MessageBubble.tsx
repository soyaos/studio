import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import type { Usage } from "../api/chat";

export type Role = "user" | "assistant" | "system" | "error";

/**
 * Lifecycle of a streaming assistant bubble:
 *
 *   dialing  → http request flying, no response yet (rare; ms-scale)
 *   waiting  → response 200, waiting for first SSE delta (can be 10–60s on
 *              upstreams that buffer, like DashScope qwen for long outputs)
 *   streaming → first delta landed, more arriving
 *   cancelled → user pressed Stop; later chunks must be ignored
 *   undefined → finished normally
 */
export type StreamState =
  | "dialing"
  | "waiting"
  | "streaming"
  | "cancelled"
  | undefined;

export interface ChatMessageVM {
  id: string;
  role: Role;
  content: string;
  streaming?: boolean;
  streamState?: StreamState;
  /** ms epoch when the send button was clicked. Used to show elapsed timers. */
  startedAt?: number;
  usage?: Usage;
}

interface MessageBubbleProps {
  message: ChatMessageVM;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  if (message.role === "system") return null;

  const isUser = message.role === "user";
  const isErr = message.role === "error";

  const wrapper = isUser ? "justify-end" : "justify-start";
  const bubble = isErr
    ? "max-w-[80%] rounded-card border border-red-300 bg-red-50 px-4 py-3 text-red-700 text-sm whitespace-pre-wrap"
    : isUser
      ? "max-w-[80%] rounded-card bg-soya-accent text-soya-ink px-4 py-3 text-sm whitespace-pre-wrap shadow-[0_1px_2px_rgba(43,36,25,0.06)]"
      : "max-w-[80%] rounded-card bg-soya-cream border border-soya-line text-soya-ink px-4 py-3 text-sm shadow-[0_1px_2px_rgba(43,36,25,0.04)]";

  const showWaiting =
    !isUser && !isErr && message.streaming && !message.content.length;
  const showCursor =
    !isUser && !isErr && message.streaming && message.content.length > 0;
  const cancelled = message.streamState === "cancelled";

  return (
    <div className={`flex ${wrapper}`}>
      <div className="flex flex-col gap-1 max-w-full">
        <span
          className={`label ${isUser ? "text-right" : ""} ${isErr ? "text-red-600" : ""}`}
        >
          {isErr ? "Error" : message.role}
          {message.streaming && message.startedAt ? (
            <ElapsedSince start={message.startedAt} />
          ) : null}
        </span>
        <div className={bubble}>
          {isUser || isErr ? (
            <span>{message.content}</span>
          ) : showWaiting ? (
            <WaitingIndicator state={message.streamState} />
          ) : (
            <div className={`md ${showCursor ? "cursor-blink" : ""}`}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content || (message.streaming ? "" : "*(empty)*")}
              </ReactMarkdown>
              {cancelled ? (
                <span className="ml-1 inline-block rounded-full bg-soya-line/70 px-2 py-[1px] text-[10px] uppercase tracking-wider text-soya-muted align-middle">
                  stopped
                </span>
              ) : null}
            </div>
          )}
        </div>
        {message.usage ? (
          <span
            className={`text-[11px] text-soya-muted ${
              isUser ? "text-right" : ""
            }`}
          >
            {formatUsage(message.usage)}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function WaitingIndicator({ state }: { state: StreamState }) {
  const label =
    state === "dialing" ? "Dialing upstream" : "Waiting for first token";
  return (
    <span className="inline-flex items-center gap-2 text-soya-muted">
      <span className="dots-pulse">
        <span />
        <span />
        <span />
      </span>
      <span className="text-xs italic">{label}…</span>
    </span>
  );
}

/**
 * Renders "(0.4s)" / "(12s)" and ticks every 250ms while the bubble is
 * mounted. Kept tiny on purpose — it sits inline with the role label.
 */
function ElapsedSince({ start }: { start: number }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, []);
  const ms = Math.max(0, now - start);
  const text = ms < 10_000 ? `${(ms / 1000).toFixed(1)}s` : `${Math.round(ms / 1000)}s`;
  return (
    <span className="ml-2 text-[11px] text-soya-muted normal-case tracking-normal">
      ({text})
    </span>
  );
}

function formatUsage(u: Usage): string {
  const parts: string[] = [];
  if (u.prompt_tokens != null) parts.push(`prompt ${u.prompt_tokens}`);
  if (u.completion_tokens != null)
    parts.push(`completion ${u.completion_tokens}`);
  if (u.total_tokens != null) parts.push(`total ${u.total_tokens}`);
  return parts.join(" · ") || "";
}
