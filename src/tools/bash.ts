import { execa } from "execa";
import { platform } from "os";
import type { ByteTool } from "./file-read.js";

const isWin = platform() === "win32";
// On Windows: Git Bash sh.exe is available; use it for POSIX compatibility.
// Fall back to cmd /c if sh is not found (handled by execa throwing ENOENT).
const SHELL = isWin ? ["sh", "-c"] : ["sh", "-c"];

export const bashTool: ByteTool = {
  definition: {
    name: "bash",
    description: "Execute a shell command and return stdout",
    parameters: {
      type: "object",
      properties: {
        command: { type: "string", description: "Shell command to run" },
        timeout: { type: "number", description: "Timeout in ms (default 30000)" },
      },
      required: ["command"],
    },
  },
  async execute(args) {
    const command = String(args.command);
    const timeout = typeof args.timeout === "number" ? args.timeout : 30000;
    try {
      const result = await execa(SHELL[0], [...SHELL.slice(1), command], {
        timeout,
        all: true,
      });
      return result.all ?? result.stdout;
    } catch (err: unknown) {
      // If sh not found on Windows, fall back to cmd /c
      if (isWin && err instanceof Error && "code" in err && (err as NodeJS.ErrnoException).code === "ENOENT") {
        const result = await execa("cmd", ["/c", command], {
          timeout,
          all: true,
        });
        return result.all ?? result.stdout;
      }
      throw err;
    }
  },
};
