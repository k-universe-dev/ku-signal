#!/usr/bin/env npx ts-node
import * as fs from "fs";
import * as path from "path";

const ROOT = process.cwd();

interface CheckResult {
  name: string;
  passed: boolean;
  detail?: string;
}

const results: CheckResult[] = [];

function readFile(relPath: string): string | null {
  const full = path.join(ROOT, relPath);
  if (!fs.existsSync(full)) return null;
  return fs.readFileSync(full, "utf-8");
}

function pass(name: string, detail?: string): void {
  results.push({ name, passed: true, detail });
}

function fail(name: string, detail: string): void {
  results.push({ name, passed: false, detail });
}

// ─── Check 1: No z.any() in events.ts for state field ─────────
{
  const content = readFile("src/protocol/events.ts");
  if (!content) {
    fail("KWire-1: events.ts exists", "File not found");
  } else {
    // Look for state: z.any() pattern
    const hasZAnyState = /state:\s*z\.any\(\)/.test(content);
    if (hasZAnyState) {
      fail("KWire-1: SessionUpdated.state typed", "Found state: z.any() — must use SessionStateSnapshotSchema");
    } else {
      const hasSnapshotSchema = content.includes("SessionStateSnapshotSchema");
      pass("KWire-1: SessionUpdated.state typed", hasSnapshotSchema ? "Uses SessionStateSnapshotSchema ✔" : "Schema import not detected — verify manually");
    }
  }
}

// ─── Check 2: protocolVersion in all command schemas ──────────
{
  const content = readFile("src/protocol/commands.ts");
  if (!content) {
    fail("KWire-3: commands.ts exists", "File not found");
  } else {
    const schemaMatches = content.matchAll(/z\.object\(\{/g);
    const objectCount = Array.from(schemaMatches).length;
    const protocolVersionCount = (content.match(/protocolVersion:\s*z\.literal\("1\.0"\)/g) || []).length;

    if (protocolVersionCount >= objectCount && protocolVersionCount > 0) {
      pass("KWire-3: protocolVersion in commands", `${protocolVersionCount} schemas with protocolVersion ✔`);
    } else {
      fail("KWire-3: protocolVersion in commands", `Found ${protocolVersionCount} protocolVersion fields for ${objectCount} z.object() blocks`);
    }
  }
}

// ─── Check 3: No provider SDK imports in models.ts ─────────────
{
  const content = readFile("src/core/models.ts");
  if (!content) {
    fail("ARCH: models.ts exists", "File not found");
  } else {
    const bannedImports = [
      'from "openai"',
      'from "@anthropic-ai/sdk"',
      'from "@google/genai"',
      'from "@mistralai/mistralai"',
    ];
    const found = bannedImports.filter((imp) => content.includes(imp));
    if (found.length > 0) {
      fail("ARCH: models.ts clean", `Found banned imports: ${found.join(", ")}`);
    } else {
      pass("ARCH: models.ts clean", "No provider SDK imports ✔");
    }
  }
}

// ─── Check 4: All 5 methods present in agent.ts ───────────────
{
  const content = readFile("src/core/agent.ts");
  if (!content) {
    fail("KWire-2: agent.ts exists", "File not found");
  } else {
    const requiredMethods = [
      "createSession",
      "destroySession",
      "executeCommand",
      "invokeTool",
      "cancelJob",
    ];
    const found = requiredMethods.filter((m) => content.includes(m));
    const missing = requiredMethods.filter((m) => !content.includes(m));

    if (missing.length === 0) {
      pass("KWire-2: AgentCore methods", `All 5 methods present ✔`);
    } else {
      fail("KWire-2: AgentCore methods", `Missing: ${missing.join(", ")}`);
    }
  }
}

// ─── Report ───────────────────────────────────────────────────

console.log("\n╔══════════════════════════════════════════════════╗");
console.log("║ K-Wire Verification Report                          ║");
console.log("╚══════════════════════════════════════════════════╝\n");

let passed = 0;
let failed = 0;

for (const r of results) {
  const icon = r.passed ? "✔" : "✘";
  const color = r.passed ? "\x1b[32m" : "\x1b[31m";
  const reset = "\x1b[0m";
  console.log(`${color}${icon}${reset} ${r.name}`);
  if (r.detail) {
    console.log(`   ${r.detail}`);
  }
  if (r.passed) passed++; else failed++;
}

console.log(`\n${passed} passed, ${failed} failed\n`);

if (failed > 0) {
  process.exit(1);
}
