import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, writeFile, rm } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { loadRepoContext, CONTEXT_FILES } from "../../src/context.js";

describe("loadRepoContext", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "byte-ctx-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it("returns null when no context files exist", async () => {
    expect(await loadRepoContext(tempDir)).toBeNull();
  });

  it("loads BYTE.md when present", async () => {
    await writeFile(join(tempDir, "BYTE.md"), "# My Project\nTest content");
    const result = await loadRepoContext(tempDir);
    expect(result).toContain("My Project");
    expect(result).toContain("BYTE.md");
  });

  it("prefers BYTE.md over AGENTS.md", async () => {
    await writeFile(join(tempDir, "BYTE.md"), "from BYTE");
    await writeFile(join(tempDir, "AGENTS.md"), "from AGENTS");
    const result = await loadRepoContext(tempDir);
    expect(result).toContain("from BYTE");
    expect(result).not.toContain("from AGENTS");
  });

  it("falls back to AGENTS.md when no BYTE.md", async () => {
    await writeFile(join(tempDir, "AGENTS.md"), "from AGENTS");
    const result = await loadRepoContext(tempDir);
    expect(result).toContain("from AGENTS");
    expect(result).toContain("AGENTS.md");
  });

  it("falls back to CLAUDE.md last", async () => {
    await writeFile(join(tempDir, "CLAUDE.md"), "from CLAUDE");
    const result = await loadRepoContext(tempDir);
    expect(result).toContain("from CLAUDE");
  });

  it("wraps content with source header", async () => {
    await writeFile(join(tempDir, "BYTE.md"), "content");
    const result = await loadRepoContext(tempDir);
    expect(result).toMatch(/Project Context.*BYTE\.md/);
  });

  it("CONTEXT_FILES exported constant has 3 entries", () => {
    expect(CONTEXT_FILES).toHaveLength(3);
    expect(CONTEXT_FILES[0]).toBe("BYTE.md");
    expect(CONTEXT_FILES[1]).toBe("AGENTS.md");
    expect(CONTEXT_FILES[2]).toBe("CLAUDE.md");
  });
});
