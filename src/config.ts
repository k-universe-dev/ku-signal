import Conf from "conf";
import { z } from "zod";

export const ByteConfigSchema = z.object({
  defaultModel: z.string().min(1),
  defaultProvider: z.enum(["anthropic", "openai", "lmstudio"]),
  providers: z.object({
    anthropic: z.object({ apiKey: z.string().min(1) }).optional(),
    openai: z.object({ apiKey: z.string().min(1), baseUrl: z.string().url().optional() }).optional(),
    lmstudio: z.object({ baseUrl: z.string().url() }).optional(),
  }),
  theme: z.object({
    accentColor: z.string().default("#0066FF"),
  }).default({}),
  sessionDir: z.string().optional(),
  extensions: z.array(
    z.object({
      name: z.string().min(1),
      enabled: z.boolean().default(true),
      path: z.string().optional(),
    })
  ).default([]),
});

export type ByteConfig = z.infer<typeof ByteConfigSchema>;

export function defaultConfig(): ByteConfig {
  return {
    defaultModel: "claude-sonnet-4-6",
    defaultProvider: "anthropic",
    providers: {},
    theme: { accentColor: "#0066FF" },
    extensions: [],
  };
}

const store = new Conf<ByteConfig>({ projectName: "byte", defaults: defaultConfig() });

export function loadConfig(): ByteConfig {
  try {
    return ByteConfigSchema.parse(store.store);
  } catch {
    return defaultConfig();
  }
}

export function saveConfig(cfg: ByteConfig): void {
  const validated = ByteConfigSchema.parse(cfg);
  store.store = validated;
}

export function setApiKey(provider: "anthropic" | "openai", key: string): void {
  const cfg = loadConfig();
  if (provider === "anthropic") cfg.providers.anthropic = { apiKey: key };
  if (provider === "openai") cfg.providers.openai = { apiKey: key };
  saveConfig(cfg);
}

export function setBaseUrl(baseUrl: string): void {
  const cfg = loadConfig();
  cfg.providers.lmstudio = { baseUrl };
  saveConfig(cfg);
}
