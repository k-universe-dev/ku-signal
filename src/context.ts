import { readFile, access } from "fs/promises";
import { join } from "path";

export const CONTEXT_FILES = ["BYTE.md", "AGENTS.md", "CLAUDE.md"] as const;

export async function loadRepoContext(
  cwd = process.cwd()
): Promise<string | null> {
  for (const filename of CONTEXT_FILES) {
    const fullPath = join(cwd, filename);
    try {
      await access(fullPath);
      const content = await readFile(fullPath, "utf8");
      return `# Project Context (from ${filename})\n\n${content}`;
    } catch {
      continue;
    }
  }
  return null;
}
