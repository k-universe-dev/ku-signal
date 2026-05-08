import { describe, it, expect } from "vitest";
import { createOpenAIProvider } from "../../src/providers/openai/index.js";

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
