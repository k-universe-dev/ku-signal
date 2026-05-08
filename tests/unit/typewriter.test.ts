import { describe, it, expect } from "vitest";
import { typewriterChars } from "../../src/tui/MessageList.js";

describe("typewriter logic", () => {
  it("shows 0 chars at frame 0", () => {
    expect(typewriterChars("Hello", 0, 3)).toBe("");
  });

  it("shows partial text mid-animation", () => {
    expect(typewriterChars("Hello", 1, 3)).toBe("Hel");
  });

  it("shows full text when frames exceed length", () => {
    expect(typewriterChars("Hello", 10, 3)).toBe("Hello");
  });

  it("never exceeds text length", () => {
    const result = typewriterChars("Hi", 100, 5);
    expect(result.length).toBeLessThanOrEqual(2);
  });
});
