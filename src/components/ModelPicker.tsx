import { useEffect, useState } from "react";

import { listModels, type Model } from "../api/models";

interface ModelPickerProps {
  value: string;
  onChange(model: string): void;
}

export default function ModelPicker({ value, onChange }: ModelPickerProps) {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    listModels()
      .then((m) => {
        if (cancelled) return;
        setModels(m);
        if (!value && m.length > 0) onChange(m[0]!.id);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // We deliberately re-run only on mount: model list is stable per session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col gap-1">
      <span className="label">Model</span>
      <select
        className="input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading || models.length === 0}
      >
        {models.length === 0 ? (
          <option value="">{loading ? "Loading…" : "no models"}</option>
        ) : (
          models.map((m) => (
            <option key={m.id} value={m.id}>
              {m.id}
              {m.owned_by ? `  ·  ${m.owned_by}` : ""}
            </option>
          ))
        )}
      </select>
      {error ? (
        <span className="text-xs text-red-600">Failed to load models: {error}</span>
      ) : null}
    </div>
  );
}
