import { describe, it, expect, vi } from "vitest";
import { ProviderRegistry } from "../../src/providers/registry.js";
import type { ModelProvider } from "../../src/core/models.js";

function mockProvider(name: string): ModelProvider {
  return {
    name,
    supportedModels: [`${name}-model`],
    complete: vi.fn().mockResolvedValue({
      id: "test",
      model: `${name}-model`,
      content: "ok",
      finishReason: "stop",
      usage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 },
    }),
  };
}

describe("ProviderRegistry", () => {
  it("resolves a registered provider by name", () => {
    const registry = new ProviderRegistry();
    registry.register("test", () => mockProvider("test"));
    const provider = registry.resolve("test");
    expect(provider.name).toBe("test");
  });

  it("throws on unknown provider name", () => {
    const registry = new ProviderRegistry();
    expect(() => registry.resolve("unknown")).toThrow(/unknown provider/i);
  });

  it("lists all registered provider names", () => {
    const registry = new ProviderRegistry();
    registry.register("a", () => mockProvider("a"));
    registry.register("b", () => mockProvider("b"));
    expect(registry.list()).toContain("a");
    expect(registry.list()).toContain("b");
  });

  it("later registration overrides earlier for the same name", () => {
    const registry = new ProviderRegistry();
    registry.register("p", () => mockProvider("first"));
    registry.register("p", () => mockProvider("second"));
    expect(registry.resolve("p").name).toBe("second");
  });

  it("hasProvider returns true for registered, false for missing", () => {
    const registry = new ProviderRegistry();
    registry.register("exists", () => mockProvider("exists"));
    expect(registry.hasProvider("exists")).toBe(true);
    expect(registry.hasProvider("missing")).toBe(false);
  });
});
