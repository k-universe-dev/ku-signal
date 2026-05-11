import { describe, it, expect } from "vitest";
import { ByteConfigSchema, defaultConfig } from "../../src/config.js";
import { isAlwaysAllowed, addAlwaysPermission, wrapWithPermission } from "../../src/permissions.js";
import type { ByteTool } from "../../src/tools/index.js";

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

  it("addAlwaysPermission adds entry and deduplicates", () => {
    const cfg = defaultConfig();
    const updated = addAlwaysPermission("bash", cfg);
    expect(updated.permissions).toHaveLength(1);
    expect(updated.permissions[0].tool).toBe("bash");
    expect(cfg.permissions).toHaveLength(0); // original unmodified

    const again = addAlwaysPermission("bash", updated);
    expect(again.permissions).toHaveLength(1);
  });
});

describe("wrapWithPermission", () => {
  const fakeTool = (name: string): ByteTool => ({
    definition: { name, description: name, parameters: { type: "object", properties: {}, required: [] } },
    execute: async () => `${name}-result`,
  });

  it("returns same number of tools", () => {
    const tools = [fakeTool("file_read"), fakeTool("file_write"), fakeTool("bash")];
    const wrapped = wrapWithPermission(tools, async () => "yes", { ...defaultConfig(), permissions: [] });
    expect(wrapped).toHaveLength(3);
  });

  it("non-guarded tools execute without calling requestPermission", async () => {
    let called = false;
    const tools = [fakeTool("file_read")];
    const wrapped = wrapWithPermission(tools, async () => { called = true; return "yes"; }, { ...defaultConfig(), permissions: [] });
    await wrapped[0].execute({});
    expect(called).toBe(false);
  });

  it("guarded tool calls requestPermission before executing", async () => {
    let called = false;
    const tools = [fakeTool("file_write")];
    const wrapped = wrapWithPermission(tools, async () => { called = true; return "yes"; }, { ...defaultConfig(), permissions: [] });
    const result = await wrapped[0].execute({ path: "x.txt", content: "hi" });
    expect(called).toBe(true);
    expect(result).toBe("file_write-result");
  });

  it("guarded tool throws when requestPermission returns 'no'", async () => {
    const tools = [fakeTool("bash")];
    const wrapped = wrapWithPermission(tools, async () => "no", { ...defaultConfig(), permissions: [] });
    await expect(wrapped[0].execute({ command: "rm -rf /" })).rejects.toThrow("Permission denied for bash");
  });

  it("guarded tool executes when requestPermission returns 'always'", async () => {
    const tools = [fakeTool("file_write")];
    const wrapped = wrapWithPermission(tools, async () => "always", { ...defaultConfig(), permissions: [] });
    const result = await wrapped[0].execute({ path: "x.txt", content: "hi" });
    expect(result).toBe("file_write-result");
  });

  it("guarded tool skips requestPermission when tool is always-allowed", async () => {
    let called = false;
    const tools = [fakeTool("file_write")];
    const cfg = { ...defaultConfig(), permissions: [{ tool: "file_write", decision: "always" as const }] };
    const wrapped = wrapWithPermission(tools, async () => { called = true; return "yes"; }, cfg);
    await wrapped[0].execute({ path: "x.txt", content: "hi" });
    expect(called).toBe(false);
  });

  it("re-reads permissions from config source between executions", async () => {
    let calls = 0;
    let cfg = { ...defaultConfig(), permissions: [] as { tool: string; decision: "always" }[] };
    const tools = [fakeTool("file_write")];
    const wrapped = wrapWithPermission(
      tools,
      async () => {
        calls += 1;
        return "yes";
      },
      () => cfg
    );

    await wrapped[0].execute({ path: "x.txt", content: "first" });
    cfg = addAlwaysPermission("file_write", cfg);
    await wrapped[0].execute({ path: "x.txt", content: "second" });

    expect(calls).toBe(1);
  });
});
