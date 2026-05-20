import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getHealth, type HealthResponse } from "../api/health";
import { listModels, type Model } from "../api/models";
import StatCard from "../components/StatCard";

interface State {
  health?: HealthResponse;
  models?: Model[];
  healthError?: string;
  modelsError?: string;
}

export default function Dashboard() {
  const [state, setState] = useState<State>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.allSettled([getHealth(), listModels()]).then(([h, m]) => {
      if (cancelled) return;
      const next: State = {};
      if (h.status === "fulfilled") next.health = h.value;
      else next.healthError = h.reason?.message ?? String(h.reason);
      if (m.status === "fulfilled") next.models = m.value;
      else next.modelsError = m.reason?.message ?? String(m.reason);
      setState(next);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const hasLLM = state.models?.some((m) => m.id === "soya:llm");
  const byokStatus = state.modelsError
    ? "unknown"
    : hasLLM
      ? "configured"
      : "not set";
  // Studio cannot read provider details over /control yet, so we describe
  // it conservatively. The /control/v0/llm/config endpoint is planned.
  const byokHint = hasLLM
    ? "soya:llm advertised — provider details available via /control/v0/llm/config (planned)"
    : state.modelsError
      ? `couldn't query /v1/models: ${state.modelsError}`
      : "no soya:llm model in /v1/models";

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-soya-muted mt-1">
            Live status of the soyaos binary you are talking to. Reloads on
            page navigation.
          </p>
        </div>
        {loading ? (
          <span className="badge">refreshing…</span>
        ) : (
          <span className="badge">
            {state.health?.status === "ok" ? "healthy" : "unreachable"}
          </span>
        )}
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Version"
          value={state.health?.version ?? (state.healthError ? "—" : "…")}
          hint={
            state.healthError
              ? `error: ${state.healthError}`
              : "from /healthz?format=json"
          }
        />
        <StatCard
          label="Edition"
          value={state.health?.edition ?? "—"}
          tone="accent"
          hint="solo · cluster · enterprise"
        />
        <StatCard
          label="Agents"
          value={state.health?.agents ?? "—"}
          hint="registered with the runtime"
        />
        <StatCard
          label="BYOK"
          value={byokStatus}
          tone={hasLLM ? "accent" : "muted"}
          hint={byokHint}
        />
      </section>

      <section className="card p-6">
        <h2 className="text-lg font-semibold tracking-tight">Quick links</h2>
        <p className="text-sm text-soya-muted mt-1">
          Jump straight into the most useful surfaces.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link to="/chat" className="btn-primary">
            Open chat
          </Link>
          <Link to="/agents" className="btn-ghost">
            Browse agents
          </Link>
          <Link to="/keys" className="btn-ghost">
            Manage API keys
          </Link>
          <Link to="/trace" className="btn-ghost">
            Recent traces
          </Link>
        </div>
      </section>

      <section className="card p-6">
        <h2 className="text-lg font-semibold tracking-tight">
          Available models
        </h2>
        {state.modelsError ? (
          <p className="mt-2 text-sm text-red-600">
            Couldn't list models: {state.modelsError}
          </p>
        ) : !state.models ? (
          <p className="mt-2 text-sm text-soya-muted">Loading…</p>
        ) : state.models.length === 0 ? (
          <p className="mt-2 text-sm text-soya-muted">
            No models registered.
          </p>
        ) : (
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {state.models.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between rounded-btn border border-soya-line bg-white/60 px-3 py-2 text-sm"
              >
                <span className="font-mono">{m.id}</span>
                <span className="text-xs text-soya-muted">
                  {m.owned_by ?? "—"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
