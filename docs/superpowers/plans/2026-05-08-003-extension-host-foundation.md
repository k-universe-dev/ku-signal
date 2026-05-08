# KU-BYTE Plan 003 — Extension Host Foundation

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform KU-BYTE from a fixed CLI into an extension host — starting with repo context loading, typed extension manifests, and a `byte init` wizard. This is the first safe slice toward a Pi-style capability platform.

**Architecture:** Four new modules (`src/context.ts`, `src/extensions/manifest.ts`, `src/extensions/loader.ts`, `src/init.ts`) are added. `src/config.ts` gains an `extensions` field. `src/cli.ts` gains context loading and `byte init`. No dynamic extension execution yet — only types, discovery, and init.

**Tech Stack:** TypeScript strict, ESM NodeNext, zod (existing), fs/promises (Node built-in), commander (existing)

---

## The Bigger Picture (roadmap — not implemented here)

KU-BYTE's destination is an extension host competitive with Pi's package system. The full platform will support:

- `byte install npm:@k-universe/ext-foo` — install TypeScript extensions from npm or git
- Extension API: `extension.activate(context)` registers tools, commands, TUI hooks, providers
- Permission system: extensions declare required permissions; user confirms on first run
- Marketplace: browsable registry at byte.k-universe.dev
- Session branching, skills (markdown-driven prompts), themes

**This plan builds the non-negotiable foundation without which the platform cannot exist:**

| Layer | This plan | Future plan |
|---|---|---|
| Repo context | ✅ loadRepoContext() | Hierarchical AGENTS.md walking |
| Extension types | ✅ ExtensionManifest schema | Provider-typed extension API |
| Extension discovery | ✅ discoverExtensions() scans disk | Dynamic import() + activation |
| Config | ✅ extensions[] field | Per-extension settings |
| Init | ✅ byte init creates BYTE.md | byte install, byte publish |
| Permissions | ❌ not yet | file_write/bash confirmation gate |
| Providers | ❌ not yet | Gemini, Groq, Mistral |
| npm packaging | ❌ not yet | npm install -g ku-byte |

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/context.ts` | Create | Discover + load BYTE.md / AGENTS.md / CLAUDE.md |
| `src/extensions/manifest.ts` | Create | ExtensionManifest zod schema + types |
| `src/extensions/loader.ts` | Create | discoverExtensions() scans ~/.config/byte/extensions/ |
| `src/init.ts` | Create | BYTE_MD_TEMPLATE + runByteInit() |
| `src/config.ts` | Modify | Add `extensions` array field to ByteConfigSchema |
| `src/cli.ts` | Modify | Wire context into runner systemPrompt + add `byte init` command |
| `tests/unit/context.test.ts` | Create | TDD tests for loadRepoContext |
| `tests/unit/extensions.test.ts` | Create | TDD tests for ExtensionManifest schema |
| `tests/unit/init.test.ts` | Create | TDD tests for runByteInit + template |

**Do not touch:** `src/core/`, `src/protocol/`, `src/providers/`, `src/tui/`, `src/adapters/`, `src/sessions.ts`, `src/tools/`

---

## Task 1: Repo context loader

**Files:**
- Create: `src/context.ts`
- Create: `tests/unit/context.test.ts`

Priority order: **BYTE.md** → **AGENTS.md** → **CLAUDE.md**. The first file found wins.

- [ ] **Step 1: Write failing tests**

```typescript
// tests/unit/context.test.ts
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
```

- [ ] **Step 2: Run to confirm failure**

```bash
pnpm test tests/unit/context.test.ts
```
Expected: FAIL — `context.js` module not found.

- [ ] **Step 3: Write src/context.ts**

```typescript
// src/context.ts
import { readFile, access } from "fs/promises";
import { join } from "path";

export const CONTEXT_FILES = ["BYTE.md", "AGENTS.md", "CLAUDE.md"] as const;

