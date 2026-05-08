import { describe, it, expect } from "vitest";
import { parseSlashCommand, SLASH_COMMANDS } from "../../src/tui/commands.js";

describe("slash commands", () => {
  it("parses /exit", () => {
    const cmd = parseSlashCommand("/exit");
    expect(cmd?.name).toBe("exit");
    expect(cmd?.args).toBe("");
  });

  it("parses /model with argument", () => {
    const cmd = parseSlashCommand("/model claude-opus-4-7");
    expect(cmd?.name).toBe("model");
    expect(cmd?.args).toBe("claude-opus-4-7");
  });

  it("returns null for non-slash input", () => {
    expect(parseSlashCommand("hello world")).toBeNull();
  });

  it("returns null for unknown slash command", () => {
    expect(parseSlashCommand("/unknown")).toBeNull();
  });

  it("lists all expected commands", () => {
    const names = Object.keys(SLASH_COMMANDS);
    expect(names).toContain("exit");
    expect(names).toContain("clear");
    expect(names).toContain("model");
    expect(names).toContain("tools");
    expect(names).toContain("history");
  });
});
