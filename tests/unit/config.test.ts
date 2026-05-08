import { describe, it, expect } from "vitest";
import { loadConfig, saveConfig, defaultConfig } from "../../src/config.js";

describe("config", () => {
  it("returns default config when nothing is saved", () => {
    const cfg = defaultConfig();
    expect(cfg.defaultModel).toBe("claude-sonnet-4-6");
    expect(cfg.providers.anthropic).toBeUndefined();
  });

  it("validates model string is non-empty", () => {
    const cfg = defaultConfig();
    cfg.defaultModel = "";
    expect(() => saveConfig(cfg)).toThrow();
  });
});
