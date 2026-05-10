# Copilot instructions for `ku-signal`

## Build, test, and validation commands

Prefer Bun for automation and validation. The CI and release workflows both use Bun (`.github/workflows/ci.yml`, `.github/workflows/release.yml`), while the repo still commits `pnpm-lock.yaml`, so keep the workflow choice and the tracked lockfile in mind when changing dependencies.

```bash
bun install --frozen-lockfile
bun run typecheck
bun run test
bun run test:watch
bunx vitest run tests/unit/runner.test.ts
bunx vitest run tests/unit/commands.test.ts
bunx vitest run tests/unit/runner.test.ts -t "sends a message and returns assistant response"
bun run verify
bun run build
bun run dev
```

Notes:

- There is no dedicated lint script in `package.json`.
- `bun run verify` runs `scripts/verify.ts`, which checks the K-Wire invariants described below.
- `bun run dev` executes `src/cli.ts` directly through `tsx`.
- CI runs commands in this order: install, typecheck, test, build.
- `prepublishOnly` runs `bun run typecheck && bun run build`, but the release workflow publishes with `npm publish --ignore-scripts`.

## High-level architecture

The main entrypoint is `src/cli.ts`. It loads persisted config from `src/config.ts`, builds a `ProviderRegistry`, loads repo context from `BYTE.md`, `AGENTS.md`, or `CLAUDE.md` via `src/context.ts`, creates a `Runner`, and then either runs one-shot or starts the Ink TUI from `src/adapters/tui.ts`. One-shot mode is triggered solely by the presence of a positional `prompt` argument; the `-p`/`--print` flag is declared but its value is never read in this path.

The runtime is split into three layers:

1. `src/protocol/` defines the K-Wire command, event, and session-state schemas with Zod.
2. `src/core/` contains the provider-agnostic model types (`models.ts`), the stateful tool-calling loop (`runner.ts`), and the AgentCore session/job orchestration surface (`agent.ts`).
3. `src/adapters/`, `src/providers/`, `src/tools/`, and `src/tui/` plug transports, model backends, tool implementations, and the terminal UI into that core.

When a message is sent, `Runner.sendMessage()` appends to history, calls the selected provider, executes requested tools from `src/tools/index.ts`, records tool results back into history, and repeats until the model returns a normal response or the 10-iteration cap is hit (`src/core/runner.ts`).

Provider SDK code is intentionally isolated under `src/providers/`. `src/core/models.ts` is a type-only contract for `ModelProvider`, and `src/providers/registry.ts` resolves named providers such as Anthropic, OpenAI, LM Studio, and custom OpenAI-compatible endpoints registered in `src/cli.ts`.

The TUI is an Ink app in `src/tui/App.tsx`. Slash commands are parsed centrally in `src/tui/commands.ts`, while UI pieces like `Header`, `MessageList`, `SidePanel`, and `SlashInput` stay in `src/tui/`.

There is also a protocol-facing AgentCore path in `src/core/agent.ts` and `src/adapters/cli.ts` / `src/adapters/vscode.ts`. That path wraps the runner and tools in K-Wire session/job events so other hosts can speak the same command/event protocol as the TUI-facing runtime.

User-level persistence is outside the repo. Config is stored through `conf` in `src/config.ts`. Sessions are stored as validated user/assistant-only JSON by `src/sessions.ts`; the path is hardcoded to `%APPDATA%\ku-signal\sessions` on Windows via `sessionsDir()` — `ByteConfigSchema.sessionDir` exists in the schema but is never read by the session layer, so it has no effect. Extensions are discovered from the per-user extensions directory by `src/extensions/loader.ts`.

## Key conventions

### K-Wire protocol invariants are enforced, not optional

Keep `scripts/verify.ts` passing. In particular:

- Every command schema in `src/protocol/commands.ts` must keep `protocolVersion: z.literal("1.0")`.
- `SessionUpdated.state` in `src/protocol/events.ts` must use `SessionStateSnapshotSchema`, never `z.any()`.
- `AgentCore` in `src/core/agent.ts` must keep the five-method surface: `createSession`, `destroySession`, `executeCommand`, `invokeTool`, and `cancelJob`.
- `executeCommand` splits on command type: `SendMessage` returns a live streaming `EventStream` from `handleSendMessage` (yields `JobStarted`, `TokenChunk`, and `JobComplete` events). All other command types (`CreateSession`, `DestroySession`, `ExecuteTool`, `CancelJob`) dispatch to their respective methods — which emit via `onEvent` — then return the empty stub `streamEvents()`.
- `src/core/models.ts` must stay provider-agnostic and free of SDK imports such as `openai` or `@anthropic-ai/sdk`.

These rules are repeated across the FRD and ADRs in `docs/FRD-001-Agent-Harness.md`, `docs/ADR-001-Protocol-Design.md`, and `docs/ADR-002-Session-Lifecycle.md`.

### Use Zod schemas as the source of truth

The protocol uses `z.discriminatedUnion("type", ...)` for commands and events. When extending the wire format, update the Zod schema and exported TypeScript type together inside `src/protocol/` rather than adding parallel handwritten guards elsewhere.

### Keep provider integrations out of core

If you add or change a provider, implement it under `src/providers/` against the `ModelProvider` interface. For OpenAI-compatible endpoints, use the `provider:add` CLI command — it calls `addCustomProvider()` in `src/config.ts`, persisting the entry to `cfg.customProviders`. `buildRegistry()` in `src/cli.ts` loops that array and registers each one; `ProviderRegistry.resolve()` in `src/providers/registry.ts` then instantiates on demand. Do not leak SDK-specific types or imports into `src/core/models.ts` or the generic runner.

### Root context files matter at runtime

`loadRepoContext()` only checks `BYTE.md`, then `AGENTS.md`, then `CLAUDE.md` in the current working directory root, and returns the first file it finds (`src/context.ts`). If you are adding project-wide agent guidance that should be injected into prompts, place it in one of those files at the repo root and be aware that later files are ignored when an earlier one exists.

### Know the extension loader constraints

`discoverExtensions()` in `src/extensions/loader.ts` scans only **immediate subdirectories** of the per-user extensions dir (Windows: `%APPDATA%\ku-signal\extensions`). Each subdirectory must contain a `byte.extension.json` file. Invalid or unparseable manifests are silently skipped (`safeParse` failure → `continue`).

Required manifest fields are defined by `ExtensionManifestSchema` in `src/extensions/manifest.ts`: `name`, `version` (semver), `description`, `byteVersion`, and `entry`. Valid `permissions` values are `file_read`, `file_write`, `bash`, and `network`.

### Active source is under `src/`, `tests/`, `scripts/`, and docs

Do not hand-edit `dist/`; it is the TypeScript build output. Also treat `_incoming/`, `_removed-after-compile/`, `source-archive/`, and most of `notes/` as staging or archival material unless the task is explicitly about those artifacts. `.npmignore` excludes those areas from the published package.

### Slash commands and tool exports are centralized

If you add a TUI slash command, update `src/tui/commands.ts` and the tests in `tests/unit/commands.test.ts`. If you add a tool, wire it through `src/tools/index.ts` so both the CLI runtime and tests see the same exported registry.
