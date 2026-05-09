import OpenAI from "openai";
import type {
  ModelProvider,
  ChatCompletionOptions,
  ChatCompletionResult,
} from "../../core/models.js";

export interface OpenAICompatProviderOptions {
  name: string;
  baseUrl: string;
  models: string[];
  apiKey?: string;
  oauthToken?: string;
}

export function createOpenAICompatProvider(
  opts: OpenAICompatProviderOptions
): ModelProvider {
  const authToken = opts.oauthToken ?? opts.apiKey ?? "no-key";

  const client = new OpenAI({
    apiKey: authToken,
    baseURL: opts.baseUrl,
    defaultHeaders: opts.oauthToken
      ? { Authorization: `Bearer ${opts.oauthToken}` }
      : undefined,
  });

  async function complete(options: ChatCompletionOptions): Promise<ChatCompletionResult> {
    const response = await client.chat.completions.create({
      model: options.model,
      max_tokens: options.maxTokens,
      temperature: options.temperature,
      messages: options.messages.map((m) => ({
        role: m.role as "system" | "user" | "assistant",
        content: m.content,
      })),
      tools: options.tools?.map((t) => ({
        type: "function" as const,
        function: {
          name: t.name,
          description: t.description,
          parameters: t.parameters,
        },
      })),
    });

    const choice = response.choices[0];
    const toolCalls = choice.message.tool_calls?.map((tc) => ({
      id: tc.id,
      name: tc.function.name,
      arguments: JSON.parse(tc.function.arguments),
    }));

    return {
      id: response.id,
      model: response.model,
      content: choice.message.content ?? "",
      toolCalls,
      finishReason:
        choice.finish_reason === "tool_calls" ? "tool_calls"
        : choice.finish_reason === "length" ? "length"
        : "stop",
      usage: {
        promptTokens: response.usage?.prompt_tokens ?? 0,
        completionTokens: response.usage?.completion_tokens ?? 0,
        totalTokens: response.usage?.total_tokens ?? 0,
      },
    };
  }

  return { name: opts.name, supportedModels: opts.models, complete };
}
