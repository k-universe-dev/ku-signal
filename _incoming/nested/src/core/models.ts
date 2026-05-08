// ARCHITECTURE RULE: Type-only file.
// Zero imports from openai, @anthropic-ai/sdk, or any provider SDK.
// Provider implementations go in src/core/models.impl.ts or src/providers/.

// --- ChatMessage ---

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  toolCallId?: string;
  name?: string;
}

// --- ChatCompletionOptions ---

export interface ChatCompletionOptions {
  model: string;
  messages: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  stopSequences?: string[];
  stream?: boolean;
  tools?: ToolDefinition[];
}

// --- ToolDefinition ---

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>; // JSON Schema object
}

// --- ToolCall ---

export interface ToolCall {
  id: string;
  name: string;
  arguments: unknown;
}

// --- ChatCompletionResult ---

export interface ChatCompletionResult {
  id: string;
  model: string;
  content: string;
  toolCalls?: ToolCall[];
  finishReason: "stop" | "length" | "tool_calls" | "content_filter" | "error";
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// --- ModelProvider ---

export interface ModelProvider {
  readonly name: string;
  readonly supportedModels: string[];
  complete(options: ChatCompletionOptions): Promise<ChatCompletionResult>;
  stream?(options: ChatCompletionOptions): AsyncIterable<ChatCompletionResult>;
}
