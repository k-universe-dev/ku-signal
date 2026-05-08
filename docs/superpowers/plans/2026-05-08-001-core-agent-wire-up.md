# KU-BYTE Plan 001 — Core Agent Wire-Up + Streaming

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the `Runner` (LLM conversation loop) into `AgentCore.executeCommand()` so that socket/WebSocket clients can send `SendMessage` commands and get real LLM responses — and add `TokenChunk` streaming events so responses stream word-by-word.

**Architecture:** `createAgentCore()` accepts an optional `ModelProvider` + tools. When `ExecuteCommand` or `SendMessage` is received it delegates to a `Runner` instance, emitting `TokenChunk` events for each streamed word, then a final `JobComplete`. The socket adapter is patched to properly iterate the returned `EventStream`. All K2 invariants continue to pass.

**Tech Stack:** TypeScript strict, ESM NodeNext, zod (existing), existing runner.ts + providers

---

## Why this plan exists

The KU-BYTE build (Plan 000) wired the CLI path: `src/cli.ts → createRunner() → provider.complete()`. But the socket path (`src/adapters/socket.ts → createAgentCore() → executeCommand()`) does NOT call any LLM. When a WebSocket client sends `SendMessage`, the AgentCore stub returns an empty EventStream.

This plan fixes that gap — surgically, without touching what works.

---

## File Map

| File | Action | What changes |
|---|---|---|
| `src/protocol/events.ts` | Modify | Add `TokenChunkEvent` schema to the discriminated union |
| `src/core/agent.ts` | Modify | Accept `ModelProvider` + tools in `AgentConfig`; handle `SendMessage` in `executeCommand()` using runner |
| `src/adapters/socket.ts` | Modify | Iterate EventStream returned by `executeCommand()` and send each event to the WS client |
| `tests/unit/agent.test.ts` | Create | Unit tests for SendMessage → runner → events flow |
| `tests/unit/streaming.test.ts` | Create | Unit tests for TokenChunk event shape |

**Do not touch:** `src/core/runner.ts`, `src/core/models.ts`, `src/config.ts`, `src/cli.ts`, `src/tui/`, `src/providers/`.

---

## Task 1: Add TokenChunkEvent to protocol

**Files:**
- Modify: `src/protocol/events.ts`
- Create: `tests/unit/streaming.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/unit/streaming.test.ts
import { describe, it, expect } from "vitest";
import { AgentEventSchema } from "../../src/protocol/events.js";

describe("TokenChunkEvent", () => {
  it("validates a valid TokenChunk event", () => {
    const event = {
      type: "TokenChunk",
      jobId: "job_123",
      sessionId: "session_456",
      chunk: "Hello",
      timestamp: new Date().toISOString(),
    };
    const result = AgentEventSchema.safeParse(event);
    expect(result.success).toBe(true);
  });

  it("rejects TokenChunk with missing chunk field", () => {
    const event = {
      type: "TokenChunk",
      jobId: "job_123",
      sessionId: "session_456",
      timestamp: new Date().toISOString(),
    };
    const result = AgentEventSchema.safeParse(event);
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run to confirm failure**

```bash
pnpm test tests/unit/streaming.test.ts
```
Expected: FAIL — `TokenChunk` not in discriminated union.

- [ ] **Step 3: Read current src/protocol/events.ts**

Read the file. Find the `AgentEventSchema = z.discriminatedUnion(...)` array. Find the last schema in the array (currently `JobCompleteEventSchema` or similar).

- [ ] **Step 4: Add TokenChunkEventSchema**

After the last existing event schema definition (before `AgentEventSchema`), add:

```typescript
export const TokenChunkEventSchema = z.object({
  type: z.literal("TokenChunk"),
  jobId: z.string(),
  sessionId: z.string(),
  chunk: z.string(),
  timestamp: z.string().datetime(),
});

