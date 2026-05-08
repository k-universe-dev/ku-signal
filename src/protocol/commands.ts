import { z } from "zod";
import { SessionConfigSchema } from "./state.js";

// --- Base ---

export interface BaseCommand {
  protocolVersion: "1.0";
  type: string;
}

// --- CreateSessionCommand ---

export const CreateSessionCommandSchema = z.object({
  protocolVersion: z.literal("1.0"),
  type: z.literal("CreateSession"),
  config: SessionConfigSchema,
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

// --- SendMessageCommand ---

export const SendMessageCommandSchema = z.object({
  protocolVersion: z.literal("1.0"),
  type: z.literal("SendMessage"),
  sessionId: z.string(),
  content: z.string().min(1),
  role: z.enum(["user"]).default("user"),
});

export type SendMessageCommand = z.infer<typeof SendMessageCommandSchema>;

// --- Discriminated Union ---

export const CommandSchema = z.discriminatedUnion("type", [
  CreateSessionCommandSchema,
  DestroySessionCommandSchema,
  ExecuteToolCommandSchema,
  CancelJobCommandSchema,
  SendMessageCommandSchema,
]);

export type Command = z.infer<typeof CommandSchema>;
