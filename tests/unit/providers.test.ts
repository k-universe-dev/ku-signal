import { describe, it, expect } from "vitest";
import { createAnthropicProvider } from "../../src/providers/anthropic/index.js";
import { createOpenAIProvider } from "../../src/providers/openai/index.js";
import { createOpenAICompatProvider } from "../../src/providers/openai-compat/index.js";

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

describe("OpenAICompatProvider", () => {
  it("uses the given name and models", () => {
    const provider = createOpenAICompatProvider({
      name: "groq",
      baseUrl: "https://api.groq.com/openai/v1",
      apiKey: "sk-test",
      models: ["llama-3-70b-8192", "mixtral-8x7b-32768"],
    });
    expect(provider.name).toBe("groq");
    expect(provider.supportedModels).toContain("llama-3-70b-8192");
  });

  it("works with no API key (Ollama local)", () => {
    const provider = createOpenAICompatProvider({
      name: "ollama",
      baseUrl: "http://localhost:11434/v1",
      apiKey: "",
      models: ["llama3"],
    });
    expect(provider.name).toBe("ollama");
    expect(typeof provider.complete).toBe("function");
  });

  it("accepts an oauthToken in place of apiKey", () => {
    const provider = createOpenAICompatProvider({
      name: "gemini",
      baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
      oauthToken: "ya29.token",
      models: ["gemini-1.5-pro"],
    });
    expect(provider.name).toBe("gemini");
    expect(typeof provider.complete).toBe("function");
  });
});
