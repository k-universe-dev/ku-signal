// VS Code Extension Host Adapter
// Bridges the K2 agent protocol to VS Code's extension API.
// This module must be loaded inside a VS Code extension context.

import { CommandSchema } from "../protocol/commands.js";
import { createAgentCore } from "../core/agent.js";
import type { AgentEvent } from "../protocol/events.js";
import type { AgentCore } from "../core/agent.js";

export interface VSCodeAdapterOptions {
  outputChannelName?: string;
  onEvent?: (event: AgentEvent) => void;
}

export interface VSCodeAdapter {
  agent: AgentCore;
  dispose(): void;
}

/**
 * Create the VS Code adapter.
 * Call this from your extension's `activate()` function.
 *
 * @example
 * ```ts
 * import { createVSCodeAdapter } from './adapters/vscode.js';
 *
 * export function activate(context: vscode.ExtensionContext) {
 *   const adapter = createVSCodeAdapter({ outputChannelName: 'K2 Agent' });
 *   context.subscriptions.push({ dispose: adapter.dispose });
 * }
 * ```
 */
export function createVSCodeAdapter(options: VSCodeAdapterOptions = {}): VSCodeAdapter {
  const { onEvent } = options;

  const agent = createAgentCore({
    onEvent: (event) => {
      onEvent?.(event as AgentEvent);
    },
  });

  /**
   * Execute a raw command payload received from VS Code message passing,
   * webview postMessage, or language server protocol.
   */
  async function handleRawCommand(raw: unknown): Promise<void> {
    const parsed = CommandSchema.safeParse(raw);
    if (!parsed.success) {
      onEvent?.({
        type: "JobComplete",
        jobId: "validation-error",
        sessionId: "unknown",
        successful: false,
        error: `Command validation failed: ${parsed.error.message}`,
        timestamp: new Date().toISOString(),
      });
      return;
    }
    await agent.executeCommand(parsed.data);
  }

  function dispose(): void {
    // Clean up sessions, timers, or listeners here in full implementation.
  }

  return {
    agent,
    dispose,
  };
}

export { handleRawCommand } from "./vscode.js";
