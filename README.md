# studio

**SoyaOS Studio** — the control-plane web UI shipped *inside* the main
`soyaos` binary via `go:embed`.

> If you are a user, you don't install Studio. You run `soyaos serve` and
> open <http://localhost:8717/studio/>. The binary embeds a pre-built copy
> of the `dist/` folder from this repo.

## Stack

- [Vite](https://vitejs.dev) for builds (no SSR — pure static SPA).
- [React 18](https://react.dev) with `react-router-dom` (HashRouter, so
  the build is path-agnostic and embeddable).
- [Tailwind CSS](https://tailwindcss.com) with the SoyaOS palette.
- [Bun](https://bun.sh) for local dev; `npm` works too.

## Alpha surfaces

| Route       | Status         |
| ----------- | -------------- |
| `/`         | Overview cards |
| `/agents`   | Agent list     |
| `/scopes`   | Scope stream   |
| `/keys`     | API key mgmt   |

Everything is wired to placeholder data in `0.1.0-alpha.0`. Real RPCs
(via `@soyaos/sdk`'s `ControlClient`) land in `0.1.0-alpha.1`.

## Local dev

```bash
bun install
bun run dev          # http://localhost:5173

# build for production
bun run build        # writes dist/
```

## 中文 Quickstart

SoyaOS Studio 是 `soyaos serve` 启动时通过 `go:embed` 嵌入的控制台 Web UI。
本地开发：

```bash
bun install
bun run dev          # 等价于 npm install && npm run dev
```

构建产物在 `dist/`。

## How this gets shipped

A GitHub Action in `soyaos/soyaos` runs `bun run build` on tag bumps and
copies the resulting `dist/` into `soyaos/soyaos/web/dist/`. The Go side
declares:

```go
//go:embed web/dist
var studioFS embed.FS
```

The HashRouter + `base: "./"` settings ensure the build keeps working
regardless of where in the URL tree `soyaos serve` decides to mount it.

## License

[MIT](./LICENSE) — © 2026 SoyaOS Contributors.
