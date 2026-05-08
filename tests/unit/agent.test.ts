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
  it("handles SendMessage by calling runner and emitting events via stream", async () => {
    const events: unknown[] = [];
    const provider = mockProvider();

    const agent = createAgentCore({
      provider,
      model: "mock-model",
      tools: [],
      onEvent: (e) => events.push(e),
    });

    // SessionConfig has modelId — no cast needed
    const session = await agent.createSession({
      modelId: "mock-model",
    });

    const stream = await agent.executeCommand({
      protocolVersion: "1.0",
      type: "SendMessage",
      sessionId: session.sessionId,
      content: "Hello",
      role: "user",
    });

    // Drain the stream to completion
    const streamEvents: unknown[] = [];
    for await (const e of stream) {
      streamEvents.push(e);
    }

    // The stream should contain at least JobStarted and JobComplete
    const streamTypes = streamEvents.map((e: any) => e.type);
    expect(streamTypes).toContain("JobStarted");
    expect(streamTypes).toContain("JobComplete");

    // JobComplete should be successful
    const jobComplete = streamEvents.find((e: any) => e.type === "JobComplete") as any;
    expect(jobComplete.successful).toBe(true);
    expect(jobComplete.result).toBe("Hello from agent");
  });

  it("returns empty stream for non-SendMessage commands", async () => {
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
    expect(events).toHaveLength(0);
  });
});
