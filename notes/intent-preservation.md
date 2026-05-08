# Intent Preservation Notes

**Date:** 2026-05-08
**Purpose:** Record what intent was preserved during the asset-bundle recompile, and what was deliberately _not_ collapsed.

---

## What Was Preserved

### 1. All Plans

Every planning document the user produced is retained — either as a canonical doc in `docs/`, a research artifact in `docs/research/`, or as a raw export in `source-archive/`.

### 2. Multi-Aesthetic TUI Research

Multiple TUI aesthetic experiments are kept as parallel tracks in `docs/research/tui-aesthetics/`. They are **not** merged into a single "final" aesthetic. Reason: the harness is adapter-agnostic at the protocol layer; collapsing prematurely would leak aesthetic into core decisions.

### 3. Pi / OpenClaw / opencode Competitive Research

Captured in `docs/research/pi-tui-competitive-research.md` with explicit notes on which Pi stances K2 adopts (headless core, swappable adapters) and which K2 deliberately diverges from (typed JSON protocol with hard invariants vs Pi's looser RPC).

### 4. K2 Verification Invariants

The 4 K2 blocker checks are preserved verbatim:

- K2-1: `SessionUpdated.state` uses `SessionStateSnapshotSchema`.
- K2-2: every command schema includes `protocolVersion: z.literal("1.0")`.
- K2-3: `AgentCore` exposes 5 methods (`createSession`, `destroySession`, `executeCommand`, `invokeTool`, `cancelJob`).
- ARCH: `src/core/models.ts` has zero provider SDK imports.

All 4 pass against the extracted source — see `notes/k2-verification-report.md`.

### 5. Generator Script Knowledge

`script.py` (the asset-bundle generator) is preserved in `_incoming/outer/` and audited in `docs/research/zip-script-audit.md`. If the bundle ever needs to be regenerated from edits to inline templates, the generator pattern is recoverable.

---

## What Was Removed (Only 2 Files)

### 1. `Perplexity-You are generating the complete asset bundle for t-Response-1-2026-05-08T03-58-19 (1).md`

- **Verified pure byte-for-byte duplicate** of the non-`(1)` version (SHA256 match, same size 99081 bytes).
- Quarantined to `_removed-after-compile/`. Original (non-`(1)`) is preserved in `source-archive/`.

### 2. `docs_FRD-001-Agent-Harness.md.md`

- Malformed double extension (`.md.md`).
- Content (FRD) is fully captured in `docs/FRD-001-Agent-Harness.md` (the canonical version from the nested ZIP).
- Quarantined to `_removed-after-compile/`, not deleted, so it can be recovered if any unique paragraph is later spotted.

---

## What Was _Not_ Done

- **No content was rewritten.** The canonical `docs/`, `src/`, `scripts/`, and `notes/` files come directly from the nested ZIP — they are the source of truth, not a re-prose'd version of the markdown exports.
- **No aesthetic was selected.** TUI aesthetic decisions remain open.
- **No deletions happened.** The 2 "removed" files are quarantined, not deleted, until reviewed.
- **No Python script was executed.** Both were read-only audited. `scripts/verify.ts` is the canonical verifier.

---

## Source Priority Order (Conflict Resolution)

If two sources disagree on a code block or schema:

1. Real `.ts`/`.md` files extracted from the nested ZIP (in `src/`, `docs/`, `scripts/`, `notes/`) — **highest authority**.
2. `Perplexity-Generate a complete, exportable asset bundle for t-Response-1-2026-05-08T03-53-25.md` — primary prose reference for verification language and broader context.
3. `# K-Universe Agent Harness — Complete Asset Scaffo.md` — secondary, especially for K2 blocker context and required asset checklist.
4. `Perplexity-You are generating the complete asset bundle for t-Response-1-2026-05-08T03-58-19.md` — tertiary fallback only when wording is clearer than the primary.
