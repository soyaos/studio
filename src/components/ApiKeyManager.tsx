import { useEffect, useState } from "react";

import { getApiKey, setApiKey } from "../api/client";

/**
 * Inline editor for the Bearer key used to talk to /v1/*. Persists to
 * localStorage. Renders as a small labelled input.
 */
export default function ApiKeyManager() {
  const [value, setValue] = useState(getApiKey());
  const [reveal, setReveal] = useState(false);

  useEffect(() => {
    setApiKey(value);
  }, [value]);

  return (
    <div className="flex flex-col gap-1">
      <span className="label">API key (Bearer)</span>
      <div className="flex gap-2">
        <input
          className="input font-mono text-xs"
          type={reveal ? "text" : "password"}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="sk-soya-…"
          spellCheck={false}
          autoComplete="off"
        />
        <button
          type="button"
          className="btn-ghost px-3"
          onClick={() => setReveal((v) => !v)}
        >
          {reveal ? "Hide" : "Show"}
        </button>
      </div>
    </div>
  );
}
