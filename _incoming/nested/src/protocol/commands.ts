import { z } from "zod";

// --- Base ---

export interface BaseCommand {
  protocolVersion: "1.0";
  type: string;
}

// --- CreateSessionCommand ---

export const CreateSessionCommandSchema = z.object({
  protocolVersion: z.literal("1.0"),
  type: z.literal("CreateSession"),
  config: z.object({
    modelId: z.string(),
    systemPrompt: z.string().optional(),
    tools: z.array(z.string()).optional(),
    maxTokens: z.number().int().positive().optional(),
    temperature: z.number().min(0).max(2).optional(),
    metadata: z.record(z.unknown()).optional(),
  }),
});

export type CreateSessionCommand = z.infer<typeof CreateSessionCommandSchema>;

// --- DestroySessionCommand ---

export const DestroySessionCommandSchema = z.object({
  protocolVersion: z.literal("1.0"),
  type: z.literal("DestroySession"),
  sessionId: z.string(),
});

export type DestroySessionCommand = z.infer<typeof DestroySessionCommandSchema>;

// --- ExecuteToolCommand ---

export const ExecuteToolCommandSchema = z.object({
  protocolVersion: z.literal("1.0"),
  type: z.literal("ExecuteTool"),
  sessionId: z.string(),
  toolName: z.string().min(1),
  args: z.unknown(),
});

export type ExecuteToolCommand = z.infer<typeof ExecuteToolCommandSchema>;

// --- CancelJobCommand ---

export const CancelJobCommandSchema = z.object({
  protocolVersion: z.literal("1.0"),
  type: z.literal("CancelJob"),
  jobId: z.string(),
});

export type CancelJobCommand = z.infer<typeof CancelJobCommandSchema>;

// --- Discriminated Union ---

export const CommandSchema = z.discriminatedUnion("type", [
  CreateSessionCommandSchema,
  DestroySessionCommandSchema,
  ExecuteToolCommandSchema,
  CancelJobCommandSchema,
]);

export type Command = z.infer<typeof CommandSchema>;
