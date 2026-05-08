# K-Universe Agent Harness

Typed-protocol coding-agent harness with K2 invariants. Headless core, swappable adapters (CLI / VS Code / socket).

**Status:** Asset bundle recompiled and verified 2026-05-08. K2 invariants 4/4 PASS.

## Start here

- [`agent-harness-compiled-asset-bundle.md`](agent-harness-compiled-asset-bundle.md) — navigation index for the whole bundle.
- [`docs/FRD-001-Agent-Harness.md`](docs/FRD-001-Agent-Harness.md) — what this is and why.
- [`docs/protocol-spec.md`](docs/protocol-spec.md) — wire format.
- [`notes/k2-verification-report.md`](notes/k2-verification-report.md) — invariant proof.
- [`notes/intent-preservation.md`](notes/intent-preservation.md) — what was preserved during the recompile.

## Layout

| Path                      | Purpose                                                                       |
| ------------------------- | ----------------------------------------------------------------------------- |
| `src/protocol/`           | Typed Zod schemas. Only UI boundary.                                          |
| `src/core/`               | Headless agent core. Zero UI imports.                                         |
| `src/adapters/`           | CLI, socket, VS Code. Consume protocol only.                                  |
| `scripts/`                | `install.sh`, `scaffold.ts`, `verify.ts`.                                     |
| `docs/`                   | FRD, protocol spec, ADRs, runbooks.                                           |
| `docs/research/`          | Pi/opencode competitive research, TUI design workflow, aesthetic experiments. |
| `notes/`                  | Verification report, preservation intent.                                     |
| `source-archive/`         | Original 8 markdown exports — preserved untouched.                            |
| `_incoming/`              | Raw extracted ZIP contents for traceability.                                  |
| `_removed-after-compile/` | 2 quarantined duplicates. Not deleted.                                        |

## Verify

```powershell
bun run scripts/verify.ts
```
