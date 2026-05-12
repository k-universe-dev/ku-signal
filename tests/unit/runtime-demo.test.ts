import { describe, it, expect } from "vitest";
import { computeContext, sectionVisibility } from "../../demo/tui/runtime.js";
import type { RuntimeState, RenderCapabilities } from "../../demo/tui/runtime.js";

const caps: RenderCapabilities = { width: 120, height: 40, unicode: true, color: true };

const base: RuntimeState = {
  identity: {
    app: "ku-signal", mode: "expanded", phase: "thinking",
    role: "agent", model: "claude-sonnet-4-6",
    runtimeMs: 0, tokenUsage: 0, status: "idle",
  },
  focus: { title: "test objective" },
  activity: [], reasoning: [], operations: [], next: [], tools: [], warnings: [],
  prompt: { text: "", quickActions: [] },
};

describe("computeContext", () => {
  it("inherits mode from state", () => {
    expect(computeContext(base, caps).mode).toBe("expanded");
  });

  it("compact density when width < 80", () => {
    expect(computeContext(base, { ...caps, width: 60 }).density).toBe("compact");
  });

  it("normal density at 120 width", () => {
    expect(computeContext(base, caps).density).toBe("normal");
  });
});

describe("sectionVisibility", () => {
  it("compact+compact hides reasoning and next", () => {
    const v = sectionVisibility("compact", "compact");
    expect(v.reasoning).toBe("H");
    expect(v.next).toBe("H");
    expect(v.focus).toBe("P");
  });

  it("expanded+normal: focus P, activity P, reasoning P", () => {
    const v = sectionVisibility("expanded", "normal");
    expect(v.focus).toBe("P");
    expect(v.activity).toBe("P");
    expect(v.reasoning).toBe("P");
  });

  it("debug+normal: warnings P, next H", () => {
    const v = sectionVisibility("debug", "normal");
    expect(v.warnings).toBe("P");
    expect(v.next).toBe("H");
  });

  it("reasoning+compact: reasoning P, operations H", () => {
    const v = sectionVisibility("reasoning", "compact");
    expect(v.reasoning).toBe("P");
    expect(v.operations).toBe("H");
  });
});
