import { describe, it, expect } from "vitest";
import { ByteConfigSchema, defaultConfig } from "../../src/config.js";
import { isAlwaysAllowed, saveAlwaysPermission } from "../../src/permissions.js";

describe("permission config", () => {
  it("ByteConfigSchema accepts permissions array", () => {
    const cfg = ByteConfigSchema.parse({
      ...defaultConfig(),
      permissions: [{ tool: "file_write", decision: "always" }],
    });
    expect(cfg.permissions).toHaveLength(1);
    expect(cfg.permissions[0].tool).toBe("file_write");
  });

  it("ByteConfigSchema defaults permissions to empty array", () => {
    const cfg = ByteConfigSchema.parse(defaultConfig());
    expect(cfg.permissions).toEqual([]);
  });

  it("isAlwaysAllowed returns false when no permission saved", () => {
    const cfg = { ...defaultConfig(), permissions: [] };
    expect(isAlwaysAllowed("file_write", cfg)).toBe(false);
  });

  it("isAlwaysAllowed returns true when tool has always entry", () => {
    const cfg = {
      ...defaultConfig(),
      permissions: [{ tool: "file_write", decision: "always" as const }],
    };
    expect(isAlwaysAllowed("file_write", cfg)).toBe(true);
  });

  it("saveAlwaysPermission adds entry and deduplicates", () => {
    const cfg = defaultConfig();
    const updated = saveAlwaysPermission("bash", cfg);
    expect(updated.permissions).toHaveLength(1);
    expect(updated.permissions[0].tool).toBe("bash");

    const again = saveAlwaysPermission("bash", updated);
    expect(again.permissions).toHaveLength(1);
  });
});
