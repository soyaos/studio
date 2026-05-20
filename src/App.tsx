import { Route, Routes } from "react-router-dom";

import Nav from "./components/Nav.js";
import StatusCard from "./components/StatusCard.js";

function Overview() {
  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <StatusCard label="Agents" value="—" hint="will populate from /v1/agents" />
      <StatusCard label="API keys" value="—" hint="will populate from /v1/auth/keys" />
      <StatusCard label="Scope events / min" value="—" hint="rolling 60s window" />
    </section>
  );
}

function AgentsPage() {
  return (
    <section className="rounded-xl border border-soya-ink/10 bg-white/40 p-6">
      <h2 className="text-lg font-medium tracking-tight">Agents</h2>
      <p className="mt-2 text-sm text-soya-ink/70">
        Lists Agents discovered by <code>soyaos serve</code>. Placeholder
        in alpha.0.
      </p>
    </section>
  );
}

function ScopesPage() {
  return (
    <section className="rounded-xl border border-soya-ink/10 bg-white/40 p-6">
      <h2 className="text-lg font-medium tracking-tight">Scopes</h2>
      <p className="mt-2 text-sm text-soya-ink/70">
        Live Scope event stream (server-sent events). Placeholder in alpha.0.
      </p>
    </section>
  );
}

function KeysPage() {
  return (
    <section className="rounded-xl border border-soya-ink/10 bg-white/40 p-6">
      <h2 className="text-lg font-medium tracking-tight">API Keys</h2>
      <p className="mt-2 text-sm text-soya-ink/70">
        Create / rotate / revoke API keys. Placeholder in alpha.0.
      </p>
    </section>
  );
}

export default function App() {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Nav />
      <main className="flex-1 mx-auto w-full max-w-6xl px-6 py-10">
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/agents" element={<AgentsPage />} />
          <Route path="/scopes" element={<ScopesPage />} />
          <Route path="/keys" element={<KeysPage />} />
        </Routes>
      </main>
    </div>
  );
}
