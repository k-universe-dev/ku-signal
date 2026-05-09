import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, writeFile, readFile, rm } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { runByteInit, BYTE_MD_TEMPLATE } from "../../src/init.js";

describe("runByteInit", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "byte-init-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it("creates BYTE.md in the target directory", async () => {
    await runByteInit(tempDir);
    const content = await readFile(join(tempDir, "BYTE.md"), "utf8");
    expect(content).toContain("BYTE Instructions");
  });

  it("does not overwrite an existing BYTE.md", async () => {
    const existing = "# My existing content — do not overwrite";
    await writeFile(join(tempDir, "BYTE.md"), existing, "utf8");
    await runByteInit(tempDir);
    const content = await readFile(join(tempDir, "BYTE.md"), "utf8");
    expect(content).toBe(existing);
  });

  it("BYTE_MD_TEMPLATE has all required sections", () => {
    expect(BYTE_MD_TEMPLATE).toContain("## Project Overview");
    expect(BYTE_MD_TEMPLATE).toContain("## Tech Stack");
    expect(BYTE_MD_TEMPLATE).toContain("## Coding Conventions");
    expect(BYTE_MD_TEMPLATE).toContain("## Key Commands");
    expect(BYTE_MD_TEMPLATE).toContain("## Notes for BYTE");
  });

  it("created BYTE.md is loadable by loadRepoContext", async () => {
    await runByteInit(tempDir);
    const { loadRepoContext } = await import("../../src/context.js");
    const ctx = await loadRepoContext(tempDir);
    expect(ctx).not.toBeNull();
    expect(ctx).toContain("BYTE.md");
  });
});
