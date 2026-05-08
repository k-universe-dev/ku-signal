import { readFile } from "fs/promises";
import type { ToolDefinition } from "../core/models.js";

export interface ByteTool {
  definition: ToolDefinition;
  execute(args: Record<string, unknown>): Promise<string>;
}

export const fileReadTool: ByteTool = {
  definition: {
    name: "file_read",
    description: "Read the contents of a file at the given path",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string", description: "Relative or absolute file path" },
      },
      required: ["path"],
    },
  },
  async execute(args) {
    const path = String(args.path);
    const content = await readFile(path, "utf8");
    return content;
  },
};
