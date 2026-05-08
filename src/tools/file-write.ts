import { writeFile, mkdir } from "fs/promises";
import { dirname } from "path";
import type { ByteTool } from "./file-read.js";

export const fileWriteTool: ByteTool = {
  definition: {
    name: "file_write",
    description: "Write content to a file, creating directories as needed",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string", description: "File path to write to" },
        content: { type: "string", description: "Content to write" },
      },
      required: ["path", "content"],
    },
  },
  async execute(args) {
    const path = String(args.path);
    const content = String(args.content);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, content, "utf8");
    return `Wrote ${content.length} bytes to ${path}`;
  },
};
