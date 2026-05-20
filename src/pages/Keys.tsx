import { useState } from "react";

interface KeyRow {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  created: string;
  lastUsed: string;
}

const ALL_SCOPES = [
  "agents:invoke",
  "agents:list",
  "agents:write",
  "scope:read",
  "keys:admin",
];

const INITIAL: KeyRow[] = [
  {
    id: "k_local",
    name: "unsafe-dev-local",
    prefix: "sk-soya-dev-…",
    scopes: ["agents:invoke", "agents:list"],
    created: "2026-04-12",
    lastUsed: "just now",
  },
  {
    id: "k_prod1",
    name: "prod-team-1",
    prefix: "sk-soya-prod-…",
    scopes: ["agents:invoke", "agents:list", "agents:write"],
    created: "2026-03-02",
    lastUsed: "2 hours ago",
  },
  {
    id: "k_cherry",
    name: "cherry-studio-2026q2",
    prefix: "sk-soya-prod-…",
    scopes: ["agents:invoke"],
    created: "2026-04-30",
    lastUsed: "3 days ago",
  },
];

interface NewKeyModalState {
  name: string;
  scopes: string[];
  rawKey: string | null;
}

export default function Keys() {
  const [rows, setRows] = useState<KeyRow[]>(INITIAL);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<NewKeyModalState>({
    name: "",
    scopes: ["agents:invoke"],
    rawKey: null,
  });
  const [revoke, setRevoke] = useState<KeyRow | null>(null);

  function startCreate() {
    setDraft({ name: "", scopes: ["agents:invoke"], rawKey: null });
    setOpen(true);
  }

  function submitCreate() {
    if (!draft.name.trim() || draft.scopes.length === 0) return;
    const raw = `sk-soya-prod-${Math.random().toString(36).slice(2, 10)}${Math.random().toString(36).slice(2, 10)}`;
    const newRow: KeyRow = {
      id: `k_${Math.random().toString(36).slice(2, 8)}`,
      name: draft.name.trim(),
      prefix: `${raw.slice(0, 12)}…`,
      scopes: [...draft.scopes],
      created: new Date().toISOString().slice(0, 10),
      lastUsed: "never",
    };
    setRows((prev) => [newRow, ...prev]);
    setDraft({ ...draft, rawKey: raw });
  }

  function confirmRevoke() {
    if (!revoke) return;
    setRows((prev) => prev.filter((r) => r.id !== revoke.id));
    setRevoke(null);
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">API Keys</h1>
          <p className="text-sm text-soya-muted mt-1">
            Issue, scope and revoke keys for the OpenAI-compat data plane.
          </p>
        </div>
        <button className="btn-primary" onClick={startCreate}>
          + New key
        </button>
      </header>

      <div className="card border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
        <strong>Demo only.</strong> The API key CRUD endpoint is not yet
        wired; these rows are local state and reset on reload. Server-side
        management lands behind{" "}
        <code className="font-mono">/control/v0/auth/keys</code> (planned).
      </div>

      <section className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/60 text-left text-xs uppercase tracking-wider text-soya-muted">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Prefix</th>
              <th className="px-4 py-3 font-medium">Scopes</th>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3 font-medium">Last used</th>
              <th className="px-4 py-3 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="table-row">
                <td className="px-4 py-3 font-medium">{r.name}</td>
                <td className="px-4 py-3 font-mono text-xs text-soya-muted">
                  {r.prefix}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {r.scopes.map((s) => (
                      <span key={s} className="badge font-mono">
                        {s}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-soya-muted text-xs">
                  {r.created}
                </td>
                <td className="px-4 py-3 text-soya-muted text-xs">
                  {r.lastUsed}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    className="btn-danger px-3 py-1 text-xs"
                    onClick={() => setRevoke(r)}
                  >
                    Revoke
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {open ? (
        <Modal onClose={() => setOpen(false)}>
          {draft.rawKey ? (
            <CreatedKey
              rawKey={draft.rawKey}
              onClose={() => setOpen(false)}
            />
          ) : (
            <CreateForm
              draft={draft}
              setDraft={setDraft}
              onCancel={() => setOpen(false)}
              onSubmit={submitCreate}
            />
          )}
        </Modal>
      ) : null}

      {revoke ? (
        <Modal onClose={() => setRevoke(null)}>
          <h2 className="text-lg font-semibold tracking-tight">
            Revoke <span className="font-mono text-soya-accent">{revoke.name}</span>?
          </h2>
          <p className="mt-2 text-sm text-soya-muted">
            This will immediately invalidate the key. Any clients still using
            it will get 401. This cannot be undone.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <button className="btn-ghost" onClick={() => setRevoke(null)}>
              Cancel
            </button>
            <button className="btn-danger" onClick={confirmRevoke}>
              Revoke
            </button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}

function CreateForm({
  draft,
  setDraft,
  onCancel,
  onSubmit,
}: {
  draft: NewKeyModalState;
  setDraft: (s: NewKeyModalState) => void;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  const toggle = (s: string) => {
    setDraft({
      ...draft,
      scopes: draft.scopes.includes(s)
        ? draft.scopes.filter((x) => x !== s)
        : [...draft.scopes, s],
    });
  };
  return (
    <>
      <h2 className="text-lg font-semibold tracking-tight">Create API key</h2>
      <p className="mt-1 text-sm text-soya-muted">
        Pick a memorable name and the smallest set of scopes that gets the job done.
      </p>
      <div className="mt-4 flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <span className="label">Name</span>
          <input
            className="input"
            placeholder="my-project-prod"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="label">Scopes</span>
          <div className="grid grid-cols-2 gap-2">
            {ALL_SCOPES.map((s) => (
              <label
                key={s}
                className="flex items-center gap-2 rounded-btn border border-soya-line bg-white/60 px-3 py-2 text-xs font-mono"
              >
                <input
                  type="checkbox"
                  className="accent-soya-accent"
                  checked={draft.scopes.includes(s)}
                  onChange={() => toggle(s)}
                />
                {s}
              </label>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <button className="btn-ghost" onClick={onCancel}>
          Cancel
        </button>
        <button
          className="btn-primary"
          onClick={onSubmit}
          disabled={!draft.name.trim() || draft.scopes.length === 0}
        >
          Create
        </button>
      </div>
    </>
  );
}

function CreatedKey({
  rawKey,
  onClose,
}: {
  rawKey: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(rawKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked — user can still select manually */
    }
  };
  return (
    <>
      <h2 className="text-lg font-semibold tracking-tight">Key created</h2>
      <div className="mt-3 rounded-card border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
        Make sure to copy this key now. We won't show it again.
      </div>
      <div className="mt-3 flex items-center gap-2">
        <code className="flex-1 rounded-btn border border-soya-line bg-white px-3 py-2 font-mono text-xs break-all">
          {rawKey}
        </code>
        <button className="btn-primary" onClick={copy}>
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <div className="mt-5 flex justify-end">
        <button className="btn-ghost" onClick={onClose}>
          Done
        </button>
      </div>
    </>
  );
}

function Modal({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-soya-ink/30 p-4"
      onClick={onClose}
    >
      <div
        className="card w-full max-w-md p-5"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
