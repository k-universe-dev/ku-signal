import { z } from "zod";

// --- Branded Types ---

declare const SessionIdBrand: unique symbol;
export type SessionId = string & { readonly [SessionIdBrand]: typeof SessionIdBrand };

declare const JobIdBrand: unique symbol;
export type JobId = string & { readonly [JobIdBrand]: typeof JobIdBrand };

export function toSessionId(raw: string): SessionId {
  return raw as SessionId;
}

export function toJobId(raw: string): JobId {
  return raw as JobId;
}

// --- SessionConfig ---

export interface SessionConfig {
  modelId: string;
  systemPrompt?: string;
  tools?: string[];
  maxTokens?: number;
  temperature?: number;
  metadata?: Record<string, unknown>;
}

// --- SessionStateSnapshot (Zod schema — used in events) ---

export const SessionStateSnapshotSchema = z.object({
  sessionId: z.string(),
  status: z.enum(["creating", "idle", "running", "destroying", "destroyed"]),
  activeJobId: z.string().nullable(),
  toolsRegistered: z.array(z.string()),
  turnCount: z.number().int().nonnegative(),
  lastUpdatedAt: z.string().datetime(),
  metadata: z.record(z.unknown()).optional(),
});

export type SessionStateSnapshot = z.infer<typeof SessionStateSnapshotSchema>;

// --- SessionState (runtime interface, superset of snapshot) ---

export interface SessionState extends SessionStateSnapshot {
  config: SessionConfig;
  createdAt: string;
}
