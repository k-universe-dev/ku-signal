import { glob } from "glob";
import { readFile } from "fs/promises";
import type { ByteTool } from "./file-read.js";

export const searchTool: ByteTool = {
  definition: {
    name: "search",
    description: "Search for files matching a glob pattern, optionally filter by content",
    parameters: {
      type: "object",
      properties: {
        pattern: { type: "string", description: "Glob pattern e.g. src/**/*.ts" },
        contains: { type: "string", description: "Optional: filter files containing this string" },
      },
      required: ["pattern"],
    },
  },
  async execute(args) {
    const pattern = String(args.pattern);
    const contains = args.contains ? String(args.contains) : undefined;
    const files = await glob(pattern, { ignore: ["node_modules/**", "dist/**"] });

    if (!contains) return files.join("\n");

    const matches: string[] = [];
    for (const file of files) {
      const content = await readFile(file, "utf8").catch(() => "");
      if (content.includes(contains)) matches.push(file);
    }
    return matches.join("\n");
  },
};
