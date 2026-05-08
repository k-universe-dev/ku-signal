import Anthropic from "@anthropic-ai/sdk";
import type {
  ModelProvider,
  ChatCompletionOptions,
  ChatCompletionResult,
} from "../../core/models.js";

export interface AnthropicProviderOptions {
  apiKey: string;
  baseUrl?: string;
}

export function createAnthropicProvider(opts: AnthropicProviderOptions): ModelProvider {
  const client = new Anthropic({ apiKey: opts.apiKey, baseURL: opts.baseUrl });

  const supportedModels = [
    "claude-sonnet-4-6",
    "claude-opus-4-7",
    "claude-haiku-4-5-20251001",
  ];

  async function complete(options: ChatCompletionOptions): Promise<ChatCompletionResult> {
    const systemMsg = options.messages.find((m) => m.role === "system");
    const userMessages = options.messages.filter((m) => m.role !== "system");

    const response = await client.messages.create({
      model: options.model,
      max_tokens: options.maxTokens ?? 8096,
      system: systemMsg?.content,
      messages: userMessages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      tools: options.tools?.map((t) => ({
        name: t.name,
        description: t.description,
        input_schema: t.parameters as Anthropic.Tool.InputSchema,
      })),
    });

    const textContent = response.content.find((c) => c.type === "text");
    const toolUseContent = response.content.filter((c) => c.type === "tool_use");

    return {
      id: response.id,
      model: response.model,
      content: textContent?.type === "text" ? textContent.text : "",
      toolCalls: toolUseContent.map((tc) =>
        tc.type === "tool_use"
          ? { id: tc.id, name: tc.name, arguments: tc.input as Record<string, unknown> }
          : { id: "", name: "", arguments: {} }
      ),
      finishReason:
        response.stop_reason === "tool_use"
          ? "tool_calls"
          : response.stop_reason === "max_tokens"
          ? "length"
          : "stop",
      usage: {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      },
    };
  }

  return { name: "anthropic", supportedModels, complete };
}
