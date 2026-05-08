import { execa } from "execa";
import type { ByteTool } from "./file-read.js";

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
    const result = await execa(command, {
      shell: true,
      timeout,
      all: true,
    });
    return result.all ?? result.stdout;
  },
};
