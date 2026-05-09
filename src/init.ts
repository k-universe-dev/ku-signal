import { writeFile, access } from "fs/promises";
import { join } from "path";

export const BYTE_MD_TEMPLATE = `# BYTE Instructions

This file provides context and instructions for the BYTE AI coding agent in this project.
BYTE reads this file automatically when you run it from this directory.

## Project Overview

[Describe your project: what it does, who it's for, the core problem it solves]

## Tech Stack

[List your tech stack: languages, frameworks, tools, databases, cloud services]

## Coding Conventions

[List conventions: naming style, file organization, patterns to prefer or avoid]

## Key Commands

\`\`\`bash
# Add your important commands here:
# pnpm install
# pnpm build
# pnpm test
# pnpm dev
\`\`\`

## Notes for BYTE

[Special instructions for the agent: files to avoid modifying, patterns it must follow,
context about ongoing work, anything that isn't obvious from the code itself]
`;

export async function runByteInit(cwd = process.cwd()): Promise<void> {
  const path = join(cwd, "BYTE.md");

  try {
    await access(path);
    process.stdout.write("BYTE.md already exists in this directory.\n");
    process.stdout.write("Delete it first if you want to regenerate it.\n");
    return;
  } catch {
    // File doesn't exist — proceed
  }

  await writeFile(path, BYTE_MD_TEMPLATE, "utf8");
  process.stdout.write("Created BYTE.md\n\n");
  process.stdout.write("Next steps:\n");
  process.stdout.write("  1. Edit BYTE.md with your project details\n");
  process.stdout.write("  2. Run: byte config --set-anthropic-key <key>\n");
  process.stdout.write("  3. Run: byte\n");
}
