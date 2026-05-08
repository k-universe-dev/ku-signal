import * as readline from "readline";
import { CommandSchema } from "../protocol/commands.js";
import { createAgentCore } from "../core/agent.js";
import type { AgentEvent } from "../protocol/events.js";

function writeEvent(event: AgentEvent): void {
  process.stdout.write(JSON.stringify(event) + "\n");
}

async function main(): Promise<void> {
  const agent = createAgentCore({
    onEvent: (event) => writeEvent(event as AgentEvent),
  });

  const rl = readline.createInterface({
    input: process.stdin,
    terminal: false,
  });

  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    let raw: unknown;
    try {
      raw = JSON.parse(trimmed);
    } catch {
      writeEvent({
        type: "JobComplete",
        jobId: "parse-error",
        sessionId: "unknown",
        successful: false,
        error: `JSON parse error: ${trimmed}`,
        timestamp: new Date().toISOString(),
      });
      continue;
    }

    const parsed = CommandSchema.safeParse(raw);
    if (!parsed.success) {
      writeEvent({
        type: "JobComplete",
        jobId: "validation-error",
        sessionId: "unknown",
        successful: false,
        error: parsed.error.message,
        timestamp: new Date().toISOString(),
      });
      continue;
    }

    try {
      await agent.executeCommand(parsed.data);
    } catch (err) {
      writeEvent({
        type: "JobComplete",
        jobId: "runtime-error",
        sessionId: "unknown",
        successful: false,
        error: err instanceof Error ? err.message : String(err),
        timestamp: new Date().toISOString(),
      });
    }
  }
}

main().catch((err) => {
  process.stderr.write(`CLI adapter fatal error: ${err}\n`);
  process.exit(1);
});
