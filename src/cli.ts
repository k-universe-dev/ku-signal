import { Command } from "commander";
import { loadConfig, setApiKey, setBaseUrl, addCustomProvider } from "./config.js";
import { createAnthropicProvider } from "./providers/anthropic/index.js";
import { createOpenAIProvider } from "./providers/openai/index.js";
import { createRunner } from "./core/runner.js";
import { allTools } from "./tools/index.js";
import type { RunnerTool } from "./core/runner.js";
import { loadRepoContext } from "./context.js";
import { runByteInit } from "./init.js";
import { ProviderRegistry } from "./providers/registry.js";
import { createOpenAICompatProvider } from "./providers/openai-compat/index.js";
import { wrapWithPermission } from "./permissions.js";
import type { RequestPermission } from "./permissions.js";

function buildRegistry(cfg: ReturnType<typeof loadConfig>): ProviderRegistry {
  const registry = new ProviderRegistry();

  registry.register("anthropic", () =>
    createAnthropicProvider({
      apiKey: cfg.providers.anthropic?.apiKey ?? process.env["ANTHROPIC_API_KEY"] ?? "",
    })
  );

  registry.register("openai", () =>
    createOpenAIProvider({
      apiKey: cfg.providers.openai?.apiKey ?? process.env["OPENAI_API_KEY"] ?? "",
      baseUrl: cfg.providers.openai?.baseUrl,
    })
  );

  registry.register("lmstudio", () =>
    createOpenAICompatProvider({
      name: "lmstudio",
      baseUrl: cfg.providers.lmstudio?.baseUrl ?? "http://localhost:19735/v1",
      apiKey: "lm-studio",
      models: ["qwen3vl-32b", "gemma-3-27b", "codestral-22b"],
    })
  );

  for (const cp of cfg.customProviders ?? []) {
    registry.register(cp.name, () =>
      createOpenAICompatProvider({
        name: cp.name,
        baseUrl: cp.baseUrl,
        apiKey: cp.apiKey,
        oauthToken: cp.oauthToken,
        models: cp.models,
      })
    );
  }

  return registry;
}

const program = new Command();

program
  .name("ku-signal")
  .description("KU-Signal — K-Universe agent coordination engine")
  .version("0.1.0");

program
  .command("config")
  .description("Configure ku-signal settings")
  .option("--set-anthropic-key <key>", "Set Anthropic API key")
  .option("--set-openai-key <key>", "Set OpenAI API key")
  .option("--set-lmstudio-url <url>", "Set LM Studio base URL")
  .action((opts: { setAnthropicKey?: string; setOpenaiKey?: string; setLmstudioUrl?: string }) => {
    if (opts.setAnthropicKey) {
      setApiKey("anthropic", opts.setAnthropicKey);
      process.stdout.write("Anthropic API key saved.\n");
    }
    if (opts.setOpenaiKey) {
      setApiKey("openai", opts.setOpenaiKey);
      process.stdout.write("OpenAI API key saved.\n");
    }
    if (opts.setLmstudioUrl) {
      setBaseUrl(opts.setLmstudioUrl);
      process.stdout.write("LM Studio URL saved.\n");
    }
  });

program
  .command("provider:add")
  .description("Add or update a custom OpenAI-compatible provider")
  .requiredOption("--name <name>", "Provider name (used with --provider flag)")
  .requiredOption("--base-url <url>", "OpenAI-compatible API base URL")
  .requiredOption("--models <models>", "Comma-separated list of model names")
  .option("--api-key <key>", "API key")
  .option("--oauth-token <token>", "OAuth bearer token")
  .action((opts: {
    name: string;
    baseUrl: string;
    models: string;
    apiKey?: string;
    oauthToken?: string;
  }) => {
    addCustomProvider({
      name: opts.name,
      baseUrl: opts.baseUrl,
      apiKey: opts.apiKey,
      oauthToken: opts.oauthToken,
      models: opts.models.split(",").map((m) => m.trim()),
    });
    process.stdout.write(`Provider "${opts.name}" saved.\n`);
    process.stdout.write(`Use: ku-signal --provider ${opts.name} --model ${opts.models.split(",")[0].trim()}\n`);
  });

program
  .command("init")
  .description("Initialize BYTE.md in the current project directory")
  .action(async () => {
    await runByteInit(process.cwd());
  });

program
  .argument("[prompt]", "One-shot prompt (omit to enter interactive TUI)")
  .option("-m, --model <model>", "Model to use")
  .option("-p, --print", "Print mode: output raw text, no TUI")
  .option("--provider <provider>", "Provider: anthropic | openai | lmstudio")
  .action(async (prompt: string | undefined, opts: { model?: string; print?: boolean; provider?: string }) => {
    const cfg = loadConfig();
    const model = opts.model ?? cfg.defaultModel;
    const providerName = opts.provider ?? cfg.defaultProvider;

    const registry = buildRegistry(cfg);
    const provider = registry.resolve(providerName);

    // Mutable ref — App registers its real callback on mount; fallback auto-allows (safe for print mode)
    const permissionRef: { current: RequestPermission } = {
      current: async () => "yes",
    };
    const requestPermission: RequestPermission = (tool, summary) =>
      permissionRef.current(tool, summary);

    // Wrap destructive tools (file_write, bash) with permission gate
    const guardedTools = wrapWithPermission(allTools, requestPermission, cfg);

    const runnerTools: RunnerTool[] = guardedTools.map((t) => ({
      name: t.definition.name,
      execute: t.execute.bind(t),
      definition: t.definition,
    }));

    const repoContext = await loadRepoContext(process.cwd());

    const systemPromptParts = [
      "You are KU-Signal, a K-Universe agent coordination engine. Help the user with coding tasks. Be concise and direct.",
    ];
    if (repoContext) {
      systemPromptParts.push("\n\n" + repoContext);
    }
    const systemPrompt = systemPromptParts.join("");

    const runner = createRunner({
      provider,
      model,
      tools: runnerTools,
      systemPrompt,
    });

    if (prompt) {
      const result = await runner.sendMessage(prompt);
      process.stdout.write(result.content + "\n");
      return;
    }

    const { startTUI } = await import("./adapters/tui.js");
    await startTUI({
      runner,
      model,
      providerName,
      setPermissionCallback: (cb) => {
        permissionRef.current = cb;
      },
    });
  });

program.parseAsync(process.argv).catch((err: Error) => {
  process.stderr.write(`Error: ${err.message}\n`);
  process.exit(1);
});
