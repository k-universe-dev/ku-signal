import { readFileSync } from "node:fs";
import { execa } from "execa";

const binaryPath = process.argv[2];

if (!binaryPath) {
  throw new Error("Usage: tsx scripts/smoke-binary.ts <binary-path>");
}

const packageVersion = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")).version;
const result = await execa(binaryPath, ["--version"]);

if (result.stdout.trim() !== packageVersion) {
  throw new Error(`Expected version ${packageVersion}, got ${result.stdout.trim() || "<empty>"}`);
}

process.stdout.write(`${binaryPath} -> ${result.stdout.trim()}\n`);
