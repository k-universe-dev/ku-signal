# TUI Design Workflow — 2026-05-08

**Source:** Working notes captured during 2026-05-08 session, alongside Pi research and the K-Wire asset bundle generation.
**Purpose:** Record the workflow being used to design the K-Universe TUI aesthetic, and the heuristics chosen for AI-driven layout iteration.

---

## Workflow Inputs

Three competing input modes were evaluated for driving TUI aesthetic exploration:

1. **Screenshot-driven** — paste a screenshot, ask the model to describe and reproduce the layout.
2. **Prompt-driven** — write a constraint-first prompt describing intent, then iterate.
3. **Skill-driven** — package recurring layout patterns into reusable skills (Claude / Copilot / OpenCode skill format).

### Verdict

- **Screenshot mode** is best for _capturing_ an existing aesthetic accurately.
- **Prompt mode** is best for _originating_ something new with explicit constraints.
- **Skill mode** is best for _enforcing consistency_ once a direction is locked.

The three are complementary — the workflow uses all three, not one.

---

## Constraint-First Prompting

For TUI generation, prompts must lead with hard constraints, not preferences:

1. **Frame size** — exact rows × cols (e.g. 40×120).
2. **Box-drawing alphabet** — pick one set (`─│┌┐└┘`, `═║╔╗╚╝`, ASCII `-|+`) and lock it.
3. **Color depth** — 16-color, 256-color, or truecolor — pick one.
4. **Information hierarchy** — what _must_ be on screen vs what is on-demand.
5. **Input affordance** — what keys do what, shown where.
6. **Negative space rule** — minimum padding, never collapse below that.

Models drift if these are left implicit. Stating them up front prevents 80% of iteration loops.

---

## TUI Studio Workflow (Local)

When iterating on a TUI aesthetic without committing to code:

1. Render candidate frames as plain `.txt` or `.md` code blocks.
2. Compare side-by-side visually before any TS/Rust commitment.
3. Lock the winning frame as a "spec frame" — a fixed visual reference that the implementation must match.
4. Implementation passes either match the spec frame exactly or are rejected.

This decouples _aesthetic decisions_ from _implementation details_. The aesthetic survives a re-implementation in a different framework (Ink, Ratatui, Bubble Tea, Textual).

---

## Why Multiple Aesthetics Stay Separate

The K-Universe research deliberately holds **multiple TUI aesthetic experiments in parallel** rather than collapsing to one early. Reasons:

1. The harness must be **adapter-agnostic** at the protocol level — a single locked aesthetic would leak into core decisions it shouldn't influence.
2. Different aesthetics surface different protocol gaps (e.g. a dense compact view exposes any `SessionStateSnapshot` field the protocol forgot to expose).
3. The K-Wire INVARIANTs (typed protocol, no `z.any()`, JobComplete finality) are aesthetic-agnostic by design — proving this means iterating multiple aesthetics against the same core.

See `docs/research/tui-aesthetics/` for the individual experiments. They are **not** to be merged into a single "final" aesthetic without an explicit decision recorded in an ADR.

---

## Tooling Notes

- **Ink** (React for CLIs) — fastest iteration, JSX-native, fits TS-strict harness.
- **Ratatui** (Rust) — best perf, would require a Rust adapter package, currently out of scope.
- **Bubble Tea** (Go) — reference for Elm-style state machines; useful as a _pattern_ even if not used directly.
- **Textual** (Python) — strong widget library, would require a Python adapter, out of scope.

Default direction for first K-Wire TUI adapter: **Ink**, because it consumes the existing TS protocol package without an FFI layer.

---

## Open Decisions (not yet locked)

- Whether the first shipped adapter is a fullscreen TUI or a streaming stdout printer (Pi's Print/JSON mode equivalent).
- Whether the TUI exposes the session tree (Pi's `/tree`) or only the linear active branch.
- Whether keybindings are configurable from a JSON file at launch or compiled in.

These remain open by design — see the aesthetic experiments folder.
