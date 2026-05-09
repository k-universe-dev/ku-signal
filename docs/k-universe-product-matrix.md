# K-Universe Product Matrix

**Date:** 2026-05-09
**Status:** Architecture locked — distribution work in progress.

---

## Infrastructure Layers

| Layer | Role |
|---|---|
| **K-Orbit** | Metasystem guardrails — cross-product alignment, sandboxing, permission model |
| **K-Wire** | Protocol — typed JSON invariants v1.0 |
| **K-BYTE** | Runtime engine — powers all KU- products (except KU-Signal which is independent) |

---

## KU-Products

### KU-CODE — Terminal Dev Interface

| Field | Value |
|---|---|
| GitHub | `github.com/k-universe-dev/ku-code` |
| npm | `@ku/code` |
| Binary | `ku-code` |
| Surface | TUI — Ink, terminal dev interface |
| K-BYTE | Required (session runtime) |
| Design | Ink ANSI tokens |

**Plan 004 status:** Not started

---

### KU-CLI — Shell Automation

| Field | Value |
|---|---|
| GitHub | `github.com/k-universe-dev/ku-cli` |
| npm | `@ku/cli` |
| Binary | `ku-cli` |
| Surface | Shell — bare metal stdin/stdout |
| K-BYTE | Required (execution layer) |
| Design | Ink tokens (help/status only) |

**Plan 004 status:** Not started

---

### KU-IDE — Desktop Application

| Field | Value |
|---|---|
| GitHub | `github.com/k-universe-dev/ku-ide` |
| npm | `@ku/ide` (design tokens only) |
| Binary | `KU IDE` (OS-level app) |
| Surface | Desktop — Tauri V2 + React 19 |
| K-BYTE | Required (Tauri backend, WebSocket to frontend) |
| Design | Skin design system (NOT Ink) |

**Plan 004 status:** Not started

Distribution targets for KU-IDE differ from CLI products:
- `.msi` (Windows)
- `.dmg` (macOS, Apple Silicon + Intel)
- `.deb`, `.rpm`, `.AppImage` (Linux)

---

### KU-Signal — MCP Agent Coordination

| Field | Value |
|---|---|
| GitHub | `github.com/k-universe-dev/ku-signal` |
| npm | `@ku/signal` |
| Binary | `ku-signal` |
| Surface | MCP server — agent coordination, workspace awareness |
| K-BYTE | NOT required (runs independently) |
| Design | N/A (machine-facing) |

**Plan 004 status:** ✅ Complete
**Plan 005 status:** ✅ Complete (provider registry, OAI-compat adapter, OAuth)

**Internal modules:**
- Channel — chat bus (agent messaging)
- Territory — workspace radar (ports, git, env, services)
- Run — shell exec (sandboxed task runner)
- Search — file/tree operations

---

## Release Order

Dependency order for aligned `v2.0.0` release across all products:

1. **K-Wire v1.0** — already locked (no changes needed)
2. **KU-Signal v2.0.0** — ships first (no K-BYTE dependency)
3. **KU-CLI v2.0.0** — ships second (K-BYTE required)
4. **KU-CODE v2.0.0** — ships third (K-BYTE + Ink)
5. **KU-IDE v2.0.0** — ships fourth (Tauri build is slowest)

Each product publishes independently with aligned version tag.

---

## Naming Conventions

- npm scopes: `@ku/*` for all products
- MCP server keys: `ku-*` (e.g., `ku-signal`, never `kflow-*` or mixed)
- Binary names: `ku-code`, `ku-cli`, `ku-signal`
- GitHub org: `k-universe-dev`

---

## Plan 004 Distribution Checklist (per product)

For each product that needs Plan 004:
- [ ] Binary compile script (`scripts/build-binaries.sh`)
- [ ] GoReleaser config (`.goreleaser.yml`)
- [ ] GitHub Actions release workflow (`.github/workflows/release.yml`)
- [ ] curl installer (`install.sh`)
- [ ] npm package config (package.json: `bin`, `files`, `publishConfig`)
- [ ] README with install section
- [ ] AI tool MCP blocks (Claude Code / Cursor / Windsurf / OpenCode)
