import { z } from "zod";
import { SessionStateSnapshotSchema } from "./state.js";

// --- SessionCreated ---

export const SessionCreatedSchema = z.object({
  type: z.literal("SessionCreated"),
  sessionId: z.string(),
  state: SessionStateSnapshotSchema,
  timestamp: z.string().datetime(),
});

export type SessionCreated = z.infer<typeof SessionCreatedSchema>;

// --- SessionUpdated ---
// BLOCKER K2-1: state MUST use SessionStateSnapshotSchema — never z.any()

export const SessionUpdatedSchema = z.object({
  type: z.literal("SessionUpdated"),
  sessionId: z.string(),
  state: SessionStateSnapshotSchema,
  timestamp: z.string().datetime(),
});

export type SessionUpdated = z.infer<typeof SessionUpdatedSchema>;

// --- SessionDestroyed ---

export const SessionDestroyedSchema = z.object({
  type: z.literal("SessionDestroyed"),
  sessionId: z.string(),
  timestamp: z.string().datetime(),
});

export type SessionDestroyed = z.infer<typeof SessionDestroyedSchema>;

// --- JobStarted ---

export const JobStartedSchema = z.object({
  type: z.literal("JobStarted"),
  jobId: z.string(),
  sessionId: z.string(),
  toolName: z.string(),
  timestamp: z.string().datetime(),
});

export type JobStarted = z.infer<typeof JobStartedSchema>;

// --- JobCompleteEvent ---

export const JobCompleteEventSchema = z.object({
  type: z.literal("JobComplete"),
  jobId: z.string(),
  sessionId: z.string(),
  successful: z.boolean(),
  result: z.unknown().optional(),
  error: z.string().optional(),
  timestamp: z.string().datetime(),
});

export type JobCompleteEvent = z.infer<typeof JobCompleteEventSchema>;

// --- Discriminated Union ---

export const AgentEventSchema = z.discriminatedUnion("type", [
  SessionCreatedSchema,
  SessionUpdatedSchema,
  SessionDestroyedSchema,
  JobStartedSchema,
  JobCompleteEventSchema,
]);

export type AgentEvent = z.infer<typeof AgentEventSchema>;

// --- EventStream ---

export type EventStream = AsyncIterable<AgentEvent>;
