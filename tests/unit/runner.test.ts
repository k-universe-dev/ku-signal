import { describe, it, expect, vi } from "vitest";
import { createRunner } from "../../src/core/runner.js";
import type { ModelProvider, ChatCompletionResult } from "../../src/core/models.js";

function mockProvider(overrides: Partial<ChatCompletionResult> = {}): ModelProvider {
  return {
    name: "mock",
    supportedModels: ["mock-model"],
    complete: vi.fn().mockResolvedValue({
      id: "test-id",
      model: "mock-model",
      content: "Hello from mock",
      finishReason: "stop",
      usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
      ...overrides,
    }),
  };
}

describe("runner", () => {
  it("sends a message and returns assistant response", async () => {
    const provider = mockProvider();
    const runner = createRunner({ provider, model: "mock-model", tools: [] });
    const result = await runner.sendMessage("Hello");
    expect(result.content).toBe("Hello from mock");
    expect(result.role).toBe("assistant");
  });

  it("maintains conversation history across messages", async () => {
    const provider = mockProvider();
    const runner = createRunner({ provider, model: "mock-model", tools: [] });
    await runner.sendMessage("First message");
    await runner.sendMessage("Second message");
    expect(provider.complete).toHaveBeenCalledTimes(2);
    const secondCall = (provider.complete as ReturnType<typeof vi.fn>).mock.calls[1][0];
    expect(secondCall.messages.length).toBeGreaterThan(2);
  });

  it("calls tools when LLM requests them", async () => {
    const toolFn = vi.fn().mockResolvedValue("tool result");
    const provider = mockProvider();
    (provider.complete as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        id: "1",
        model: "mock",
        content: "",
        finishReason: "tool_calls",
        toolCalls: [{ id: "tc1", name: "test_tool", arguments: { x: 1 } }],
        usage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 },
      })
      .mockResolvedValueOnce({
        id: "2",
        model: "mock",
        content: "Done",
        finishReason: "stop",
        usage: { promptTokens: 2, completionTokens: 2, totalTokens: 4 },
      });

    const runner = createRunner({
      provider,
      model: "mock-model",
      tools: [{ name: "test_tool", execute: toolFn }],
    });
    const result = await runner.sendMessage("Use the tool");
    expect(toolFn).toHaveBeenCalledWith({ x: 1 });
    expect(result.content).toBe("Done");
  });

  it("getHistory returns only user and assistant messages", async () => {
    const provider = mockProvider();
    const runner = createRunner({ provider, model: "mock-model", tools: [] });
    await runner.sendMessage("Hello");
    const history = runner.getHistory();
    expect(history.every((m) => m.role === "user" || m.role === "assistant")).toBe(true);
  });

  it("clearHistory resets conversation", async () => {
    const provider = mockProvider();
    const runner = createRunner({ provider, model: "mock-model", tools: [] });
    await runner.sendMessage("Hello");
    runner.clearHistory();
    expect(runner.getHistory()).toHaveLength(0);
  });
});
