# KU-Signal — Roadmap

![Status](https://img.shields.io/badge/status-active--development-blue)
![npm](https://img.shields.io/npm/v/@k-universe/signal)
[![Open Issues](https://github.com/k-universe-dev/ku-signal/issues)](https://github.com/k-universe-dev/ku-signal/issues)

> KU-Signal is K-Universe's agent coordination engine: a typed K-Wire protocol,
> a headless AgentCore, and swappable adapters (CLI / Ink TUI / VS Code /
> WebSocket) exposed as an MCP server. It runs independently of K-BYTE.

**Last updated:** 2026-09-11
**Maintainer:** [@byteser9](https://github.com/byteser9)
**Provenance:** derived from `README.md`, `CHANGELOG.md`,
`docs/k-universe-product-matrix.md`, and the plan files under
`docs/superpowers/plans/`. Linked plans/PRs are canonical; unlinked items are
summaries, not issue records.

---

## Naming (use these exactly)

| Thing | Value |
|---|---|
| Product | KU-Signal |
| Repo | `k-universe-dev/ku-signal` |
| npm package | `@k-universe/signal` |
| Binary | `ku-signal` |
| MCP server key | `ku-signal` |
| Org | `k-universe-dev` |

> **Drift to fix:** `docs/superpowers/plans/001`–`003` are still titled
> "KU-BYTE Plan …" and use `byte init`. `KU-BYTE` was this project's former
> name; `K-BYTE` is a *different* product (the shared runtime engine). Left
> as-is for history — update titles if the plans are ever re-activated.

---

## Milestones

| # | Milestone | Plan | Status |
|---|---|---|---|
| M1 | Core agent wire-up + streaming — `Runner` wired into `AgentCore`, `TokenChunk` events | [001](docs/superpowers/plans/2026-05-08-001-core-agent-wire-up.md) | ✅ Shipped in 0.1.0 |
| M2 | TUI respin — dense multi-panel Ink layout, slash commands, typewriter streaming | [002](docs/superpowers/plans/2026-05-08-002-tui-respin.md) | ✅ Shipped in 0.1.0 |
| M3 | Extension host foundation — repo context, typed manifests, `byte init` wizard | [003](docs/superpowers/plans/2026-05-08-003-extension-host-foundation.md) | 🟡 Foundation in tree (`src/extensions/`); host polish open |
| M4 | Universal tool distribution — npm/bun/pnpm, curl binary, Homebrew, AUR, AI-tool install | [004](docs/superpowers/plans/2026-05-09-004-distribution.md) | ✅ Complete (product matrix) |
| M5 | Provider registry — cloud-extensible OpenAI-compatible providers + OAuth | [005](docs/superpowers/plans/2026-05-09-005-provider-registry.md) | ✅ Complete (product matrix) |

Internal modules: **Channel** (agent chat bus) · **Territory** (workspace radar —
ports, git, env, services) · **Run** (sandboxed shell exec) · **Search**
(file/tree operations).

---

## Current — 0.1.x

- [x] K-Wire v1.0 invariants verified (`npx tsx scripts/verify.ts`, 4/4 PASS)
- [x] Cross-platform binaries via Bun compile (linux amd64/arm64, darwin amd64/arm64, windows amd64)
- [x] CI green on `main`
- [x] Binary Validation green on `main` — musl binaries smoke-tested in Alpine (qemu for arm64); `darwin-amd64` moved to the supported `macos-15-intel` runner ([#6](https://github.com/k-universe-dev/ku-signal/pull/6))

## Next

- [ ] Tag and publish the next `0.1.x` once the tree is release-clean
- [ ] Aligned `v2.0.0` — KU-Signal ships **first** in the K-Universe release order
      (before `ku-cli`, `ku-code`, `ku-ide`), no K-BYTE dependency
- [ ] M3: finish the extension host (`byte init` → `ku-signal init`, manifest discovery)
- [ ] Verify every distribution channel end-to-end (Homebrew tap, AUR `ku-signal-bin`, Windows)

## Open cleanup

- [ ] SOT cleanup operation — reduce source-of-truth files to the core minimum
      and reconcile them (tracked in [`docs/## Todo.md`](docs/%23%23%20Todo.md))
- [ ] Move `docs/## Todo.md` to a stable filename; the `## ` prefix + space is
      drift-prone (kept in place for now — it is a harness note, not a SOT file)

---

## Out of scope

- Any backend beyond the current protocol/runtime split
- A second TUI framework (Ink is the terminal surface)
- Folding KU-Signal into K-BYTE — it is intentionally independent
