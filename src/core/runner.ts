import type { ModelProvider, ChatMessage, ChatCompletionOptions, ToolDefinition } from "./models.js";

export interface RunnerTool {
  name: string;
  execute(args: Record<string, unknown>): Promise<string>;
  definition?: ToolDefinition;
}

export interface RunnerOptions {
  provider: ModelProvider;
  model: string;
  tools: RunnerTool[];
  systemPrompt?: string;
}

export interface RunnerMessage {
  role: "user" | "assistant";
  content: string;
}

export interface Runner {
  sendMessage(content: string): Promise<RunnerMessage>;
  getHistory(): RunnerMessage[];
  clearHistory(): void;
}

export function createRunner(opts: RunnerOptions): Runner {
  const history: ChatMessage[] = [];

  if (opts.systemPrompt) {
    history.push({ role: "system", content: opts.systemPrompt });
  }

  const toolDefs: ToolDefinition[] = opts.tools
    .filter((t) => t.definition != null)
    .map((t) => t.definition!);

  const toolMap = new Map(opts.tools.map((t) => [t.name, t]));

  async function sendMessage(content: string): Promise<RunnerMessage> {
    history.push({ role: "user", content });

    let iterations = 0;
    const maxIterations = 10;

    while (iterations < maxIterations) {
      iterations++;

      const completionOpts: ChatCompletionOptions = {
        model: opts.model,
        messages: [...history],
        tools: toolDefs.length > 0 ? toolDefs : undefined,
      };

      const result = await opts.provider.complete(completionOpts);

      if (result.finishReason === "tool_calls" && result.toolCalls?.length) {
        if (result.content) {
          history.push({ role: "assistant", content: result.content });
        }

        for (const tc of result.toolCalls) {
          const tool = toolMap.get(tc.name);
          const toolResult = tool
            ? await tool.execute(tc.arguments as Record<string, unknown>)
            : `Unknown tool: ${tc.name}`;

          history.push({
            role: "tool",
            content: toolResult,
            toolCallId: tc.id,
            name: tc.name,
          });
        }
        continue;
      }

      history.push({ role: "assistant", content: result.content });
      return { role: "assistant", content: result.content };
    }

    const fallback = "Max tool iterations reached.";
    history.push({ role: "assistant", content: fallback });
    return { role: "assistant", content: fallback };
  }

  function getHistory(): RunnerMessage[] {
    return history
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));
  }

  function clearHistory(): void {
    history.splice(0);
    if (opts.systemPrompt) {
      history.push({ role: "system", content: opts.systemPrompt });
    }
  }

  return { sendMessage, getHistory, clearHistory };
}