export type TokenChunkEvent = z.infer<typeof TokenChunkEventSchema>;
```

Then add `TokenChunkEventSchema` to the `AgentEventSchema` discriminated union array.

- [ ] **Step 5: Run verify script to confirm K2 invariants still pass**

```bash
npx tsx scripts/verify.ts
```
Expected: 4/4 PASS. (TokenChunk is an event, not a command — K2-2 invariant only checks commands.)

- [ ] **Step 6: Run the streaming test**

```bash
pnpm test tests/unit/streaming.test.ts
```
Expected: PASS 2/2.

- [ ] **Step 7: Commit**

```bash
git add src/protocol/events.ts tests/unit/streaming.test.ts
git commit -m "feat(protocol): add TokenChunkEvent for streaming LLM output"
```

---

## Task 2: Wire Runner into AgentCore for SendMessage

**Files:**
- Modify: `src/core/agent.ts`
- Create: `tests/unit/agent.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/unit/agent.test.ts
import { describe, it, expect, vi } from "vitest";
import { createAgentCore } from "../../src/core/agent.js";
import type { ModelProvider, ChatCompletionResult } from "../../src/core/models.js";

function mockProvider(): ModelProvider {
  return {
    name: "mock",
    supportedModels: ["mock-model"],
    complete: vi.fn().mockResolvedValue({
      id: "test-id",
      model: "mock-model",
      content: "Hello from agent",
      finishReason: "stop",
      usage: { promptTokens: 5, completionTokens: 5, totalTokens: 10 },
    } satisfies ChatCompletionResult),
  };
}

