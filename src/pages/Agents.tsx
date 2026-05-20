import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { listAgents, type Agent } from "../api/agents";

export default function Agents() {
  const [agents, setAgents] = useState<Agent[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listAgents()
      .then((a) => {
        if (!cancelled) setAgents(a);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Agents</h1>
          <p className="text-sm text-soya-muted mt-1">
            Pulled from <code className="font-mono text-xs">/control/v0/agents</code>.
          </p>
        </div>
        <span className="badge">
          {agents ? `${agents.length} registered` : error ? "error" : "loading"}
        </span>
      </header>

      {error ? (
        <div className="card border-red-300 bg-red-50 p-4 text-sm text-red-700">
          Couldn't load agents: {error}
        </div>
      ) : null}

      <section className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/60 text-left text-xs uppercase tracking-wider text-soya-muted">
              <th className="px-4 py-3 font-medium">ID</th>
              <th className="px-4 py-3 font-medium">Slug</th>
              <th className="px-4 py-3 font-medium">Description</th>
              <th className="px-4 py-3 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {!agents && !error ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-soya-muted">
                  Loading…
                </td>
              </tr>
            ) : null}
            {agents && agents.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-soya-muted">
                  No agents registered.
                </td>
              </tr>
            ) : null}
            {agents?.map((a) => (
              <tr key={a.id ?? a.slug} className="table-row">
                <td className="px-4 py-3 font-mono text-xs text-soya-muted">
                  {a.id ?? "—"}
                </td>
                <td className="px-4 py-3 font-medium">{a.slug ?? "—"}</td>
                <td className="px-4 py-3 text-soya-muted">
                  {a.description ?? "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    to={`/chat?model=${encodeURIComponent(modelHint(a))}`}
                    className="btn-ghost px-3 py-1 text-xs"
                  >
                    Try in chat →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

// Best effort: agent id like "soya:echo" can be used as a model id directly.
// If a separate `model` field is present we honour it.
function modelHint(a: Agent): string {
  if (typeof a.model === "string" && a.model) return a.model;
  if (typeof a.id === "string" && a.id.includes(":")) return a.id;
  if (typeof a.slug === "string" && a.slug) return `soya:${a.slug}`;
  return "";
}
