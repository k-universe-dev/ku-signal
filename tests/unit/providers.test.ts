import { describe, it, expect } from "vitest";
import { createAnthropicProvider } from "../../src/providers/anthropic/index.js";
import { createOpenAIProvider } from "../../src/providers/openai/index.js";

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

describe("OpenAIProvider", () => {
  it("exposes name and supportedModels", () => {
    const provider = createOpenAIProvider({ apiKey: "sk-test" });
    expect(provider.name).toBe("openai");
    expect(provider.supportedModels).toContain("gpt-4o");
  });

  it("accepts custom baseUrl for LM Studio", () => {
    const provider = createOpenAIProvider({
      apiKey: "lm-studio",
      baseUrl: "http://localhost:19735/v1",
    });
    expect(provider.name).toBe("openai");
  });
});