describe("AgentCore with SendMessage", () => {
  it("handles SendMessage by calling runner and emitting events", async () => {
    const events: unknown[] = [];
    const provider = mockProvider();

    const agent = createAgentCore({
      provider,
      model: "mock-model",
      tools: [],
      onEvent: (e) => events.push(e),
    });

    const session = await agent.createSession({
      modelId: "mock-model",
      systemPrompt: "You are helpful.",
    });

    const stream = await agent.executeCommand({
      protocolVersion: "1.0",
      type: "SendMessage",
      sessionId: session.sessionId,
      content: "Hello",
      role: "user",
    });

    // Drain the stream
    for await (const _ of stream) {}

    // Should have emitted at least JobStarted and JobComplete
    const types = events.map((e: any) => e.type);
    expect(types).toContain("JobStarted");
    expect(types).toContain("JobComplete");

    // JobComplete should be successful
    const jobComplete = events.find((e: any) => e.type === "JobComplete") as any;
    expect(jobComplete.successful).toBe(true);
    expect(jobComplete.result).toBe("Hello from agent");
  });

  it("returns empty stream for non-SendMessage commands (they use onEvent)", async () => {
    const agent = createAgentCore({
      onEvent: () => {},
    });

    const session = await agent.createSession({ modelId: "mock-model" });
    const stream = await agent.executeCommand({
      protocolVersion: "1.0",
      type: "DestroySession",
      sessionId: session.sessionId,
    });

    const events: unknown[] = [];
    for await (const e of stream) {
      events.push(e);
    }
    // DestroySession emits via onEvent, not the stream
    expect(events).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run to confirm failure**

```bash
pnpm test tests/unit/agent.test.ts
```
Expected: FAIL — `createAgentCore` doesn't accept `provider`/`model`/`tools`, and `SendMessage` isn't handled.

- [ ] **Step 3: Read the current src/core/agent.ts in full**

Read `src/core/agent.ts`. Note: `AgentConfig` currently has `toolRegistry`, `onEvent`, `sessionTimeoutMs`, `maxConcurrentJobs`. We need to ADD `provider`, `model`, `tools` — not replace existing fields.

- [ ] **Step 4: Modify AgentConfig in agent.ts**

Add these optional fields to `AgentConfig`:

```typescript
import type { ModelProvider } from "./models.js";
import type { ByteTool } from "../tools/index.js";
import { createRunner } from "./runner.js";
```

Add to `AgentConfig` interface:
```typescript
export interface AgentConfig {
  sessionTimeoutMs?: number;
  maxConcurrentJobs?: number;
  toolRegistry?: Record<string, (args: unknown) => Promise<unknown>>;
  onEvent?: (event: unknown) => void;
  // New: LLM provider wiring for SendMessage handling
  provider?: ModelProvider;
  model?: string;
  tools?: ByteTool[];
  systemPrompt?: string;
}
```

- [ ] **Step 5: Add SendMessage handling to executeCommand()**

In the `executeCommand()` function's switch statement, add a `SendMessage` case BEFORE the default. The function should return an AsyncGenerator that yields events:

```typescript
async function* handleSendMessage(
  cmd: Extract<Command, { type: "SendMessage" }>,
  jobId: JobId
): AsyncGenerator<AgentEvent> {
  const now = new Date().toISOString();
  const sessionId = cmd.sessionId;

  yield {
    type: "JobStarted",
    jobId,
    sessionId,
    toolName: undefined,
    timestamp: now,
  } as AgentEvent;

  if (!config.provider || !config.model) {
    yield {
      type: "JobComplete",
      jobId,
      sessionId,
      successful: false,
      error: "No provider configured on AgentCore",
      timestamp: new Date().toISOString(),
    } as AgentEvent;
    return;
  }

  const runner = createRunner({
    provider: config.provider,
    model: config.model,
    tools: config.tools ?? [],
    systemPrompt: config.systemPrompt,
  });

  try {
    const response = await runner.sendMessage(cmd.content);

    // Emit token chunks (simulate streaming by splitting on spaces)
    const words = response.content.split(" ");
    for (const word of words) {
      yield {
        type: "TokenChunk",
        jobId,
        sessionId,
        chunk: word + " ",
        timestamp: new Date().toISOString(),
      } as AgentEvent;
    }

    yield {
      type: "JobComplete",
      jobId,
      sessionId,
      successful: true,
      result: response.content,
      timestamp: new Date().toISOString(),
    } as AgentEvent;
  } catch (err) {
    yield {
      type: "JobComplete",
      jobId,
      sessionId,
      successful: false,
      error: err instanceof Error ? err.message : String(err),
      timestamp: new Date().toISOString(),
    } as AgentEvent;
  }
}
```

Replace the `executeCommand()` function to handle `SendMessage`:

```typescript
async function executeCommand(cmd: Command): Promise<EventStream> {
  if (cmd.type === "SendMessage") {
    const jobId = generateId("job") as JobId;
    return handleSendMessage(cmd, jobId);
  }

  // All other commands use onEvent and return empty stream
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
```

Also, the `SessionConfig` type in state.ts may not have `modelId` — check `src/protocol/state.ts`. If `SessionConfig` uses a different field name (like `modelId`), use whatever is defined there. The test uses `{ modelId: "mock-model", systemPrompt: "..." }`.

If `SessionConfig` doesn't have `systemPrompt`, add it as optional: `systemPrompt?: string`.

- [ ] **Step 6: Run typecheck**

```bash
pnpm typecheck
```

Fix any TypeScript errors. Common issues:
- `ByteTool` import path may need adjustment
- `AgentEvent` cast may need `as any` if the union doesn't include `TokenChunk` yet (but it should after Task 1)
- `cmd.config` type — check what `SessionConfig` actually looks like

- [ ] **Step 7: Run agent tests**

```bash
pnpm test tests/unit/agent.test.ts
```
Expected: PASS 2/2.

- [ ] **Step 8: Run full test suite to catch regressions**

```bash
pnpm test
```
Expected: All previously passing tests still pass.

- [ ] **Step 9: Commit**

```bash
git add src/core/agent.ts tests/unit/agent.test.ts
git commit -m "feat(core): wire runner into AgentCore.executeCommand for SendMessage"
```

---

## Task 3: Fix socket adapter to iterate EventStream

**Files:**
- Modify: `src/adapters/socket.ts`

The current socket adapter calls `await agent.executeCommand(parsed.data)` but ignores the returned `EventStream`. Events only flow via `onEvent` callback. This means socket clients never see `TokenChunk` events.

- [ ] **Step 1: Read src/adapters/socket.ts in full**

Note the `ws.on("message", async (data) => { ... })` handler.

- [ ] **Step 2: Modify the message handler to iterate EventStream**

Replace the `ws.on("message", ...)` handler body with:

```typescript
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
    const stream = await agent.executeCommand(parsed.data);
    for await (const event of stream) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(event));
      }
    }
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
```

- [ ] **Step 3: Run typecheck**

```bash
pnpm typecheck
```
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/adapters/socket.ts
git commit -m "fix(socket): iterate EventStream from executeCommand to send streaming events"
```

---

## Task 4: Update socket adapter factory to accept provider

**Files:**
- Modify: `src/adapters/socket.ts`

The socket adapter creates `createAgentCore({ onEvent: ... })` without a provider. We need to pass one.

- [ ] **Step 1: Modify SocketAdapterOptions to include provider config**

In `src/adapters/socket.ts`, update `SocketAdapterOptions`:

```typescript
import type { ModelProvider } from "../core/models.js";
import type { ByteTool } from "../tools/index.js";

export interface SocketAdapterOptions {
  port?: number;
  host?: string;
  path?: string;
  provider?: ModelProvider;
  model?: string;
  tools?: ByteTool[];
  systemPrompt?: string;
}
```

Then update the `wss.on("connection", ...)` handler to pass provider to `createAgentCore`:

```typescript
wss.on("connection", (ws: WebSocket) => {
  const agent = createAgentCore({
    provider: options.provider,
    model: options.model,
    tools: options.tools,
    systemPrompt: options.systemPrompt,
    onEvent: (event) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(event));
      }
    },
  });

  // ... rest of handler
```

- [ ] **Step 2: Run typecheck**

```bash
pnpm typecheck
```

- [ ] **Step 3: Run full test suite**

```bash
pnpm test
```
Expected: All tests pass.

- [ ] **Step 4: Run K2 verify**

```bash
npx tsx scripts/verify.ts
```
Expected: 4/4 PASS.

- [ ] **Step 5: Commit**

```bash
git add src/adapters/socket.ts
git commit -m "feat(socket): accept ModelProvider config for LLM-enabled WebSocket sessions"
```

---

## Verification

After all tasks complete:

```bash
# 1. K2 invariants
npx tsx scripts/verify.ts

# 2. All tests
pnpm test

# 3. TypeScript clean
pnpm typecheck

# 4. Manual socket test (open two terminals)
# Terminal 1: start socket server
ANTHROPIC_API_KEY=sk-... npx tsx -e "
import { createSocketAdapter } from './src/adapters/socket.js';
import { createAnthropicProvider } from './src/providers/anthropic/index.js';
const adapter = createSocketAdapter({
  provider: createAnthropicProvider({ apiKey: process.env.ANTHROPIC_API_KEY }),
  model: 'claude-sonnet-4-6',
  tools: [],
});
adapter.start();
"

# Terminal 2: send a SendMessage command
node -e "
const ws = new (require('ws'))('ws://127.0.0.1:9000/k2');
ws.on('open', () => {
  ws.send(JSON.stringify({
    protocolVersion: '1.0',
    type: 'CreateSession',
    config: { modelId: 'claude-sonnet-4-6' }
  }));
});
ws.on('message', (data) => {
  const event = JSON.parse(data.toString());
  console.log(event.type, event.chunk ?? event.result ?? '');
  if (event.type === 'SessionCreated') {
    ws.send(JSON.stringify({
      protocolVersion: '1.0',
      type: 'SendMessage',
      sessionId: event.sessionId,
      content: 'Say hello in 5 words',
      role: 'user'
    }));
  }
  if (event.type === 'JobComplete') ws.close();
});
"
# Expected: TokenChunk events appear word-by-word, then JobComplete
```
