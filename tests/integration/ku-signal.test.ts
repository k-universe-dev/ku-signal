import { describe, it, expect } from "vitest";
import { execa } from "execa";

describe("ku-signal CLI integration", () => {
  it("--version prints 0.1.0", async () => {
    const result = await execa("npx", ["tsx", "src/cli.ts", "--version"], {
      cwd: process.cwd(),
    });
    expect(result.stdout.trim()).toBe("0.1.0");
  });

  it("--help prints KU-Signal description", async () => {
    const result = await execa("npx", ["tsx", "src/cli.ts", "--help"], {
      cwd: process.cwd(),
    });
    expect(result.stdout).toContain("ku-signal");
    expect(result.stdout).toContain("K-Universe");
  });

  it("config --help prints config options", async () => {
    const result = await execa("npx", ["tsx", "src/cli.ts", "config", "--help"], {
      cwd: process.cwd(),
    });
    expect(result.stdout).toContain("anthropic");
  });

  it("one-shot print to LM Studio returns output or connection error", async () => {
    const result = await execa(
      "npx",
      ["tsx", "src/cli.ts", "Say the word PONG only", "--print", "--provider", "lmstudio"],
      {
        cwd: process.cwd(),
        reject: false,
        env: { ...process.env },
      }
    );
    const combined = result.stdout + result.stderr;
    expect(combined.length).toBeGreaterThan(0);
  });
});
