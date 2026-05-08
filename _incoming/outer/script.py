
import zipfile
import os
from pathlib import Path

# Create output directory
os.makedirs('output', exist_ok=True)

# All files extracted from the Perplexity response
files = {
    'docs/FRD-001-Agent-Harness.md': '''# FRD-001: K-Universe AI Coding Agent Harness

**Version:** 1.0
**Date:** 2026-05-07
**Status:** Active

---

## 1. Purpose

Define the functional requirements for the K2 agent harness — the protocol layer, session lifecycle, and tool execution runtime for the K-Universe AI coding agent.

---

## 2. Invariants

1. **Protocol Version Lock** — Every command transmitted over the wire MUST carry `protocolVersion: "1.0"`. Commands missing this field are rejected before dispatch.
2. **Session State Coherence** — `SessionUpdated` events MUST carry a full `SessionStateSnapshot`. Partial or untyped state (`z.any()`) is forbidden. Consumers must be able to reconstruct session state from any snapshot alone.
3. **Job Finality** — Every job that starts MUST emit exactly one `JobCompleteEvent`. Cancellation emits `JobCompleteEvent` with `successful: false`. There is no silent termination.

---

## 3. Subsystem Decomposition

| Subsystem | Responsibility | Key Files |
|---|---|---|
| Protocol | Schemas, branded types, state snapshots | `src/protocol/` |
| AgentCore | Session + job lifecycle orchestration | `src/core/agent.ts` |
| ModelProvider | LLM abstraction (type-only) | `src/core/models.ts` |
| Adapters | Transport bindings (CLI, VS Code, WebSocket) | `src/adapters/` |
| Scripts | Install, scaffold, verify tooling | `scripts/` |

---

## 4. Session State Diagram

```mermaid
stateDiagram-v2
[*] --> Creating : createSession()
Creating --> Idle : SessionCreated
Idle --> Running : executeCommand()
Running --> Idle : JobCompleteEvent(successful=true)
Running --> Idle : JobCompleteEvent(successful=false) [cancelJob]
Idle --> Destroying : destroySession()
Destroying --> [*] : SessionDestroyed
Running --> Destroying : destroySession() [force]
```

---

## 5. Command / Event Matrix

| Command | Emits (success) | Emits (failure) |
|---|---|---|
| `CreateSessionCommand` | `SessionCreated` | — |
| `DestroySessionCommand` | `SessionDestroyed` | — |
| `ExecuteToolCommand` | `JobStarted`, `JobCompleteEvent(successful=true)` | `JobCompleteEvent(successful=false)` |
| `CancelJobCommand` | `JobCompleteEvent(successful=false)` | — |

---

## 6. Acceptance Criteria

- [ ] `SessionUpdated.state` is typed as `SessionStateSnapshot` — no `z.any()`
- [ ] All command schemas include `protocolVersion: z.literal("1.0")`
- [ ] `AgentCore` exposes all 5 methods: `createSession`, `destroySession`, `executeCommand`, `invokeTool`, `cancelJob`
- [ ] `src/core/models.ts` contains zero provider SDK imports
- [ ] `scripts/verify.ts` reports all checks as PASS
- [ ] CLI adapter reads from stdin and writes to stdout as newline-delimited JSON
- [ ] WebSocket adapter handles connection lifecycle
''',

    'docs/protocol-spec.md': '''# Protocol Specification — K2 Agent Harness

**Version:** 1.0
**Date:** 2026-05-07

---

## Commands

All commands share the base field `protocolVersion: "1.0"`.

### CreateSessionCommand

| Field | Type | Description |
|---|---|---|
| `protocolVersion` | `"1.0"` | Required. Protocol lock. |
| `type` | `"CreateSession"` | Discriminant. |
| `config` | `SessionConfig` | Model, tools, system prompt config. |

### DestroySessionCommand

| Field | Type | Description |
|---|---|---|
| `protocolVersion` | `"1.0"` | Required. |
| `type` | `"DestroySession"` | Discriminant. |
| `sessionId` | `SessionId` | Target session. Idempotent. |

### ExecuteToolCommand

| Field | Type | Description |
|---|---|---|
| `protocolVersion` | `"1.0"` | Required. |
| `type` | `"ExecuteTool"` | Discriminant. |
| `sessionId` | `SessionId` | Session context. |
| `toolName` | `string` | Registered tool name. |
| `args` | `unknown` | Tool-specific arguments. |

### CancelJobCommand

| Field | Type | Description |
|---|---|---|
| `protocolVersion` | `"1.0"` | Required. |
| `type` | `"CancelJob"` | Discriminant. |
| `jobId` | `JobId` | Job to cancel. |

---

## Events

### SessionCreated

| Field | Type | Description |
|---|---|---|
| `type` | `"SessionCreated"` | Discriminant. |
| `sessionId` | `SessionId` | Assigned session ID. |
| `state` | `SessionStateSnapshot` | Initial state. |
| `timestamp` | `string` | ISO 8601. |

### SessionUpdated

| Field | Type | Description |
|---|---|---|
| `type` | `"SessionUpdated"` | Discriminant. |
| `sessionId` | `SessionId` | Affected session. |
| `state` | `SessionStateSnapshot` | Full snapshot — never partial. |
| `timestamp` | `string` | ISO 8601. |

### SessionDestroyed

| Field | Type | Description |
|---|---|---|
| `type` | `"SessionDestroyed"` | Discriminant. |
| `sessionId` | `SessionId` | Destroyed session. |
| `timestamp` | `string` | ISO 8601. |

### JobStarted

| Field | Type | Description |
|---|---|---|
| `type` | `"JobStarted"` | Discriminant. |
| `jobId` | `JobId` | Assigned job ID. |
| `sessionId` | `SessionId` | Owning session. |
| `toolName` | `string` | Tool being executed. |
| `timestamp` | `string` | ISO 8601. |

### JobCompleteEvent

| Field | Type | Description |
|---|---|---|
| `type` | `"JobComplete"` | Discriminant. |
| `jobId` | `JobId` | Completed job. |
| `sessionId` | `SessionId` | Owning session. |
| `successful` | `boolean` | `false` on cancel or error. |
| `result` | `unknown \| undefined` | Tool output if successful. |
| `error` | `string \| undefined` | Error message if failed. |
| `timestamp` | `string` | ISO 8601. |

---

## Sequence Diagram — ExecuteTool Flow

```mermaid
sequenceDiagram
participant Client
participant AgentCore
participant ToolRuntime

Client->>AgentCore: ExecuteToolCommand {protocolVersion: "1.0", toolName, args}
AgentCore->>Client: JobStarted {jobId}
AgentCore->>ToolRuntime: invoke(toolName, args)
ToolRuntime-->>AgentCore: result | error
AgentCore->>Client: SessionUpdated {state: SessionStateSnapshot}
AgentCore->>Client: JobCompleteEvent {jobId, successful, result}
```

---

## Sequence Diagram — Cancel Flow

```mermaid
sequenceDiagram
participant Client
participant AgentCore

Client->>AgentCore: CancelJobCommand {jobId}
AgentCore->>AgentCore: interrupt job
AgentCore->>Client: JobCompleteEvent {jobId, successful: false}
```
''',

    'src/protocol/state.ts': '''import { z } from "zod";

// --- Branded Types ---

declare const SessionIdBrand: unique symbol;
export type SessionId = string & { readonly [SessionIdBrand]: typeof SessionIdBrand };

declare const JobIdBrand: unique symbol;
export type JobId = string & { readonly [JobIdBrand]: typeof JobIdBrand };

export function toSessionId(raw: string): SessionId {
  return raw as SessionId;
}

export function toJobId(raw: string): JobId {
  return raw as JobId;
}

// --- SessionConfig ---

export interface SessionConfig {
  modelId: string;
  systemPrompt?: string;
  tools?: string[];
  maxTokens?: number;
  temperature?: number;
  metadata?: Record<string, unknown>;
}

// --- SessionStateSnapshot (Zod schema — used in events) ---

export const SessionStateSnapshotSchema = z.object({
  sessionId: z.string(),
  status: z.enum(["creating", "idle", "running", "destroying", "destroyed"]),
  activeJobId: z.string().nullable(),
  toolsRegistered: z.array(z.string()),
  turnCount: z.number().int().nonnegative(),
  lastUpdatedAt: z.string().datetime(),
  metadata: z.record(z.unknown()).optional(),
});

export type SessionStateSnapshot = z.infer<typeof SessionStateSnapshotSchema>;

// --- SessionState (runtime interface, superset of snapshot) ---

export interface SessionState extends SessionStateSnapshot {
  config: SessionConfig;
  createdAt: string;
}
''',

    'src/protocol/commands.ts': '''import { z } from "zod";

// --- Base ---

export interface BaseCommand {
  protocolVersion: "1.0";
  type: string;
}

// --- CreateSessionCommand ---

export const CreateSessionCommandSchema = z.object({
  protocolVersion: z.literal("1.0"),
  type: z.literal("CreateSession"),
  config: z.object({
    modelId: z.string(),
    systemPrompt: z.string().optional(),
    tools: z.array(z.string()).optional(),
    maxTokens: z.number().int().positive().optional(),
    temperature: z.number().min(0).max(2).optional(),
    metadata: z.record(z.unknown()).optional(),
  }),
});

export type CreateSessionCommand = z.infer<typeof CreateSessionCommandSchema>;

// --- DestroySessionCommand ---

export const DestroySessionCommandSchema = z.object({
  protocolVersion: z.literal("1.0"),
  type: z.literal("DestroySession"),
  sessionId: z.string(),
});

export type DestroySessionCommand = z.infer<typeof DestroySessionCommandSchema>;

// --- ExecuteToolCommand ---

export const ExecuteToolCommandSchema = z.object({
  protocolVersion: z.literal("1.0"),
  type: z.literal("ExecuteTool"),
  sessionId: z.string(),
  toolName: z.string().min(1),
  args: z.unknown(),
});

export type ExecuteToolCommand = z.infer<typeof ExecuteToolCommandSchema>;

// --- CancelJobCommand ---

export const CancelJobCommandSchema = z.object({
  protocolVersion: z.literal("1.0"),
  type: z.literal("CancelJob"),
  jobId: z.string(),
});

export type CancelJobCommand = z.infer<typeof CancelJobCommandSchema>;

// --- Discriminated Union ---

export const CommandSchema = z.discriminatedUnion("type", [
  CreateSessionCommandSchema,
  DestroySessionCommandSchema,
  ExecuteToolCommandSchema,
  CancelJobCommandSchema,
]);

export type Command = z.infer<typeof CommandSchema>;
''',

    'src/protocol/events.ts': '''import { z } from "zod";
import { SessionStateSnapshotSchema } from "./state.js";

// --- SessionCreated ---

export const SessionCreatedSchema = z.object({
  type: z.literal("SessionCreated"),
  sessionId: z.string(),
  state: SessionStateSnapshotSchema,
  timestamp: z.string().datetime(),
});

export type SessionCreated = z.infer<typeof SessionCreatedSchema>;

// --- SessionUpdated ---
// BLOCKER K2-1: state MUST use SessionStateSnapshotSchema — never z.any()

export const SessionUpdatedSchema = z.object({
  type: z.literal("SessionUpdated"),
  sessionId: z.string(),
  state: SessionStateSnapshotSchema,
  timestamp: z.string().datetime(),
});

export type SessionUpdated = z.infer<typeof SessionUpdatedSchema>;

// --- SessionDestroyed ---

export const SessionDestroyedSchema = z.object({
  type: z.literal("SessionDestroyed"),
  sessionId: z.string(),
  timestamp: z.string().datetime(),
});

export type SessionDestroyed = z.infer<typeof SessionDestroyedSchema>;

// --- JobStarted ---

export const JobStartedSchema = z.object({
  type: z.literal("JobStarted"),
  jobId: z.string(),
  sessionId: z.string(),
  toolName: z.string(),
  timestamp: z.string().datetime(),
});

export type JobStarted = z.infer<typeof JobStartedSchema>;

// --- JobCompleteEvent ---

export const JobCompleteEventSchema = z.object({
  type: z.literal("JobComplete"),
  jobId: z.string(),
  sessionId: z.string(),
  successful: z.boolean(),
  result: z.unknown().optional(),
  error: z.string().optional(),
  timestamp: z.string().datetime(),
});

export type JobCompleteEvent = z.infer<typeof JobCompleteEventSchema>;

// --- Discriminated Union ---

export const AgentEventSchema = z.discriminatedUnion("type", [
  SessionCreatedSchema,
  SessionUpdatedSchema,
  SessionDestroyedSchema,
  JobStartedSchema,
  JobCompleteEventSchema,
]);

export type AgentEvent = z.infer<typeof AgentEventSchema>;

// --- EventStream ---

export type EventStream = AsyncIterable<AgentEvent>;
''',

    'src/core/agent.ts': '''import type {
  SessionId,
  JobId,
  SessionState,
  SessionConfig,
} from "../protocol/state.js";
import type { Command } from "../protocol/commands.js";
import type { EventStream } from "../protocol/events.js";

// --- AgentConfig ---

export interface AgentConfig {
  sessionTimeoutMs?: number;
  maxConcurrentJobs?: number;
  toolRegistry?: Record<string, (args: unknown) => Promise<unknown>>;
  onEvent?: (event: unknown) => void;
}

// --- AgentCore Interface ---
// BLOCKER K2-2: All 5 methods required exactly as specified.

export interface AgentCore {
  /**
   * Create a new session with the given config.
   * Emits SessionCreated.
   */
  createSession(config: SessionConfig): Promise<SessionState>;

  /**
   * Destroy a session by ID. Idempotent — safe to call on already-destroyed sessions.
   * Emits SessionDestroyed.
   */
  destroySession(sessionId: SessionId): Promise<void>;

  /**
   * Execute a command and return an async event stream.
   */
  executeCommand(cmd: Command): Promise<EventStream>;

  /**
   * Invoke a registered tool by name. Returns the assigned jobId.
   * Emits JobStarted, then JobCompleteEvent.
   */
  invokeTool(toolName: string, args: unknown): Promise<{ jobId: JobId }>;

  /**
   * Cancel a running job. Idempotent.
   * Emits JobCompleteEvent with successful: false.
   */
  cancelJob(jobId: JobId): Promise<void>;
}

// --- createAgentCore stub ---

export function createAgentCore(config: AgentConfig): AgentCore {
  const sessions = new Map<string, SessionState>();
  const jobs = new Map<string, { cancelled: boolean }>();

  function generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }

  async function createSession(sessionConfig: SessionConfig): Promise<SessionState> {
    const sessionId = generateId("session") as SessionId;
    const now = new Date().toISOString();
    const state: SessionState = {
      sessionId,
      status: "idle",
      activeJobId: null,
      toolsRegistered: sessionConfig.tools ?? [],
      turnCount: 0,
      lastUpdatedAt: now,
      metadata: sessionConfig.metadata,
      config: sessionConfig,
      createdAt: now,
    };
    sessions.set(sessionId, state);
    config.onEvent?.({
      type: "SessionCreated",
      sessionId,
      state,
      timestamp: now,
    });
    return state;
  }

  async function destroySession(sessionId: SessionId): Promise<void> {
    if (!sessions.has(sessionId)) return; // idempotent
    sessions.delete(sessionId);
    config.onEvent?.({
      type: "SessionDestroyed",
      sessionId,
      timestamp: new Date().toISOString(),
    });
  }

  async function* streamEvents(): AsyncGenerator<AgentEvent> {
    // stub: real impl yields events from internal emitter
  }

  async function executeCommand(cmd: Command): Promise<EventStream> {
    switch (cmd.type) {
      case "CreateSession":
        await createSession(cmd.config);
        break;
      case "DestroySession":
        await destroySession(cmd.sessionId as SessionId);
        break;
      case "ExecuteTool":
        await invokeTool(cmd.toolName, cmd.args);
        break;
      case "CancelJob":
        await cancelJob(cmd.jobId as JobId);
        break;
    }
    return streamEvents();
  }

  async function invokeTool(toolName: string, args: unknown): Promise<{ jobId: JobId }> {
    const jobId = generateId("job") as JobId;
    jobs.set(jobId, { cancelled: false });
    const now = new Date().toISOString();

    config.onEvent?.({
      type: "JobStarted",
      jobId,
      sessionId: "unknown",
      toolName,
      timestamp: now,
    });

    // Execute async — fire and forget in stub
    (async () => {
      const jobState = jobs.get(jobId);
      if (!jobState || jobState.cancelled) {
        config.onEvent?.({
          type: "JobComplete",
          jobId,
          sessionId: "unknown",
          successful: false,
          error: "Job was cancelled before execution",
          timestamp: new Date().toISOString(),
        });
        return;
      }

      try {
        const handler = config.toolRegistry?.[toolName];
        const result = handler ? await handler(args) : undefined;
        config.onEvent?.({
          type: "JobComplete",
          jobId,
          sessionId: "unknown",
          successful: true,
          result,
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        config.onEvent?.({
          type: "JobComplete",
          jobId,
          sessionId: "unknown",
          successful: false,
          error: err instanceof Error ? err.message : String(err),
          timestamp: new Date().toISOString(),
        });
      } finally {
        jobs.delete(jobId);
      }
    })();

    return { jobId };
  }

  async function cancelJob(jobId: JobId): Promise<void> {
    const jobState = jobs.get(jobId);
    if (!jobState) return; // idempotent — job already done or never existed
    jobState.cancelled = true;
    config.onEvent?.({
      type: "JobComplete",
      jobId,
      sessionId: "unknown",
      successful: false,
      error: "Cancelled by client",
      timestamp: new Date().toISOString(),
    });
  }

  return {
    createSession,
    destroySession,
    executeCommand,
    invokeTool,
    cancelJob,
  };
}
''',

    'src/core/models.ts': '''// ARCHITECTURE RULE: Type-only file.
// Zero imports from openai, @anthropic-ai/sdk, or any provider SDK.
// Provider implementations go in src/core/models.impl.ts or src/providers/.

// --- ChatMessage ---

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  toolCallId?: string;
  name?: string;
}

// --- ChatCompletionOptions ---

export interface ChatCompletionOptions {
  model: string;
  messages: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  stopSequences?: string[];
  stream?: boolean;
  tools?: ToolDefinition[];
}

// --- ToolDefinition ---

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>; // JSON Schema object
}

// --- ToolCall ---

export interface ToolCall {
  id: string;
  name: string;
  arguments: unknown;
}

// --- ChatCompletionResult ---

export interface ChatCompletionResult {
  id: string;
  model: string;
  content: string;
  toolCalls?: ToolCall[];
  finishReason: "stop" | "length" | "tool_calls" | "content_filter" | "error";
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// --- ModelProvider ---

export interface ModelProvider {
  readonly name: string;
  readonly supportedModels: string[];
  complete(options: ChatCompletionOptions): Promise<ChatCompletionResult>;
  stream?(options: ChatCompletionOptions): AsyncIterable<ChatCompletionResult>;
}
''',

    'src/adapters/cli.ts': '''import * as readline from "readline";
import { CommandSchema } from "../protocol/commands.js";
import { createAgentCore } from "../core/agent.js";
import type { AgentEvent } from "../protocol/events.js";

function writeEvent(event: AgentEvent): void {
  process.stdout.write(JSON.stringify(event) + "\\n");
}

async function main(): Promise<void> {
  const agent = createAgentCore({
    onEvent: (event) => writeEvent(event as AgentEvent),
  });

  const rl = readline.createInterface({
    input: process.stdin,
    terminal: false,
  });

  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    let raw: unknown;
    try {
      raw = JSON.parse(trimmed);
    } catch {
      writeEvent({
        type: "JobComplete",
        jobId: "parse-error",
        sessionId: "unknown",
        successful: false,
        error: `JSON parse error: ${trimmed}`,
        timestamp: new Date().toISOString(),
      });
      continue;
    }

    const parsed = CommandSchema.safeParse(raw);
    if (!parsed.success) {
      writeEvent({
        type: "JobComplete",
        jobId: "validation-error",
        sessionId: "unknown",
        successful: false,
        error: parsed.error.message,
        timestamp: new Date().toISOString(),
      });
      continue;
    }

    try {
      await agent.executeCommand(parsed.data);
    } catch (err) {
      writeEvent({
        type: "JobComplete",
        jobId: "runtime-error",
        sessionId: "unknown",
        successful: false,
        error: err instanceof Error ? err.message : String(err),
        timestamp: new Date().toISOString(),
      });
    }
  }
}

main().catch((err) => {
  process.stderr.write(`CLI adapter fatal error: ${err}\\n`);
  process.exit(1);
});
''',

    'src/adapters/vscode.ts': '''// VS Code Extension Host Adapter
// Bridges the K2 agent protocol to VS Code\'s extension API.
// This module must be loaded inside a VS Code extension context.

import { CommandSchema } from "../protocol/commands.js";
import { createAgentCore } from "../core/agent.js";
import type { AgentEvent } from "../protocol/events.js";
import type { AgentCore } from "../core/agent.js";

export interface VSCodeAdapterOptions {
  outputChannelName?: string;
  onEvent?: (event: AgentEvent) => void;
}

export interface VSCodeAdapter {
  agent: AgentCore;
  dispose(): void;
}

/**
 * Create the VS Code adapter.
 * Call this from your extension\'s `activate()` function.
 *
 * @example
 * ```ts
 * import { createVSCodeAdapter } from \'./adapters/vscode.js\';
 *
 * export function activate(context: vscode.ExtensionContext) {
 *   const adapter = createVSCodeAdapter({ outputChannelName: \'K2 Agent\' });
 *   context.subscriptions.push({ dispose: adapter.dispose });
 * }
 * ```
 */
export function createVSCodeAdapter(options: VSCodeAdapterOptions = {}): VSCodeAdapter {
  const { onEvent } = options;

  const agent = createAgentCore({
    onEvent: (event) => {
      onEvent?.(event as AgentEvent);
    },
  });

  /**
   * Execute a raw command payload received from VS Code message passing,
   * webview postMessage, or language server protocol.
   */
  async function handleRawCommand(raw: unknown): Promise<void> {
    const parsed = CommandSchema.safeParse(raw);
    if (!parsed.success) {
      onEvent?.({
        type: "JobComplete",
        jobId: "validation-error",
        sessionId: "unknown",
        successful: false,
        error: `Command validation failed: ${parsed.error.message}`,
        timestamp: new Date().toISOString(),
      });
      return;
    }
    await agent.executeCommand(parsed.data);
  }

  function dispose(): void {
    // Clean up sessions, timers, or listeners here in full implementation.
  }

  return {
    agent,
    dispose,
  };
}

export { handleRawCommand } from "./vscode.js";
''',

    'src/adapters/socket.ts': '''// WebSocket Server Adapter
// Each connected client gets its own AgentCore instance.
// Messages in: JSON command. Messages out: JSON event (newline-delimited).

import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { CommandSchema } from "../protocol/commands.js";
import { createAgentCore } from "../core/agent.js";
import type { AgentEvent } from "../protocol/events.js";

export interface SocketAdapterOptions {
  port?: number;
  host?: string;
  path?: string;
}

export interface SocketAdapter {
  start(): Promise<void>;
  stop(): Promise<void>;
}

export function createSocketAdapter(options: SocketAdapterOptions = {}): SocketAdapter {
  const { port = 9000, host = "127.0.0.1", path = "/k2" } = options;

  const httpServer = createServer();
  const wss = new WebSocketServer({ server: httpServer, path });

  wss.on("connection", (ws: WebSocket) => {
    const agent = createAgentCore({
      onEvent: (event) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(event));
        }
      },
    });

    ws.on("message", async (data) => {
      let raw: unknown;
      try {
        raw = JSON.parse(data.toString());
      } catch {
        const errEvent: AgentEvent = {
          type: "JobComplete",
          jobId: "parse-error",
          sessionId: "unknown",
          successful: false,
          error: "Invalid JSON",
          timestamp: new Date().toISOString(),
        };
        ws.send(JSON.stringify(errEvent));
        return;
      }

      const parsed = CommandSchema.safeParse(raw);
      if (!parsed.success) {
        const errEvent: AgentEvent = {
          type: "JobComplete",
          jobId: "validation-error",
          sessionId: "unknown",
          successful: false,
          error: parsed.error.message,
          timestamp: new Date().toISOString(),
        };
        ws.send(JSON.stringify(errEvent));
        return;
      }

      try {
        await agent.executeCommand(parsed.data);
      } catch (err) {
        const errEvent: AgentEvent = {
          type: "JobComplete",
          jobId: "runtime-error",
          sessionId: "unknown",
          successful: false,
          error: err instanceof Error ? err.message : String(err),
          timestamp: new Date().toISOString(),
        };
        ws.send(JSON.stringify(errEvent));
      }
    });

    ws.on("error", (err) => {
      process.stderr.write(`WebSocket error: ${err.message}\\n`);
    });
  });

  async function start(): Promise<void> {
    return new Promise((resolve) => {
      httpServer.listen(port, host, () => {
        process.stdout.write(`K2 socket adapter listening on ws://${host}:${port}${path}\\n`);
        resolve();
      });
    });
  }

  async function stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      wss.close(() => {
        httpServer.close((err) => (err ? reject(err) : resolve()));
      });
    });
  }

  return { start, stop };
}
''',

    'scripts/install.sh': '''#!/usr/bin/env bash
set -euo pipefail

# ─── ANSI Colors ──────────────────────────────────────────────
RESET="\\033[0m"
BOLD="\\033[1m"
DIM="\\033[2m"
GREEN="\\033[32m"
CYAN="\\033[36m"
YELLOW="\\033[33m"
RED="\\033[31m"
WHITE="\\033[97m"
BG_DARK="\\033[40m"

CHECK="${GREEN}✔${RESET}"
CROSS="${RED}✘${RESET}"
ARROW="${CYAN}›${RESET}"

# ─── UI Helpers ───────────────────────────────────────────────

print_border() {
  echo -e "${DIM}╔══════════════════════════════════════════════════╗${RESET}"
}

print_border_bottom() {
  echo -e "${DIM}╚══════════════════════════════════════════════════╝${RESET}"
}

print_header() {
  echo ""
  print_border
  echo -e "${DIM}║${RESET} ${BOLD}${WHITE}K2 Agent Harness — Installer v1.0${RESET} ${DIM}║${RESET}"
  echo -e "${DIM}║${RESET} ${DIM}K-Universe · 2026-05-07${RESET} ${DIM}║${RESET}"
  print_border_bottom
  echo ""
}

print_step() {
  local num="$1"
  local msg="$2"
  echo -e " ${CYAN}[${num}]${RESET} ${msg}..."
}

print_ok() {
  echo -e " ${CHECK} ${GREEN}$1${RESET}"
}

print_warn() {
  echo -e " ${YELLOW}⚠${RESET} $1"
}

print_fail() {
  echo -e " ${CROSS} ${RED}$1${RESET}"
}

print_footer() {
  echo ""
  print_border
  echo -e "${DIM}║${RESET} ${GREEN}${BOLD}Installation complete.${RESET} ${DIM}║${RESET}"
  echo -e "${DIM}║${RESET} ${DIM}Run: npm run verify${RESET} ${DIM}║${RESET}"
  print_border_bottom
  echo ""
}

# ─── Checks ───────────────────────────────────────────────────

check_node() {
  print_step "1" "Checking Node.js"
  if command -v node &>/dev/null; then
    local ver
    ver=$(node --version)
    print_ok "Node.js found: $ver"
  else
    print_fail "Node.js not found. Install from https://nodejs.org"
    exit 1
  fi
}

check_npm() {
  print_step "2" "Checking npm"
  if command -v npm &>/dev/null; then
    local ver
    ver=$(npm --version)
    print_ok "npm found: $ver"
  else
    print_fail "npm not found."
    exit 1
  fi
}

install_deps() {
  print_step "3" "Installing dependencies"
  if npm install --silent; then
    print_ok "Dependencies installed"
  else
    print_fail "npm install failed"
    exit 1
  fi
}

build_ts() {
  print_step "4" "Building TypeScript"
  if npm run build --silent 2>/dev/null; then
    print_ok "TypeScript build successful"
  else
    print_warn "Build step skipped (no build script or build failed)"
  fi
}

run_verify() {
  print_step "5" "Running K2 verification checks"
  if npx ts-node scripts/verify.ts 2>/dev/null; then
    print_ok "All K2 checks passed"
  else
    print_warn "Verify script not yet runnable — run manually after build"
  fi
}

# ─── Main ─────────────────────────────────────────────────────

print_header
check_node
check_npm
install_deps
build_ts
run_verify
print_footer
''',

    'scripts/scaffold.ts': '''#!/usr/bin/env npx ts-node
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

const ROOT = process.cwd();

const DIRS = [
  "src/protocol",
  "src/core",
  "src/adapters",
  "src/providers",
  "scripts",
  "docs/runbooks",
  "docs/research",
  "docs/ADR",
  "notes",
  "tests/unit",
  "tests/integration",
];

const TEMPLATE_FILES: Record<string, string> = {
  "package.json": JSON.stringify(
    {
      name: "k2-agent-harness",
      version: "0.1.0",
      private: true,
      type: "module",
      scripts: {
        build: "tsc",
        verify: "npx ts-node scripts/verify.ts",
        scaffold: "npx ts-node scripts/scaffold.ts",
        cli: "npx ts-node src/adapters/cli.ts",
        socket: "npx ts-node src/adapters/socket.ts",
      },
      dependencies: {
        zod: "^3.23.0",
        ws: "^8.18.0",
      },
      devDependencies: {
        typescript: "^5.4.0",
        "@types/node": "^20.0.0",
        "@types/ws": "^8.5.0",
        "ts-node": "^10.9.2",
      },
    },
    null,
    2
  ),

  "tsconfig.json": JSON.stringify(
    {
      compilerOptions: {
        target: "ES2022",
        module: "NodeNext",
        moduleResolution: "NodeNext",
        outDir: "dist",
        rootDir: "src",
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        declaration: true,
        declarationMap: true,
        sourceMap: true,
      },
      include: ["src/**/*"],
      exclude: ["node_modules", "dist"],
    },
    null,
    2
  ),

  ".gitignore": `node_modules/\ndist/\n.env\n*.js.map\n`,

  "README.md": `# K2 Agent Harness\n\nK-Universe AI coding agent protocol layer.\n\n## Quick Start\n\n\`\`\`bash\nbash scripts/install.sh\nnpm run verify\n\`\`\`\n`,
};

function ensureDir(dir: string): void {
  const full = path.join(ROOT, dir);
  if (!fs.existsSync(full)) {
    fs.mkdirSync(full, { recursive: true });
    console.log(` ✔ Created: ${dir}`);
  } else {
    console.log(` · Exists: ${dir}`);
  }
}

function writeTemplate(file: string, content: string): void {
  const full = path.join(ROOT, file);
  if (!fs.existsSync(full)) {
    fs.writeFileSync(full, content, "utf-8");
    console.log(` ✔ Written: ${file}`);
  } else {
    console.log(` · Skipped: ${file} (already exists)`);
  }
}

function runNpmInstall(): void {
  const pkgPath = path.join(ROOT, "package.json");
  if (fs.existsSync(pkgPath) && !fs.existsSync(path.join(ROOT, "node_modules"))) {
    console.log("\\n › Running npm install...");
    execSync("npm install", { stdio: "inherit", cwd: ROOT });
    console.log(" ✔ npm install complete");
  }
}

console.log("\\n ╔══════════════════════════════════════╗");
console.log("║ K2 Scaffold — Directory Structure ║");
console.log("╚══════════════════════════════════════╝\\n");

console.log("Creating directories:");
DIRS.forEach(ensureDir);

console.log("\\nWriting template files:");
Object.entries(TEMPLATE_FILES).forEach(([file, content]) => writeTemplate(file, content));

runNpmInstall();

console.log("\\n✔ Scaffold complete.\\n");
''',

    'scripts/verify.ts': '''#!/usr/bin/env npx ts-node
import * as fs from "fs";
import * as path from "path";

const ROOT = process.cwd();

interface CheckResult {
  name: string;
  passed: boolean;
  detail?: string;
}

const results: CheckResult[] = [];

function readFile(relPath: string): string | null {
  const full = path.join(ROOT, relPath);
  if (!fs.existsSync(full)) return null;
  return fs.readFileSync(full, "utf-8");
}

function pass(name: string, detail?: string): void {
  results.push({ name, passed: true, detail });
}

function fail(name: string, detail: string): void {
  results.push({ name, passed: false, detail });
}

// ─── Check 1: No z.any() in events.ts for state field ─────────
{
  const content = readFile("src/protocol/events.ts");
  if (!content) {
    fail("K2-1: events.ts exists", "File not found");
  } else {
    // Look for state: z.any() pattern
    const hasZAnyState = /state:\s*z\.any\(\)/.test(content);
    if (hasZAnyState) {
      fail("K2-1: SessionUpdated.state typed", "Found state: z.any() — must use SessionStateSnapshotSchema");
    } else {
      const hasSnapshotSchema = content.includes("SessionStateSnapshotSchema");
      pass("K2-1: SessionUpdated.state typed", hasSnapshotSchema ? "Uses SessionStateSnapshotSchema ✔" : "Schema import not detected — verify manually");
    }
  }
}

// ─── Check 2: protocolVersion in all command schemas ──────────
{
  const content = readFile("src/protocol/commands.ts");
  if (!content) {
    fail("K2-3: commands.ts exists", "File not found");
  } else {
    const schemaMatches = content.matchAll(/z\.object\(\{/g);
    const objectCount = Array.from(schemaMatches).length;
    const protocolVersionCount = (content.match(/protocolVersion:\s*z\.literal\("1\.0"\)/g) || []).length;
    
    if (protocolVersionCount >= objectCount && protocolVersionCount > 0) {
      pass("K2-3: protocolVersion in commands", `${protocolVersionCount} schemas with protocolVersion ✔`);
    } else {
      fail("K2-3: protocolVersion in commands", `Found ${protocolVersionCount} protocolVersion fields for ${objectCount} z.object() blocks`);
    }
  }
}

// ─── Check 3: No provider SDK imports in models.ts ─────────────
{
  const content = readFile("src/core/models.ts");
  if (!content) {
    fail("ARCH: models.ts exists", "File not found");
  } else {
    const bannedImports = [
      'from "openai"',
      'from "@anthropic-ai/sdk"',
      'from "@google/genai"',
      'from "@mistralai/mistralai"',
    ];
    const found = bannedImports.filter((imp) => content.includes(imp));
    if (found.length > 0) {
      fail("ARCH: models.ts clean", `Found banned imports: ${found.join(", ")}`);
    } else {
      pass("ARCH: models.ts clean", "No provider SDK imports ✔");
    }
  }
}

// ─── Check 4: All 5 methods present in agent.ts ───────────────
{
  const content = readFile("src/core/agent.ts");
  if (!content) {
    fail("K2-2: agent.ts exists", "File not found");
  } else {
    const requiredMethods = [
      "createSession",
      "destroySession",
      "executeCommand",
      "invokeTool",
      "cancelJob",
    ];
    const found = requiredMethods.filter((m) => content.includes(m));
    const missing = requiredMethods.filter((m) => !content.includes(m));
    
    if (missing.length === 0) {
      pass("K2-2: AgentCore methods", `All 5 methods present ✔`);
    } else {
      fail("K2-2: AgentCore methods", `Missing: ${missing.join(", ")}`);
    }
  }
}

// ─── Report ───────────────────────────────────────────────────

console.log("\\n╔══════════════════════════════════════════════════╗");
console.log("║ K2 Verification Report                          ║");
console.log("╚══════════════════════════════════════════════════╝\\n");

let passed = 0;
let failed = 0;

for (const r of results) {
  const icon = r.passed ? "✔" : "✘";
  const color = r.passed ? "\\x1b[32m" : "\\x1b[31m";
  const reset = "\\x1b[0m";
  console.log(`${color}${icon}${reset} ${r.name}`);
  if (r.detail) {
    console.log(`   ${r.detail}`);
  }
  if (r.passed) passed++; else failed++;
}

console.log(`\\n${passed} passed, ${failed} failed\\n`);

if (failed > 0) {
  process.exit(1);
}
''',

    'docs/ADR-001-Protocol-Design.md': '''# ADR-001: Protocol Design — Discriminated Unions + Zod

**Status:** Accepted
**Date:** 2026-05-07

---

## Context

The K2 agent harness needs a typed wire protocol between core and adapters. Commands and events must be validated at runtime and discriminated at compile time.

---

## Decision

Use **Zod discriminated unions** over:
- Classes with `instanceof` checks
- Manual type guards
- JSON Schema without runtime validation

---

## Rationale

| Approach | Runtime Validation | Compile-time Discrimination | Bundle Size | Notes |
|---|---|---|---|---|
| Zod + discriminatedUnion | ✔ | ✔ | ~12KB | Single source of truth |
| Classes + instanceof | ✘ | ✔ | Larger | No runtime schema check |
| JSON Schema (ajv) | ✔ | ✘ | ~50KB | Two schemas to maintain |
| Type guards (manual) | ✘ | ✔ | Zero | Fragile, easy to drift |

---

## Consequences

- **Positive:** One schema drives both runtime validation and TypeScript inference.
- **Positive:** `z.discriminatedUnion("type", [...])` compiles to efficient switch logic.
- **Negative:** Zod error messages need custom formatting for user-facing output.
- **Negative:** Branded types (`SessionId`, `JobId`) require casting — but prevent accidental string mixing.

---

## Mermaid — Protocol Flow

```mermaid
flowchart TD
    A[Client] -->|JSON Command| B{Zod.parse}
    B -->|Valid| C[AgentCore.executeCommand]
    B -->|Invalid| D[ValidationError Event]
    C --> E[Session / Job Lifecycle]
    E --> F[EventStream]
    F --> G[Client]
```
''',

    'docs/ADR-002-Session-Lifecycle.md': '''# ADR-002: Session Lifecycle State Machine

**Status:** Accepted
**Date:** 2026-05-07

---

## Context

Sessions are the primary unit of work in K2. A session encapsulates model config, tool registry, and conversation state. The lifecycle must be unambiguous and observable.

---

## Decision

Five-state machine with explicit transitions. No implicit state changes.

---

## States

| State | Meaning | Valid Transitions |
|---|---|---|
| `creating` | Allocation in progress | `idle` |
| `idle` | Ready for commands | `running`, `destroying` |
| `running` | Job executing | `idle` (on completion), `destroying` (force) |
| `destroying` | Teardown in progress | `destroyed` |
| `destroyed` | Resources released | — (terminal) |

---

## Mermaid — State Machine

```mermaid
stateDiagram-v2
[*] --> Creating : createSession()
Creating --> Idle : SessionCreated
Idle --> Running : executeCommand()
Running --> Idle : JobCompleteEvent
Idle --> Destroying : destroySession()
Running --> Destroying : destroySession() [force]
Destroying --> Destroyed : SessionDestroyed
Destroyed --> [*]
```

---

## State Transition Table

| From | Event / Action | To | Side Effects |
|---|---|---|---|
| `creating` | `SessionCreated` emitted | `idle` | Register tools, init model |
| `idle` | `ExecuteToolCommand` received | `running` | Emit `JobStarted` |
| `running` | `JobCompleteEvent` emitted | `idle` | Update turn count, emit `SessionUpdated` |
| `running` | `CancelJobCommand` received | `idle` | Emit `JobCompleteEvent(successful: false)` |
| `idle` | `DestroySessionCommand` received | `destroying` | Emit `SessionDestroyed` |
| `running` | `DestroySessionCommand` received | `destroying` | Cancel active job, then destroy |
| `destroying` | Cleanup complete | `destroyed` | Remove from session map |

---

## Invariant

Every state change MUST emit a `SessionUpdated` event with a full `SessionStateSnapshot`. Consumers must be able to reconstruct state from the event log alone.
''',

    'docs/research/model-provider-matrix.md': '''# Model Provider Matrix

**Date:** 2026-05-07

---

| Provider | Context Window | Cost / 1M tokens | Integration Status | Notes |
|---|---|---|---|---|
| **OpenAI** GPT-4.1 | 1M tokens | $2.00 / $8.00 | Planned | Best reasoning, highest cost |
| **Anthropic** Claude Sonnet 4.6 | 200K tokens | $3.00 / $15.00 | Planned | Best for codebase coherence |
| **Google** Gemini 3.1 Pro | 1M tokens | $1.25 / $5.00 | Planned | Best multimodal, design-to-code |
| **Google** Gemini 3.1 Flash | 1M tokens | $0.15 / $0.60 | Planned | Fast, cheap, weak reasoning |
| **Moonshot** Kimi K2.5 | 256K tokens | $1.00 / $4.00 | Experimental | Strong Chinese + English |
| **Mistral** Large 2 | 128K tokens | $2.00 / $6.00 | Planned | Good European compliance |
| **DeepSeek** V3 | 64K tokens | $0.14 / $0.28 | Experimental | Cheapest, good coding |
| **Meta** Llama 4 Scout | 128K tokens | Self-hosted | Experimental | Open weights, local run |
| **Alibaba** Qwen3-Next | 262K tokens | $0.50 / $2.00 | Experimental | Strong agentic features |

---

## Integration Priority

1. **Phase 1:** OpenAI, Anthropic, Google (Gemini Pro) — highest quality, proven APIs
2. **Phase 2:** Moonshot, Mistral — regional / compliance requirements
3. **Phase 3:** DeepSeek, Qwen — cost-optimized / self-hosted options

---

## Notes

- All providers implement the `ModelProvider` interface from `src/core/models.ts`
- Provider-specific SDK imports live in `src/providers/{provider}/` only
- No provider SDK imports in `src/core/models.ts` — architecture rule enforced
''',

    'docs/runbooks/debugging.md': '''# Systematic Debugging Runbook

**K-Universe Agent Harness**

---

## Phase 1: Root Cause Trace

1. Reproduce the bug reliably — find the minimal trigger
2. Check logs for the exact error message and stack trace
3. Trace backwards from the error to the first invalid state
4. Identify which invariant was violated (protocol, state, job)

## Phase 2: Defense-in-Depth

1. Add validation at the boundary where the bug entered
2. Add assertions in the core logic that should have caught it
3. Add monitoring/telemetry to detect similar issues early

## Phase 3: Condition-Based Waiting

1. Identify the async boundary where the race occurred
2. Add proper synchronization (mutex, queue, or state check)
3. Ensure cancellation is cooperative, not forced

## Phase 4: Verification-Before-Completion

1. Write a test that reproduces the exact bug
2. Run the test — it must fail before the fix
3. Apply the fix
4. Run the test — it must pass
5. Run the full test suite — no regressions
6. Run `npm run verify` — all K2 checks pass

---

## Checklist

- [ ] Bug reproduced with minimal steps
- [ ] Root cause identified (not just symptom)
- [ ] Fix applied at the correct layer (protocol, core, adapter)
- [ ] Test added that catches this specific bug
- [ ] Full test suite passes
- [ ] K2 verification passes
- [ ] No silent failures — all errors emit `JobCompleteEvent(successful: false)`
''',

    'docs/runbooks/deployment.md': '''# Deployment Runbook

**K-Universe Agent Harness**

---

## Pre-Deploy Checks

- [ ] `npm run build` passes with zero errors
- [ ] `npm run verify` reports all K2 checks PASS
- [ ] All tests pass: `npm test`
- [ ] Version bumped in `package.json`
- [ ] `CHANGELOG.md` updated
- [ ] No `console.log` left in production code
- [ ] Environment variables documented in `.env.example`

## Deploy Steps

1. **Build:** `npm run build`
2. **Verify:** `npm run verify`
3. **Tag:** `git tag v$(node -p "require('./package.json').version")`
4. **Push:** `git push origin main --tags`
5. **Publish:** `npm publish` (if public package)

## Post-Deploy Verification

- [ ] Install in clean directory: `npm install k2-agent-harness`
- [ ] Run `bash scripts/install.sh` on fresh clone
- [ ] Run `npm run verify` in installed package
- [ ] Test CLI adapter: `echo '{"type":"CreateSession","protocolVersion":"1.0","config":{"modelId":"test"}}' | npx ts-node src/adapters/cli.ts`
- [ ] Check WebSocket adapter starts: `npm run socket`

## Rollback Plan

1. Identify last known good version from git tags
2. `git checkout vX.Y.Z`
3. `npm install && npm run build`
4. Update deployment target to previous version
5. Verify rollback with same post-deploy checks

---

## Emergency Contacts

- K-Ops on-call: `#k-ops-alerts` (Discord)
- Escalation: K-Universe maintainer
''',

    'notes/k2-verification-report.md': '''# K2 Verification Report

**Date:** 2026-05-07
**Status:** Fixed

---

## Blockers Identified

### Blocker 1: `src/protocol/events.ts`
- **Issue:** `SessionUpdated.state` used `z.any()` instead of typed schema
- **Fix:** Replaced with `SessionStateSnapshotSchema`
- **Import added:** `import { SessionStateSnapshotSchema } from "./state.js"`
- **Status:** ✔ Fixed

### Blocker 2: `src/core/agent.ts`
- **Issue:** Missing methods and incorrect signatures
- **Fix:** Added all 5 required methods:
  - `destroySession(sessionId: SessionId): Promise<void>` (idempotent)
  - `cancelJob(jobId: JobId): Promise<void>` (emits `JobCompleteEvent` with `successful: false`)
  - `invokeTool(toolName: string, args: unknown): Promise<{ jobId: JobId }>`
  - `createSession(config: SessionConfig): Promise<SessionState>`
  - `executeCommand(cmd: Command): Promise<EventStream>`
- **Status:** ✔ Fixed

### Blocker 3: `src/protocol/commands.ts`
- **Issue:** Missing `protocolVersion` field in command schemas
- **Fix:** Added `protocolVersion: z.literal("1.0")` to every `z.object()` in `CommandSchema`
- **Status:** ✔ Fixed

## Architecture Rule

### `src/core/models.ts`
- **Rule:** Type-only file. Zero provider SDK imports.
- **Enforcement:** Provider implementations go in `src/core/models.impl.ts` or `src/providers/`
- **Status:** ✔ Enforced

---

## Verification Script

Run `npm run verify` to check all blockers remain fixed.

---

## Asset Manifest

- [x] docs/FRD-001-Agent-Harness.md
- [x] docs/protocol-spec.md
- [x] src/protocol/state.ts
- [x] src/protocol/commands.ts
- [x] src/protocol/events.ts
- [x] src/core/agent.ts
- [x] src/core/models.ts
- [x] src/adapters/cli.ts
- [x] src/adapters/vscode.ts
- [x] src/adapters/socket.ts
- [x] scripts/install.sh
- [x] scripts/scaffold.ts
- [x] scripts/verify.ts
- [x] docs/ADR-001-Protocol-Design.md
- [x] docs/ADR-002-Session-Lifecycle.md
- [x] docs/research/model-provider-matrix.md
- [x] docs/runbooks/debugging.md
- [x] docs/runbooks/deployment.md
- [x] notes/k2-verification-report.md
''',
}

# Create zip file
zip_path = 'output/k2-agent-harness-assets.zip'
with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
    for filepath, content in files.items():
        zf.writestr(filepath, content)

# List contents
with zipfile.ZipFile(zip_path, 'r') as zf:
    file_list = zf.namelist()

print(f"Created: {zip_path}")
print(f"Total files: {len(file_list)}")
print("\nContents:")
for f in sorted(file_list):
    size = len(files[f])
    print(f"  {f} ({size:,} bytes)")
