import type {
  SessionId,
  JobId,
  SessionState,
  SessionConfig,
} from "../protocol/state.js";
import type { Command } from "../protocol/commands.js";
import type { EventStream, AgentEvent } from "../protocol/events.js";

// --- AgentConfig ---

export interface AgentConfig {
  sessionTimeoutMs?: number;
  maxConcurrentJobs?: number;
  toolRegistry?: Record<string, (args: unknown) => Promise<unknown>>;
  onEvent?: (event: unknown) => void;
}

// --- AgentCore Interface ---
// BLOCKER K2-2: All 5 methods required exactly as specified.

export interface AgentCore {
  /**
   * Create a new session with the given config.
   * Emits SessionCreated.
   */
  createSession(config: SessionConfig): Promise<SessionState>;

  /**
   * Destroy a session by ID. Idempotent — safe to call on already-destroyed sessions.
   * Emits SessionDestroyed.
   */
  destroySession(sessionId: SessionId): Promise<void>;

  /**
   * Execute a command and return an async event stream.
   */
  executeCommand(cmd: Command): Promise<EventStream>;

  /**
   * Invoke a registered tool by name. Returns the assigned jobId.
   * Emits JobStarted, then JobCompleteEvent.
   */
  invokeTool(toolName: string, args: unknown): Promise<{ jobId: JobId }>;

  /**
   * Cancel a running job. Idempotent.
   * Emits JobCompleteEvent with successful: false.
   */
  cancelJob(jobId: JobId): Promise<void>;
}

// --- createAgentCore stub ---

export function createAgentCore(config: AgentConfig): AgentCore {
  const sessions = new Map<string, SessionState>();
  const jobs = new Map<string, { cancelled: boolean }>();

  function generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }

  async function createSession(sessionConfig: SessionConfig): Promise<SessionState> {
    const sessionId = generateId("session") as SessionId;
    const now = new Date().toISOString();
    const state: SessionState = {
      sessionId,
      status: "idle",
      activeJobId: null,
      toolsRegistered: sessionConfig.tools ?? [],
      turnCount: 0,
      lastUpdatedAt: now,
      metadata: sessionConfig.metadata,
      config: sessionConfig,
      createdAt: now,
    };
    sessions.set(sessionId, state);
    config.onEvent?.({
      type: "SessionCreated",
      sessionId,
      state,
      timestamp: now,
    });
    return state;
  }

  async function destroySession(sessionId: SessionId): Promise<void> {
    if (!sessions.has(sessionId)) return; // idempotent
    sessions.delete(sessionId);
    config.onEvent?.({
      type: "SessionDestroyed",
      sessionId,
      timestamp: new Date().toISOString(),
    });
  }

  async function* streamEvents(): AsyncGenerator<AgentEvent> {
    // stub: real impl yields events from internal emitter
  }

  async function executeCommand(cmd: Command): Promise<EventStream> {
    switch (cmd.type) {
      case "CreateSession":
        await createSession(cmd.config);
        break;
      case "DestroySession":
        await destroySession(cmd.sessionId as SessionId);
        break;
      case "ExecuteTool":
        await invokeTool(cmd.toolName, cmd.args);
        break;
      case "CancelJob":
        await cancelJob(cmd.jobId as JobId);
        break;
    }
    return streamEvents();
  }

  async function invokeTool(toolName: string, args: unknown): Promise<{ jobId: JobId }> {
    const jobId = generateId("job") as JobId;
    jobs.set(jobId, { cancelled: false });
    const now = new Date().toISOString();

    config.onEvent?.({
      type: "JobStarted",
      jobId,
      sessionId: "unknown",
      toolName,
      timestamp: now,
    });

    // Execute async — fire and forget in stub
    (async () => {
      const jobState = jobs.get(jobId);
      if (!jobState || jobState.cancelled) {
        config.onEvent?.({
          type: "JobComplete",
          jobId,
          sessionId: "unknown",
          successful: false,
          error: "Job was cancelled before execution",
          timestamp: new Date().toISOString(),
        });
        return;
      }

      try {
        const handler = config.toolRegistry?.[toolName];
        const result = handler ? await handler(args) : undefined;
        config.onEvent?.({
          type: "JobComplete",
          jobId,
          sessionId: "unknown",
          successful: true,
          result,
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        config.onEvent?.({
          type: "JobComplete",
          jobId,
          sessionId: "unknown",
          successful: false,
          error: err instanceof Error ? err.message : String(err),
          timestamp: new Date().toISOString(),
        });
      } finally {
        jobs.delete(jobId);
      }
    })();

    return { jobId };
  }

  async function cancelJob(jobId: JobId): Promise<void> {
    const jobState = jobs.get(jobId);
    if (!jobState) return; // idempotent — job already done or never existed
    jobState.cancelled = true;
    config.onEvent?.({
      type: "JobComplete",
      jobId,
      sessionId: "unknown",
      successful: false,
      error: "Cancelled by client",
      timestamp: new Date().toISOString(),
    });
  }

  return {
    createSession,
    destroySession,
    executeCommand,
    invokeTool,
    cancelJob,
  };
}
