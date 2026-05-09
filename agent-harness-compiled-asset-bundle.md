# K-Universe Agent Harness — Compiled Asset Bundle

**Compiled:** 2026-05-08
**Source recompile of:** 7 Downloads markdown exports + nested ZIP (`k2-agent-harness-assets.zip`)
**K-Wire Verification:** PASS (4/4 invariants)
**Project root:** `D:\home\byte\dev\projects\k-universe-agent-harness\`

This document is the **navigation index** for the recompiled asset bundle. It replaces the four overlapping Perplexity exports as the single entry point — but does **not** rewrite the canonical files. All canonical content lives in the project tree below; this doc tells you where to find each piece and which source it came from.

---

## Project Layout

```
k-universe-agent-harness/
├── README.md                                ← project entry point
├── agent-harness-compiled-asset-bundle.md   ← this file
├── docs/
│   ├── FRD-001-Agent-Harness.md             ← canonical FRD
│   ├── protocol-spec.md                     ← protocol surface
│   ├── ADR-001-Protocol-Design.md
│   ├── ADR-002-Session-Lifecycle.md
│   ├── research/
│   │   ├── model-provider-matrix.md
│   │   ├── zip-script-audit.md              ← script.py / script_1.py audit
│   │   ├── pi-tui-competitive-research.md   ← Pi / OpenClaw / opencode research
│   │   ├── tui-design-workflow-080526.md    ← screenshot/prompt/skill workflow
│   │   └── tui-aesthetics/
│   │       └── README.md                    ← multi-aesthetic experiments index
│   └── runbooks/
│       ├── debugging.md
│       └── deployment.md
├── src/
│   ├── protocol/
│   │   ├── state.ts                         ← SessionStateSnapshot (KWire-1)
│   │   ├── commands.ts                      ← protocolVersion: "1.0" (KWire-2)
│   │   └── events.ts                        ← JobCompleteEvent
│   ├── core/
│   │   ├── agent.ts                         ← AgentCore 5 methods (KWire-3)
│   │   └── models.ts                        ← zero provider SDK imports (ARCH)
│   └── adapters/
│       ├── cli.ts
│       ├── socket.ts
│       └── vscode.ts
├── scripts/
│   ├── install.sh
│   ├── scaffold.ts
│   └── verify.ts                            ← canonical K-Wire verifier
├── notes/
│   ├── kwire-verification-report.md            ← all 4 invariants PASS
│   └── intent-preservation.md               ← what was preserved/removed and why
├── source-archive/                          ← 8 raw inputs preserved untouched
├── _incoming/
│   ├── outer/                               ← script.py, script_1.py, nested zip
│   └── nested/                              ← extracted nested ZIP files
└── _removed-after-compile/                  ← 2 quarantined duplicates
```

---

## K-Wire INVARIANT Verification

All 4 invariants verified on the canonical extracted files:

| ID   | Check                                                                                              | Source file                | Status |
| ---- | -------------------------------------------------------------------------------------------------- | -------------------------- | ------ |
| KWire-1 | `SessionUpdated.state` uses `SessionStateSnapshotSchema`                                           | `src/protocol/events.ts`   | PASS   |
| KWire-2 | All 4 commands include `protocolVersion: z.literal("1.0")`                                         | `src/protocol/commands.ts` | PASS   |
| KWire-3 | `AgentCore` exposes `createSession`, `destroySession`, `executeCommand`, `invokeTool`, `cancelJob` | `src/core/agent.ts`        | PASS   |
| ARCH | `src/core/models.ts` has zero provider SDK imports                                                 | `src/core/models.ts`       | PASS   |

Full report: [`notes/kwire-verification-report.md`](notes/kwire-verification-report.md).

---

## Source Inputs (preserved in `source-archive/`)

| File                                                                                                      | Role                               | Action                                                        |
| --------------------------------------------------------------------------------------------------------- | ---------------------------------- | ------------------------------------------------------------- |
| `# K-Universe Agent Harness — Complete Asset Scaffo.md` (85KB)                                            | Asset checklist + K-Wire BLOCKER prose | Reference                                                     |
| `Perplexity-Generate a complete, exportable asset bundle for t-Response-1-2026-05-08T03-53-25.md` (168KB) | Primary asset bundle prose         | Reference                                                     |
| `Perplexity-You are generating the complete asset bundle for t-Response-1-2026-05-08T03-58-19.md` (99KB)  | Tertiary fallback prose            | Reference                                                     |
| `Perplexity-Summarize the current webpage-Full-Chat-2026-05-08T03-43-35.md` (93KB)                        | Pi competitive research            | Distilled into `docs/research/pi-tui-competitive-research.md` |
| `Perplexity-Summarize the current webpage-Response-6-2026-05-08T03-42-34.md` (10KB)                       | Pi research excerpt                | Distilled into the same                                       |
| `K-Universe Agent Harness — Complete Asset Scaffold.md` (variant)                                         | Variant of asset scaffold          | Reference                                                     |
| `K-Universe Agent Harness — Asset Scaffold (Full File Set).md`                                            | Variant                            | Reference                                                     |

Two files quarantined to `_removed-after-compile/` — see `notes/intent-preservation.md`:

- `Perplexity-...03-58-19 (1).md` — pure SHA256 duplicate.
- `docs_FRD-001-Agent-Harness.md.md` — malformed double-extension duplicate of `docs/FRD-001-Agent-Harness.md`.

---

## How to Use This Bundle

### To read the design

1. `docs/FRD-001-Agent-Harness.md` — what the harness is and why.
2. `docs/protocol-spec.md` — wire format.
3. `docs/ADR-001-Protocol-Design.md` and `ADR-002-Session-Lifecycle.md` — decisions.

### To verify the bundle

```powershell
cd D:\home\byte\dev\projects\k-universe-agent-harness
# canonical TS verifier:
bun run scripts/verify.ts
```

### To extend the harness

1. Read `docs/research/pi-tui-competitive-research.md` for the design stance.
2. Read `docs/research/tui-design-workflow-080526.md` for the iteration workflow.
3. Pick or add an experiment in `docs/research/tui-aesthetics/`.
4. Build an adapter in `src/adapters/` consuming only `src/protocol/`.

### To regenerate the source bundle from scratch

`_incoming/outer/script.py` is the inline-content bundle generator. **Do not run** without first comparing its inline strings to the current `src/`/`docs/`/`scripts/` state — they may have diverged.

---

## Compile Log

1. ✅ Created 13-subdir destination structure.
2. ✅ Extracted outer ZIP, hashed all 3 entries.
3. ✅ Audited `script.py` and `script_1.py` (read-only, both safe — see `docs/research/zip-script-audit.md`).
4. ✅ Extracted nested ZIP, copied 19 canonical files to project tree.
5. ✅ Ran K-Wire INVARIANT checks via PowerShell regex grep — 4/4 PASS.
6. ✅ Verified SHA256 of `(1)` duplicate matches non-`(1)` byte-for-byte.
7. ✅ Archived all 8 raw inputs to `source-archive/`.
8. ✅ Quarantined 2 removal candidates to `_removed-after-compile/`.
9. ✅ Distilled Pi/OpenClaw/opencode research into `docs/research/pi-tui-competitive-research.md`.
10. ✅ Recorded TUI design workflow into `docs/research/tui-design-workflow-080526.md`.
11. ✅ Indexed multi-aesthetic experiments in `docs/research/tui-aesthetics/README.md`.
12. ✅ Recorded preservation intent into `notes/intent-preservation.md`.
13. ✅ Wrote this compiled bundle index.
