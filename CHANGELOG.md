# Changelog

All notable changes to SoyaOS Studio will be documented in this file.

The format is based on [Keep a Changelog v1.1.0](https://keepachangelog.com/en/1.1.0/),
and this app adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0-alpha.0] — 2026-05-19

### Added

- Initial Vite + React + Tailwind scaffold for SoyaOS Studio — the
  in-binary control-plane web UI shipped via `go:embed web/dist/`.
- Four placeholder routes:
  - `/` — Overview cards (Agents / Keys / Recent Scopes).
  - `/agents` — Agent list.
  - `/scopes` — Live Scope event stream.
  - `/keys` — API key management.
- Base components: `Nav`, `StatusCard`.
- `vite.config.ts` configured with `base: "./"` so the output is
  embeddable behind any path served by `soyaos serve`.

[Unreleased]: https://github.com/soyaos/studio/compare/v0.1.0-alpha.0...HEAD
[0.1.0-alpha.0]: https://github.com/soyaos/studio/releases/tag/v0.1.0-alpha.0
