import { describe, it, expect } from "vitest";
import { AgentEventSchema } from "../../src/protocol/events.js";

describe("TokenChunkEvent", () => {
  it("validates a valid TokenChunk event", () => {
    const event = {
      type: "TokenChunk",
      jobId: "job_123",
      sessionId: "session_456",
      chunk: "Hello",
      timestamp: new Date().toISOString(),
    };
    const result = AgentEventSchema.safeParse(event);
    expect(result.success).toBe(true);
  });

  it("rejects TokenChunk with missing chunk field", () => {
    const event = {
      type: "TokenChunk",
      jobId: "job_123",
      sessionId: "session_456",
      timestamp: new Date().toISOString(),
    };
    const result = AgentEventSchema.safeParse(event);
    expect(result.success).toBe(false);
  });
});
