import { describe, it, expect } from "vitest";
import { fileReadTool } from "../../src/tools/file-read.js";
import { fileWriteTool } from "../../src/tools/file-write.js";
import { bashTool } from "../../src/tools/bash.js";
import { searchTool } from "../../src/tools/search.js";
import { allTools } from "../../src/tools/index.js";

describe("tools", () => {
  it("fileReadTool has correct ToolDefinition shape", () => {
    expect(fileReadTool.definition.name).toBe("file_read");
    expect(fileReadTool.definition.description).toContain("Read");
    expect(typeof fileReadTool.execute).toBe("function");
  });

  it("fileWriteTool has correct ToolDefinition shape", () => {
    expect(fileWriteTool.definition.name).toBe("file_write");
    expect(typeof fileWriteTool.execute).toBe("function");
  });

  it("bashTool has correct ToolDefinition shape", () => {
    expect(bashTool.definition.name).toBe("bash");
    expect(typeof bashTool.execute).toBe("function");
  });

  it("searchTool has correct ToolDefinition shape", () => {
    expect(searchTool.definition.name).toBe("search");
    expect(typeof searchTool.execute).toBe("function");
  });

  it("allTools exports 4 tools", () => {
    expect(allTools).toHaveLength(4);
  });

  it("fileReadTool reads a real file", async () => {
    const result = await fileReadTool.execute({ path: "package.json" });
    expect(result).toContain("@ku/signal");
  });

  it("bashTool runs echo command", async () => {
    const result = await bashTool.execute({ command: "echo hello-byte" });
    expect(result.trim()).toBe("hello-byte");
  });
});
