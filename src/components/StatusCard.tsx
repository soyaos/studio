interface StatusCardProps {
  label: string;
  value: string;
  hint?: string;
}

export default function StatusCard({ label, value, hint }: StatusCardProps) {
  return (
    <div className="rounded-xl border border-soya-ink/10 bg-white/40 p-6">
      <p className="text-xs uppercase tracking-wider text-soya-ink/60">
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
      {hint ? (
        <p className="mt-3 text-xs text-soya-ink/60">{hint}</p>
      ) : null}
    </div>
  );
}
