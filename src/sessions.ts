import { readFile, writeFile, mkdir, readdir } from "fs/promises";
import { join } from "path";
import { homedir } from "os";
import { z } from "zod";

const SessionFileSchema = z.object({
  id: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  model: z.string(),
  provider: z.string(),
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string(),
    })
  ),
});

export type SessionFile = z.infer<typeof SessionFileSchema>;

function sessionsDir(): string {
  return join(homedir(), "AppData", "Roaming", "ku-signal", "sessions");
}

export function newSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function saveSession(session: SessionFile): Promise<void> {
  const dir = sessionsDir();
  await mkdir(dir, { recursive: true });
  const path = join(dir, `${session.id}.json`);
  await writeFile(path, JSON.stringify(session, null, 2), "utf8");
}

export async function loadSession(id: string): Promise<SessionFile | null> {
  const path = join(sessionsDir(), `${id}.json`);
  try {
    const raw = await readFile(path, "utf8");
    return SessionFileSchema.parse(JSON.parse(raw));
  } catch {
    return null;
  }
}

export async function listSessions(): Promise<
  { id: string; updatedAt: string; model: string; provider: string }[]
> {
  const dir = sessionsDir();
  try {
    const files = await readdir(dir);
    const sessions = await Promise.all(
      files
        .filter((f) => f.endsWith(".json"))
        .map(async (f) => {
          const raw = await readFile(join(dir, f), "utf8").catch(() => null);
          if (!raw) return null;
          try {
            const parsed = SessionFileSchema.parse(JSON.parse(raw));
            return {
              id: parsed.id,
              updatedAt: parsed.updatedAt,
              model: parsed.model,
              provider: parsed.provider,
            };
          } catch {
            return null;
          }
        })
    );
    return sessions.filter((s): s is NonNullable<typeof s> => s !== null);
  } catch {
    return [];
  }
}
