# TUI Aesthetic Experiments — Index

This folder holds **separate, parallel** TUI aesthetic experiments for the K-Universe Agent Harness. Each file represents a distinct visual direction that has **not** been merged or down-selected.

## Why Separate

See `../tui-design-workflow-080526.md` § "Why Multiple Aesthetics Stay Separate".

Short version: the harness is adapter-agnostic, and holding multiple aesthetics in parallel pressure-tests the protocol surface. Premature collapse to a single style leaks aesthetic decisions into the core.

## How to Add a New Experiment

1. Create `aesthetic-NN-<short-name>.md` (e.g. `aesthetic-01-dense-compact.md`).
2. Lead with a "spec frame" — a fixed visual reference, ASCII or rendered.
3. Document the box-drawing alphabet, color depth, and information hierarchy.
4. List the protocol fields exposed and any gaps surfaced.
5. Do **not** mark any experiment as "winner" without an ADR in `../../ADR-NNN-tui-aesthetic-decision.md`.

## Current Experiments

_(Populated as experiments are added. Initial state: empty — the asset bundle was protocol-first, aesthetic experiments are tracked separately and added per session.)_

## Heuristic for Future Selection

When the harness is ready to lock one aesthetic for the first shipped adapter:

1. Each experiment must build against the **same** protocol bundle without modification.
2. The selected experiment is recorded in an ADR.
3. Non-selected experiments are **kept** here as alternative adapters or as research artifacts — never deleted.
