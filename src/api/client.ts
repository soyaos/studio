// Tiny fetch wrapper shared by every API module.
//
// During `bun run dev` requests go to the Vite dev server (port 5173)
// which proxies /v1, /control, and /healthz to the SoyaOS gateway on
// 127.0.0.1:7474 (see vite.config.ts). In production the SPA is
// served from the same origin as the gateway by `soyaos serve`, so
// relative URLs Just Work — no CORS, no host config.

const STORAGE_KEY = "soya.studio.apiKey";
const DEFAULT_KEY = "sk-soya-dev-local";

export function getApiKey(): string {
  if (typeof window === "undefined") return DEFAULT_KEY;
  return window.localStorage.getItem(STORAGE_KEY) ?? DEFAULT_KEY;
}

export function setApiKey(key: string): void {
  if (typeof window === "undefined") return;
  if (key) window.localStorage.setItem(STORAGE_KEY, key);
  else window.localStorage.removeItem(STORAGE_KEY);
}

export interface RequestOptions extends RequestInit {
  /** When true, do not attach Authorization. Used for /healthz. */
  anonymous?: boolean;
}

export async function apiFetch(
  path: string,
  opts: RequestOptions = {},
): Promise<Response> {
  const { anonymous, headers, ...rest } = opts;
  const finalHeaders = new Headers(headers ?? {});
  if (!anonymous) {
    finalHeaders.set("Authorization", `Bearer ${getApiKey()}`);
  }
  if (
    !finalHeaders.has("Content-Type") &&
    rest.body &&
    typeof rest.body === "string"
  ) {
    finalHeaders.set("Content-Type", "application/json");
  }
  return fetch(path, { ...rest, headers: finalHeaders });
}

export async function apiJson<T>(
  path: string,
  opts: RequestOptions = {},
): Promise<T> {
  const res = await apiFetch(path, opts);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `HTTP ${res.status} ${res.statusText}${text ? ` — ${text}` : ""}`,
    );
  }
  return (await res.json()) as T;
}