export async function loadRepoContext(cwd = process.cwd()): Promise<string | null> {
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
```

- [ ] **Step 4: Run tests**

```bash
pnpm test tests/unit/context.test.ts
```
Expected: PASS 7/7.

- [ ] **Step 5: Commit**

```bash
git add src/context.ts tests/unit/context.test.ts
git commit -m "feat(context): loadRepoContext discovers BYTE.md / AGENTS.md / CLAUDE.md"
```

---

## Task 2: Extension manifest schema + config field

**Files:**
- Create: `src/extensions/manifest.ts`
- Create: `tests/unit/extensions.test.ts`
- Modify: `src/config.ts`

- [ ] **Step 1: Create the extensions directory**

```bash
mkdir -p src/extensions
```

- [ ] **Step 2: Write failing tests**

```typescript
// tests/unit/extensions.test.ts
import { describe, it, expect } from "vitest";
import {
  ExtensionManifestSchema,
  ExtensionPermissionSchema,
} from "../../src/extensions/manifest.js";
import { ByteConfigSchema } from "../../src/config.js";

describe("ExtensionManifest schema", () => {
  it("validates a minimal valid manifest", () => {
    const result = ExtensionManifestSchema.safeParse({
      name: "my-extension",
      version: "1.0.0",
      description: "A test extension",
      byteVersion: ">=0.1.0",
      entry: "dist/index.js",
    });
    expect(result.success).toBe(true);
  });

  it("defaults tools, commands, permissions to empty arrays", () => {
    const result = ExtensionManifestSchema.parse({
      name: "ext",
      version: "0.0.1",
      description: "desc",
      byteVersion: ">=0.1.0",
      entry: "index.js",
    });
    expect(result.tools).toEqual([]);
    expect(result.commands).toEqual([]);
    expect(result.permissions).toEqual([]);
  });

  it("rejects manifest with invalid semver version", () => {
    const result = ExtensionManifestSchema.safeParse({
      name: "ext",
      version: "not-semver",
      description: "desc",
      byteVersion: ">=0.1.0",
      entry: "index.js",
    });
    expect(result.success).toBe(false);
  });

  it("rejects unknown permissions", () => {
    const result = ExtensionManifestSchema.safeParse({
      name: "ext",
      version: "1.0.0",
      description: "desc",
      byteVersion: ">=0.1.0",
      entry: "index.js",
      permissions: ["superuser"],
    });
    expect(result.success).toBe(false);
  });

  it("accepts all valid permission values", () => {
    const perms = ["file_read", "file_write", "bash", "network"];
    for (const perm of perms) {
      expect(ExtensionPermissionSchema.safeParse(perm).success).toBe(true);
    }
  });
});

describe("ByteConfig extensions field", () => {
  it("defaults to empty extensions array", () => {
    const result = ByteConfigSchema.parse({
      defaultModel: "claude-sonnet-4-6",
      defaultProvider: "anthropic",
      providers: {},
    });
    expect(result.extensions).toEqual([]);
  });

  it("accepts a valid extension entry", () => {
    const result = ByteConfigSchema.parse({
      defaultModel: "claude-sonnet-4-6",
      defaultProvider: "anthropic",
      providers: {},
      extensions: [{ name: "my-ext", enabled: true }],
    });
    expect(result.extensions[0].name).toBe("my-ext");
    expect(result.extensions[0].enabled).toBe(true);
  });
});
```

- [ ] **Step 3: Run to confirm failure**

```bash
pnpm test tests/unit/extensions.test.ts
```
Expected: FAIL — `manifest.js` module not found, `ByteConfigSchema` not exported.

- [ ] **Step 4: Write src/extensions/manifest.ts**

```typescript
// src/extensions/manifest.ts
import { z } from "zod";

export const ExtensionPermissionSchema = z.enum([
  "file_read",
  "file_write",
  "bash",
  "network",
]);

export type ExtensionPermission = z.infer<typeof ExtensionPermissionSchema>;

export const ExtensionManifestSchema = z.object({
  name: z.string().min(1),
  version: z.string().regex(/^\d+\.\d+\.\d+/, "must start with semver digits"),
  description: z.string(),
  byteVersion: z.string(),
  entry: z.string().min(1),
  tools: z.array(z.string()).default([]),
  commands: z.array(z.string()).default([]),
  permissions: z.array(ExtensionPermissionSchema).default([]),
});

export type ExtensionManifest = z.infer<typeof ExtensionManifestSchema>;
```

- [ ] **Step 5: Update src/config.ts**

Read the current file. Make two changes:

**A. Export `ByteConfigSchema`** — add `export` keyword to the schema declaration:
```typescript
export const ByteConfigSchema = z.object({
  // ... all existing fields unchanged ...
  extensions: z.array(
    z.object({
      name: z.string().min(1),
      enabled: z.boolean().default(true),
      path: z.string().optional(),
    })
  ).default([]),
});
```

**B. Update `defaultConfig()`** to include `extensions: []`:
```typescript
export function defaultConfig(): ByteConfig {
  return {
    defaultModel: "claude-sonnet-4-6",
    defaultProvider: "anthropic",
    providers: {},
    theme: { accentColor: "#0066FF" },
    extensions: [],
  };
}
```

- [ ] **Step 6: Run typecheck**

```bash
pnpm typecheck
```
Expected: 0 errors.

- [ ] **Step 7: Run extension tests**

```bash
pnpm test tests/unit/extensions.test.ts
```
Expected: PASS 7/7.

- [ ] **Step 8: Run full suite to catch regressions**

```bash
pnpm test
```
Expected: All previously passing tests still pass.

- [ ] **Step 9: Commit**

```bash
git add src/extensions/manifest.ts src/config.ts tests/unit/extensions.test.ts
git commit -m "feat(extensions): ExtensionManifest schema + config extensions field"
```

---

## Task 3: Extension directory scanner

**Files:**
- Create: `src/extensions/loader.ts`

Note: `discoverExtensions()` reads from the OS-specific extensions directory. We test it by reading the ExtensionManifest schema separately (Task 2). The loader itself is integration-level code — no unit test needed for the directory scan since the directory won't exist in CI. The function returns `[]` gracefully when the directory is absent.

- [ ] **Step 1: Write src/extensions/loader.ts**

```typescript
// src/extensions/loader.ts
import { readdir, readFile, stat } from "fs/promises";
import { join } from "path";
import { homedir, platform } from "os";
import { ExtensionManifestSchema, type ExtensionManifest } from "./manifest.js";

export function extensionsDir(): string {
  if (platform() === "win32") {
    return join(homedir(), "AppData", "Roaming", "byte", "extensions");
  }
  return join(homedir(), ".config", "byte", "extensions");
}

export async function discoverExtensions(): Promise<ExtensionManifest[]> {
  const dir = extensionsDir();
  const results: ExtensionManifest[] = [];

  let entries: string[];
  try {
    entries = await readdir(dir);
  } catch {
    return [];
  }

  for (const entry of entries) {
    const entryPath = join(dir, entry);
    try {
      const s = await stat(entryPath);
      if (!s.isDirectory()) continue;

      const manifestPath = join(entryPath, "byte.extension.json");
      const raw = await readFile(manifestPath, "utf8");
      const parsed = ExtensionManifestSchema.safeParse(JSON.parse(raw));
      if (parsed.success) {
        results.push(parsed.data);
      }
    } catch {
      continue;
    }
  }

  return results;
}
```

- [ ] **Step 2: Run typecheck**

```bash
pnpm typecheck
```
Expected: 0 errors.

- [ ] **Step 3: Run full test suite**

```bash
pnpm test
```
Expected: All tests pass (no new tests — loader is integration-level, tested via extensions.test.ts schema tests).

- [ ] **Step 4: Commit**

```bash
git add src/extensions/loader.ts
git commit -m "feat(extensions): discoverExtensions scans extensions directory for manifests"
```

---

## Task 4: byte init command + BYTE.md template

**Files:**
- Create: `src/init.ts`
- Create: `tests/unit/init.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// tests/unit/init.test.ts
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
```

- [ ] **Step 2: Run to confirm failure**

```bash
pnpm test tests/unit/init.test.ts
```
Expected: FAIL — `init.js` module not found.

- [ ] **Step 3: Write src/init.ts**

```typescript
// src/init.ts
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
```

- [ ] **Step 4: Run tests**

```bash
pnpm test tests/unit/init.test.ts
```
Expected: PASS 4/4.

- [ ] **Step 5: Commit**

```bash
git add src/init.ts tests/unit/init.test.ts
git commit -m "feat(init): runByteInit creates BYTE.md template with project context sections"
```

---

## Task 5: Wire context into CLI + add byte init command

**Files:**
- Modify: `src/cli.ts`

Two changes to `src/cli.ts` in one pass:
1. Load repo context before creating the runner and prepend it to `systemPrompt`
2. Add `byte init` as a new subcommand

- [ ] **Step 1: Read current src/cli.ts**

Note the import section and the runner creation block. Confirm:
- `systemPrompt` is currently hardcoded as a string literal
- The `program.argument("[prompt]")` action block creates the runner

- [ ] **Step 2: Add imports at the top of cli.ts**

Add these two imports after the existing imports:

```typescript
import { loadRepoContext } from "./context.js";
import { runByteInit } from "./init.js";
```

- [ ] **Step 3: Add byte init command** (before the `program.argument(...)` block)

```typescript
program
  .command("init")
  .description("Initialize BYTE.md in the current project directory")
  .action(async () => {
    await runByteInit(process.cwd());
  });
```

- [ ] **Step 4: Wire context into runner systemPrompt**

Inside the `program.argument("[prompt]", ...).action(async (prompt, opts) => { ... })` block, after building `provider` and before `createRunner(...)`, add:

```typescript
const repoContext = await loadRepoContext(process.cwd());

const systemPromptParts = [
  "You are BYTE, a K-Universe AI coding agent. Help the user with coding tasks. Be concise and direct.",
];
if (repoContext) {
  systemPromptParts.push("\n\n" + repoContext);
}
const systemPrompt = systemPromptParts.join("");
```

Then replace the hardcoded `systemPrompt:` in `createRunner({...})`:

```typescript
const runner = createRunner({
  provider,
  model,
  tools: runnerTools,
  systemPrompt,  // ← was a hardcoded string, now the variable
});
```

- [ ] **Step 5: Run typecheck**

```bash
pnpm typecheck
```
Expected: 0 errors.

- [ ] **Step 6: Smoke test byte init**

```bash
npx tsx src/cli.ts init
```
Expected output:
```
Created BYTE.md

Next steps:
  1. Edit BYTE.md with your project details
  2. Run: byte config --set-anthropic-key <key>
  3. Run: byte
```
Confirm `BYTE.md` was created in the current directory. Then delete it.

- [ ] **Step 7: Smoke test context loading**

```bash
echo "# My Test Project\n\nThis is a test context." > /tmp/BYTE-test.md
# (or on Windows: New-Item BYTE.md with content)
# Then verify it loads by running byte and checking the system prompt includes it
npx tsx src/cli.ts -p "What project context do you have?" --provider lmstudio
```
(LM Studio test — context will appear if loaded. Skip if LM Studio not running.)

- [ ] **Step 8: Run full test suite**

```bash
pnpm test
```
Expected: All 42 tests pass (35 existing + 7 context + 7 extensions + 4 init — minus any that don't exist yet = all previously passing).

Wait — count: 35 existing + 7 (context) + 7 (extensions) + 4 (init) = 53 total.

Actually the test count will be 35 + (7 + 7 + 4) = 35 + 18 = 53. Run and check all pass.

- [ ] **Step 9: Run K2 verify**

```bash
npx tsx scripts/verify.ts
```
Expected: 4/4 PASS.

- [ ] **Step 10: Commit**

```bash
git add src/cli.ts
git commit -m "feat(cli): wire repo context into runner systemPrompt + add byte init command"
```

---

## Verification

After all tasks complete:

```bash
# 1. Full test suite
pnpm test
# Expected: 53 tests pass (35 baseline + 18 new)

# 2. TypeScript
pnpm typecheck

# 3. K2 invariants
npx tsx scripts/verify.ts

# 4. byte init smoke test
npx tsx src/cli.ts init
# Expected: Creates BYTE.md, prints next steps

# 5. byte init idempotent
npx tsx src/cli.ts init
# Expected: "BYTE.md already exists" message, file unchanged

# 6. byte --help shows init subcommand
npx tsx src/cli.ts --help
# Expected: "init  Initialize BYTE.md in the current project directory" in output
```

---

## What This Plan Delivers

**Files changed:** `src/cli.ts`, `src/config.ts`

**Files created:** `src/context.ts`, `src/extensions/manifest.ts`, `src/extensions/loader.ts`, `src/init.ts`, `tests/unit/context.test.ts`, `tests/unit/extensions.test.ts`, `tests/unit/init.test.ts`

**Extension-host pieces now in place:**
- `ExtensionManifest` type — typed schema for future extension packages
- `extensionsDir()` — canonical OS-aware path for installed extensions
- `discoverExtensions()` — scans disk and returns valid manifests
- `ByteConfig.extensions[]` — persisted list of enabled extensions
- `byte.extension.json` — the convention for extension metadata files

**What remains before installing third-party TypeScript extensions:**
1. Extension activation API — `extension.activate(context)` where `context` exposes `registerTool()`, `registerCommand()`, `registerProvider()`
2. Dynamic import — `await import(manifest.entry)` + call `activate()`
3. Permission gate — user confirms permissions declared in manifest before first activation
4. `byte install npm:@pkg/name` — pulls from npm, writes to extensionsDir(), updates config
5. Extension sandboxing — isolated tool registry per extension, cleanup on deactivate

---

## Deferred to Future Plans

**Plan 004 — Permission system:**
- `PermissionGate` class prompts user before `file_write` and `bash` tool calls
- Extensions declare `permissions[]` in manifest; gate enforced on activation
- `byte --allow file_write,bash` flag to pre-authorize

**Plan 005 — Provider expansion + npm packaging:**
- `src/providers/gemini/index.ts` using `@google/generative-ai`
- `src/providers/groq/index.ts` using `groq-sdk`
- Remove `"private": true` from package.json, publish as `ku-byte`
- Add `README.md` with install instructions and screenshots
