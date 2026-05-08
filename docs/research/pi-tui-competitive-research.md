# Pi / OpenClaw / opencode — Competitive TUI Research

**Source:** Perplexity research session 2026-05-08T03:42 + 03:43 (archived).
**Purpose:** Capture the design intent and primitives we are competing against / learning from when building the K-Universe Agent Harness.

---

## Pi (pi.dev) — What It Is

A minimal, highly extensible terminal coding agent. Installed via shell script, run as `pi`, lives in a TUI. Ships with strong defaults but **deliberately omits opinionated features** so users build or install exactly what they need.

### Pi's Four Modes

1. **Interactive** — full TUI experience.
2. **Print/JSON** — `pi -p "query"` for one-shot scripts; `--mode json` for structured event streams.
3. **RPC** — JSON protocol over stdin/stdout for non-Node integrations.
4. **SDK** — embed Pi as a library (e.g. OpenClaw embeds Pi).

### Pi's Extensibility Surface

- Extensions are TypeScript modules with access to tools, commands, keybindings, events, and the full TUI.
- Skills, prompt templates, themes, and packages installable via `pi install npm:@foo/...` or `pi install git:github.com/...`.
- 15+ providers, hundreds of models, swap via `/model`, `Ctrl+L`, `Ctrl+P`.
- Sessions stored as **tree-structured histories** (`/tree`, bookmark, `/export`, `/share` as gist).
- Context engineering: `AGENTS.md`, `SYSTEM.md`, automatic compaction, on-demand skills, dynamic context injection.

### Pi's "What We Didn't Build" Philosophy

Pi explicitly omits and defers to user composition:

- **No MCP** — build CLI tools with READMEs (skills) instead.
- **No sub-agents** — spawn Pi instances via tmux.
- **No permission popups** — run in a container or write your own confirmation flow.
- **No plan mode** — write plans to files.
- **No built-in to-dos** — use `TODO.md`.
- **No background bash** — use tmux.

This is the **"primitives, not features"** stance.

---

## OpenClaw

A real-world example of Pi embedded as an SDK. Uses Pi's coding-agent engine inside its own UX. Demonstrates that Pi's RPC + SDK modes are production-viable as embed targets.

---

## opencode TUI (generic)

A "core opencode TUI" is a generic terminal UI for arbitrary workflows — panes, keybindings, views, dispatch — but **no baked-in LLM semantics**. The dev owns the event loop and input map; agent behavior is hand-crafted or external.

### Core opencode vs Pi — Comparison

| Aspect             | Core opencode TUI                          | Pi coding-agent TUI                                   |
| ------------------ | ------------------------------------------ | ----------------------------------------------------- |
| Primary purpose    | General terminal UI around arbitrary tools | Coding-agent harness around LLM + tools               |
| Feature model      | Features baked into app or plugins         | Minimal core, features via extensions/skills/packages |
| Extensibility      | App-specific, language-dependent           | TypeScript extensions with full TUI access            |
| Agent semantics    | Optional/custom, not inherent              | First-class (sessions, tools, context, models)        |
| Workflow stance    | Users adapt to app's built-ins             | Pi adapts to existing tmux/CLI/TODO workflows         |
| Integration modes  | Usually interactive only                   | TUI, Print/JSON, RPC, SDK                             |
| Installed features | Fixed by app, plus plugins                 | Installable Pi packages from npm/git                  |

---

## Implications for K-Universe Agent Harness (K2)

The K2 harness explicitly takes the **opposite stance from Pi on one axis**: it ships a **typed JSON protocol as a hard contract** with K2 invariants:

1. `protocolVersion: "1.0"` on every command.
2. `SessionUpdated.state` must be `SessionStateSnapshot`, never `z.any()`.
3. Every job emits exactly one `JobCompleteEvent` (cancellation = `successful: false`).

K2 keeps Pi's **headless-core / swappable-adapter** model:

- `src/core/` has zero UI imports.
- `src/protocol/` is the only UI boundary.
- `src/adapters/cli.ts`, `vscode.ts`, `socket.ts` consume the protocol — never bypass it.

The "primitives, not features" intent **survives** in our adapter design — but the protocol layer is **stricter** than Pi's RPC because we want type safety end-to-end.

---

## Feasibility Note (from research)

Building a Pi-class harness with mostly AI-driven coding + an FRD is **viable in days for a Pi-lite prototype**, weeks-to-months for parity. Key human-required decisions: primitives design, security/FS policy, UX iteration. Code generation itself is the easy part.

---

## Open Questions

- Should K2 expose a Pi-style `pi install` packaging surface for skills?
- Is the Pi tree-history pattern worth adopting for session branching?
- Does the K2 protocol need a "non-Node RPC" mode like Pi's stdin/stdout JSON?

These are tracked as separate research, not committed design decisions.
