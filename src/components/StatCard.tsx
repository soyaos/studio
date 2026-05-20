import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: "default" | "accent" | "muted";
}

export default function StatCard({
  label,
  value,
  hint,
  tone = "default",
}: StatCardProps) {
  const valueColor =
    tone === "accent"
      ? "text-soya-accent"
      : tone === "muted"
        ? "text-soya-muted"
        : "text-soya-ink";
  return (
    <div className="card p-5 flex flex-col gap-2">
      <span className="label">{label}</span>
      <span className={`text-2xl font-semibold tracking-tight ${valueColor}`}>
        {value}
      </span>
      {hint ? (
        <span className="text-xs text-soya-muted leading-relaxed">{hint}</span>
      ) : null}
    </div>
  );
}
