interface TraceRow {
  ts: string;
  model: string;
  prompt: string;
  latencyMs: number;
  status: "ok" | "error" | "cancelled";
}

const NOW = new Date("2026-05-19T11:42:00+08:00").getTime();
const minute = 60_000;

const ROWS: TraceRow[] = [
  {
    ts: iso(NOW - 0.2 * minute),
    model: "soya:echo",
    prompt: "ping — connectivity check from studio",
    latencyMs: 4,
    status: "ok",
  },
  {
    ts: iso(NOW - 1.4 * minute),
    model: "soya:llm",
    prompt: "draft release notes for v0.1.0-alpha",
    latencyMs: 2_840,
    status: "ok",
  },
  {
    ts: iso(NOW - 3.1 * minute),
    model: "soya:llm",
    prompt: "summarise yesterday's e2e failures by service",
    latencyMs: 4_120,
    status: "ok",
  },
  {
    ts: iso(NOW - 5.0 * minute),
    model: "soya:echo",
    prompt: "echo: bench round-trip 1k tokens",
    latencyMs: 6,
    status: "ok",
  },
  {
    ts: iso(NOW - 7.6 * minute),
    model: "soya:llm",
    prompt: "translate the soybean recipe to japanese, polite form",
    latencyMs: 3_510,
    status: "ok",
  },
  {
    ts: iso(NOW - 11.2 * minute),
    model: "soya:llm",
    prompt: "why is my Connect-ES client returning unauthenticated",
    latencyMs: 1_980,
    status: "error",
  },
  {
    ts: iso(NOW - 14.0 * minute),
    model: "soya:echo",
    prompt: "echo: smoke after rolling restart",
    latencyMs: 3,
    status: "ok",
  },
  {
    ts: iso(NOW - 19.7 * minute),
    model: "soya:llm",
    prompt: "compare argon2id vs sha-256 for short-lived bearer tokens",
    latencyMs: 5_220,
    status: "cancelled",
  },
  {
    ts: iso(NOW - 27.4 * minute),
    model: "soya:llm",
    prompt: "draft a postmortem template focused on blast radius",
    latencyMs: 3_640,
    status: "ok",
  },
  {
    ts: iso(NOW - 41.9 * minute),
    model: "soya:echo",
    prompt: "echo: startup heartbeat",
    latencyMs: 5,
    status: "ok",
  },
];

function iso(ms: number): string {
  return new Date(ms).toISOString().replace("T", " ").slice(0, 19) + "Z";
}

function statusBadge(s: TraceRow["status"]) {
  if (s === "ok") return "border-emerald-300 bg-emerald-50 text-emerald-700";
  if (s === "error") return "border-red-300 bg-red-50 text-red-700";
  return "border-soya-line bg-white/70 text-soya-muted";
}

function truncate(s: string, n: number): string {
  return s.length <= n ? s : s.slice(0, n - 1) + "…";
}

export default function Trace() {
  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Trace</h1>
          <p className="text-sm text-soya-muted mt-1">
            Recent inference calls observed by the runtime.
          </p>
        </div>
        <span className="badge">{ROWS.length} entries</span>
      </header>

      <div className="card border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
        Trace endpoint is not yet wired; showing mock data. The real source
        will be SoyaScope (see <code className="font-mono">pkg/scope</code>),
        exposed via <code className="font-mono">/control/v0/scope/recent</code>{" "}
        (planned).
      </div>

      <section className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/60 text-left text-xs uppercase tracking-wider text-soya-muted">
              <th className="px-4 py-3 font-medium">Timestamp</th>
              <th className="px-4 py-3 font-medium">Model</th>
              <th className="px-4 py-3 font-medium">Prompt</th>
              <th className="px-4 py-3 font-medium text-right">Latency</th>
              <th className="px-4 py-3 font-medium text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r, i) => (
              <tr key={i} className="table-row">
                <td className="px-4 py-3 font-mono text-xs text-soya-muted whitespace-nowrap">
                  {r.ts}
                </td>
                <td className="px-4 py-3 font-mono text-xs">{r.model}</td>
                <td className="px-4 py-3 text-soya-ink/90">
                  {truncate(r.prompt, 40)}
                </td>
                <td className="px-4 py-3 text-right text-xs font-mono text-soya-muted">
                  {r.latencyMs.toLocaleString()} ms
                </td>
                <td className="px-4 py-3 text-right">
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${statusBadge(r.status)}`}
                  >
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
