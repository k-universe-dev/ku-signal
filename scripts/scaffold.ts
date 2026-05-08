#!/usr/bin/env npx ts-node
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

const ROOT = process.cwd();

const DIRS = [
  "src/protocol",
  "src/core",
  "src/adapters",
  "src/providers",
  "scripts",
  "docs/runbooks",
  "docs/research",
  "docs/ADR",
  "notes",
  "tests/unit",
  "tests/integration",
];

const TEMPLATE_FILES: Record<string, string> = {
  "package.json": JSON.stringify(
    {
      name: "k2-agent-harness",
      version: "0.1.0",
      private: true,
      type: "module",
      scripts: {
        build: "tsc",
        verify: "npx ts-node scripts/verify.ts",
        scaffold: "npx ts-node scripts/scaffold.ts",
        cli: "npx ts-node src/adapters/cli.ts",
        socket: "npx ts-node src/adapters/socket.ts",
      },
      dependencies: {
        zod: "^3.23.0",
        ws: "^8.18.0",
      },
      devDependencies: {
        typescript: "^5.4.0",
        "@types/node": "^20.0.0",
        "@types/ws": "^8.5.0",
        "ts-node": "^10.9.2",
      },
    },
    null,
    2
  ),

  "tsconfig.json": JSON.stringify(
    {
      compilerOptions: {
        target: "ES2022",
        module: "NodeNext",
        moduleResolution: "NodeNext",
        outDir: "dist",
        rootDir: "src",
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        declaration: true,
        declarationMap: true,
        sourceMap: true,
      },
      include: ["src/**/*"],
      exclude: ["node_modules", "dist"],
    },
    null,
    2
  ),

  ".gitignore": `node_modules/
dist/
.env
*.js.map
`,

  "README.md": `# K2 Agent Harness

K-Universe AI coding agent protocol layer.

## Quick Start

\`\`\`bash
bash scripts/install.sh
npm run verify
\`\`\`
`,
};

function ensureDir(dir: string): void {
  const full = path.join(ROOT, dir);
  if (!fs.existsSync(full)) {
    fs.mkdirSync(full, { recursive: true });
    console.log(` ✔ Created: ${dir}`);
  } else {
    console.log(` · Exists: ${dir}`);
  }
}

function writeTemplate(file: string, content: string): void {
  const full = path.join(ROOT, file);
  if (!fs.existsSync(full)) {
    fs.writeFileSync(full, content, "utf-8");
    console.log(` ✔ Written: ${file}`);
  } else {
    console.log(` · Skipped: ${file} (already exists)`);
  }
}

function runNpmInstall(): void {
  const pkgPath = path.join(ROOT, "package.json");
  if (fs.existsSync(pkgPath) && !fs.existsSync(path.join(ROOT, "node_modules"))) {
    console.log("\n › Running npm install...");
    execSync("npm install", { stdio: "inherit", cwd: ROOT });
    console.log(" ✔ npm install complete");
  }
}

console.log("\n ╔══════════════════════════════════════╗");
console.log("║ K2 Scaffold — Directory Structure ║");
console.log("╚══════════════════════════════════════╝\n");

console.log("Creating directories:");
DIRS.forEach(ensureDir);

console.log("\nWriting template files:");
Object.entries(TEMPLATE_FILES).forEach(([file, content]) => writeTemplate(file, content));

runNpmInstall();

console.log("\n✔ Scaffold complete.\n");
