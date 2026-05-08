import { describe, it, expect, vi } from "vitest";
import { createAnthropicProvider } from "../../src/providers/anthropic/index.js";

describe("AnthropicProvider", () => {
  it("exposes name and supportedModels", () => {
    const provider = createAnthropicProvider({ apiKey: "sk-test" });
    expect(provider.name).toBe("anthropic");
    expect(provider.supportedModels).toContain("claude-sonnet-4-6");
    expect(provider.supportedModels).toContain("claude-opus-4-7");
  });

  it("implements ModelProvider interface (has complete function)", () => {
    const provider = createAnthropicProvider({ apiKey: "sk-test" });
    expect(typeof provider.complete).toBe("function");
  });
});
