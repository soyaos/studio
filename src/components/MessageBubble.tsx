import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import type { Usage } from "../api/chat";

export type Role = "user" | "assistant" | "system" | "error";

export interface ChatMessageVM {
  id: string;
  role: Role;
  content: string;
  streaming?: boolean;
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

  return (
    <div className={`flex ${wrapper}`}>
      <div className="flex flex-col gap-1 max-w-full">
        <span
          className={`label ${isUser ? "text-right" : ""} ${isErr ? "text-red-600" : ""}`}
        >
          {isErr ? "Error" : message.role}
        </span>
        <div className={bubble}>
          {isUser || isErr ? (
            <span
              className={message.streaming ? "cursor-blink" : undefined}
            >
              {message.content}
            </span>
          ) : (
            <div
              className={`md ${message.streaming ? "cursor-blink" : ""}`}
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content || (message.streaming ? "" : "*(empty)*")}
              </ReactMarkdown>
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

function formatUsage(u: Usage): string {
  const parts: string[] = [];
  if (u.prompt_tokens != null) parts.push(`prompt ${u.prompt_tokens}`);
  if (u.completion_tokens != null)
    parts.push(`completion ${u.completion_tokens}`);
  if (u.total_tokens != null) parts.push(`total ${u.total_tokens}`);
  return parts.join(" · ") || "";
}
