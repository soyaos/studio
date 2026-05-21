<p align="center">
  <img src="public/logo.png" alt="SoyaOS" width="120" height="120" />
</p>

# studio

**SoyaOS Studio** — the control-plane web UI shipped *inside* the main
`soyaos` binary via `go:embed`.

> If you are a user, you don't install Studio. You run `soyaos serve` and
> open <http://localhost:7474/>. The binary embeds a pre-built copy of
> the `dist/` folder from this repo.

## Stack

- [Vite](https://vitejs.dev) for builds (no SSR — pure static SPA).
- [React 18](https://react.dev) with `react-router-dom` v6 (`BrowserRouter`).
- [Tailwind CSS](https://tailwindcss.com) with the SoyaOS warm palette.
- [react-markdown](https://github.com/remarkjs/react-markdown) +
  [remark-gfm](https://github.com/remarkjs/remark-gfm) for chat bubbles.
- [Bun](https://bun.sh) for local dev; `npm` works too.

## Pages

| Route      | What it does                                                  | Wired to                                            |
| ---------- | ------------------------------------------------------------- | --------------------------------------------------- |
| `/`        | Version / edition / agents / BYOK stats + quick links          | `GET /healthz?format=json`, `GET /v1/models`         |
| `/chat`    | OpenAI-compat chat with SSE streaming, markdown, token counts | `POST /v1/chat/completions` (`stream: true`)        |
| `/agents`  | Registered agents with one-click "try in chat"                | `GET /control/v0/agents` (fallback `GET /v1/agents`)|
| `/keys`    | API key CRUD UI (demo state only, server endpoint pending)    | mock (planned `/control/v0/auth/keys`)              |
| `/trace`   | Recent inference traces (mock, real source: SoyaScope)        | mock (planned `/control/v0/scope/recent`)           |

## Local dev

```bash
bun install
bun run dev          # http://localhost:5173

# build for production
bun run build        # writes dist/
```

`bun run dev` proxies `/v1`, `/control` and `/healthz` to
`http://127.0.0.1:7474`, so you can run a SoyaOS binary alongside Vite
and the SPA will talk to it directly with no CORS hassle. See
`vite.config.ts`.

## 中文 Quickstart

SoyaOS Studio 是 `soyaos serve` 启动时通过 `go:embed` 嵌入的控制台 Web UI。
本地开发：

```bash
bun install
bun run dev          # 等价于 npm install && npm run dev
```

构建产物在 `dist/`。

## How this gets shipped

`soyaos/soyaos` ships a pre-built copy of this repo's `dist/` via Go's
`//go:embed web/dist/*`. Two practical consequences:

1. **`dist/` is committed.** That is the explicit trade-off: a slightly
   bigger git history in exchange for a release-self-contained binary.
   See `.gitignore` for the comment.
2. **`vite.config.ts` sets `base: "./"`.** All assets in `index.html` are
   referenced via relative URLs, so deep links such as `/chat` survive a
   page reload regardless of which prefix the Go side mounts the SPA at.
   The Go server must fall back unknown GET routes (other than `/v1/*`,
   `/control/*`, `/healthz`) to `index.html` for client-side routing to
   work.

## Deploy

The `.github/workflows/sync-to-main.yml` action listens for studio
GitHub Releases and opens a sync PR against `soyaos/soyaos` that
bumps `internal/studio/dist/`. The main repo `//go:embed`s that
directory, so merging the auto-PR is what ships a new Studio bundle.

To enable cross-repo PR creation, set one secret on this repo:

| Secret             | Where it goes                                   | Permissions                                                    |
| ------------------ | ----------------------------------------------- | -------------------------------------------------------------- |
| `SOYAOS_REPO_PAT`  | Settings → Secrets and variables → Actions      | `contents: write` + `pull-requests: write` on `soyaos/soyaos`. |

When the secret is absent, the workflow no-ops with a warning — it
never blocks a studio release.

## License

[MIT](./LICENSE) — © 2026 SoyaOS Contributors.
