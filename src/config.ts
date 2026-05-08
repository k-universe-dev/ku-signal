import Conf from "conf";
import { z } from "zod";

const ByteConfigSchema = z.object({
  defaultModel: z.string().min(1),
  defaultProvider: z.enum(["anthropic", "openai", "lmstudio"]),
  providers: z.object({
    anthropic: z.object({ apiKey: z.string() }).optional(),
    openai: z.object({ apiKey: z.string(), baseUrl: z.string().url().optional() }).optional(),
    lmstudio: z.object({ baseUrl: z.string().url() }).optional(),
  }),
  theme: z.object({
    accentColor: z.string().default("#0066FF"),
  }).default({}),
  sessionDir: z.string().optional(),
});

export type ByteConfig = z.infer<typeof ByteConfigSchema>;

export function defaultConfig(): ByteConfig {
  return {
    defaultModel: "claude-sonnet-4-6",
    defaultProvider: "anthropic",
    providers: {},
    theme: { accentColor: "#0066FF" },
  };
}

const store = new Conf<ByteConfig>({ projectName: "byte", defaults: defaultConfig() });

export function loadConfig(): ByteConfig {
  return ByteConfigSchema.parse(store.store);
}

export function saveConfig(cfg: ByteConfig): void {
  ByteConfigSchema.parse(cfg);
  store.store = cfg;
}

export function setApiKey(provider: "anthropic" | "openai", key: string): void {
  const cfg = loadConfig();
  if (provider === "anthropic") cfg.providers.anthropic = { apiKey: key };
  if (provider === "openai") cfg.providers.openai = { apiKey: key };
  saveConfig(cfg);
}
