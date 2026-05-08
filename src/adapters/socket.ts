// WebSocket Server Adapter
// Each connected client gets its own AgentCore instance.
// Messages in: JSON command. Messages out: JSON event (newline-delimited).

import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { CommandSchema } from "../protocol/commands.js";
import { createAgentCore } from "../core/agent.js";
import type { AgentEvent } from "../protocol/events.js";

export interface SocketAdapterOptions {
  port?: number;
  host?: string;
  path?: string;
}

export interface SocketAdapter {
  start(): Promise<void>;
  stop(): Promise<void>;
}

export function createSocketAdapter(options: SocketAdapterOptions = {}): SocketAdapter {
  const { port = 9000, host = "127.0.0.1", path = "/k2" } = options;

  const httpServer = createServer();
  const wss = new WebSocketServer({ server: httpServer, path });

  wss.on("connection", (ws: WebSocket) => {
    const agent = createAgentCore({
      onEvent: (event) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(event));
        }
      },
    });

    ws.on("message", async (data) => {
      let raw: unknown;
      try {
        raw = JSON.parse(data.toString());
      } catch {
        const errEvent: AgentEvent = {
          type: "JobComplete",
          jobId: "parse-error",
          sessionId: "unknown",
          successful: false,
          error: "Invalid JSON",
          timestamp: new Date().toISOString(),
        };
        ws.send(JSON.stringify(errEvent));
        return;
      }

      const parsed = CommandSchema.safeParse(raw);
      if (!parsed.success) {
        const errEvent: AgentEvent = {
          type: "JobComplete",
          jobId: "validation-error",
          sessionId: "unknown",
          successful: false,
          error: parsed.error.message,
          timestamp: new Date().toISOString(),
        };
        ws.send(JSON.stringify(errEvent));
        return;
      }

      try {
        await agent.executeCommand(parsed.data);
      } catch (err) {
        const errEvent: AgentEvent = {
          type: "JobComplete",
          jobId: "runtime-error",
          sessionId: "unknown",
          successful: false,
          error: err instanceof Error ? err.message : String(err),
          timestamp: new Date().toISOString(),
        };
        ws.send(JSON.stringify(errEvent));
      }
    });

    ws.on("error", (err) => {
      process.stderr.write(`WebSocket error: ${err.message}\n`);
    });
  });

  async function start(): Promise<void> {
    return new Promise((resolve) => {
      httpServer.listen(port, host, () => {
        process.stdout.write(`K2 socket adapter listening on ws://${host}:${port}${path}\n`);
        resolve();
      });
    });
  }

  async function stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      wss.close(() => {
        httpServer.close((err) => (err ? reject(err) : resolve()));
      });
    });
  }

  return { start, stop };
}
