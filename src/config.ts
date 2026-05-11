import Conf from "conf";
import { z } from "zod";

const PermissionEntrySchema = z.object({
  tool: z.string().min(1),
  decision: z.literal("always"),
});

export { PermissionEntrySchema };
export type PermissionEntry = z.infer<typeof PermissionEntrySchema>;

export const ByteConfigSchema = z.object({
  defaultModel: z.string().min(1),
  defaultProvider: z.string().min(1),
  providers: z.object({
    anthropic: z.object({ apiKey: z.string().min(1) }).optional(),
    openai: z.object({ apiKey: z.string().min(1), baseUrl: z.string().url().optional() }).optional(),
    lmstudio: z.object({ baseUrl: z.string().url() }).optional(),
  }),
  customProviders: z.array(
    z.object({
      name: z.string().min(1),
      baseUrl: z.string().url(),
      apiKey: z.string().optional(),
      oauthToken: z.string().optional(),
      oauthExpiresAt: z.number().optional(),
      models: z.array(z.string().min(1)).min(1),
    })
  ).default([]),
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
  permissions: z.array(PermissionEntrySchema).default([]),
});

export type ByteConfig = z.infer<typeof ByteConfigSchema>;

export function defaultConfig(): ByteConfig {
  return {
    defaultModel: "claude-sonnet-4-6",
    defaultProvider: "anthropic",
    providers: {},
    customProviders: [],
    theme: { accentColor: "#0066FF" },
    extensions: [],
    permissions: [],
  };
}

const store = new Conf<ByteConfig>({ projectName: "ku-signal", defaults: defaultConfig() });

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

export function addCustomProvider(opts: {
  name: string;
  baseUrl: string;
  apiKey?: string;
  oauthToken?: string;
  models: string[];
}): void {
  const cfg = loadConfig();
  const existing = cfg.customProviders.findIndex((p) => p.name === opts.name);
  const entry = {
    name: opts.name,
    baseUrl: opts.baseUrl,
    apiKey: opts.apiKey,
    oauthToken: opts.oauthToken,
    models: opts.models,
  };
  if (existing >= 0) {
    cfg.customProviders[existing] = entry;
  } else {
    cfg.customProviders.push(entry);
  }
  saveConfig(cfg);
}
