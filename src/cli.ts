import { Command } from "commander";
import { loadConfig, setApiKey, setBaseUrl } from "./config.js";
import { createAnthropicProvider } from "./providers/anthropic/index.js";
import { createOpenAIProvider } from "./providers/openai/index.js";
import { createRunner } from "./core/runner.js";
import { allTools } from "./tools/index.js";
import type { RunnerTool } from "./core/runner.js";

const program = new Command();

program
  .name("byte")
  .description("KU-BYTE — K-Universe AI coding agent")
  .version("0.1.0");

program
  .command("config")
  .description("Configure byte settings")
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
  .argument("[prompt]", "One-shot prompt (omit to enter interactive TUI)")
  .option("-m, --model <model>", "Model to use")
  .option("-p, --print", "Print mode: output raw text, no TUI")
  .option("--provider <provider>", "Provider: anthropic | openai | lmstudio")
  .action(async (prompt: string | undefined, opts: { model?: string; print?: boolean; provider?: string }) => {
    const cfg = loadConfig();
    const model = opts.model ?? cfg.defaultModel;
    const providerName = opts.provider ?? cfg.defaultProvider;

    let provider;
    if (providerName === "anthropic") {
      const key = cfg.providers.anthropic?.apiKey ?? process.env["ANTHROPIC_API_KEY"] ?? "";
      provider = createAnthropicProvider({ apiKey: key });
    } else if (providerName === "lmstudio") {
      const baseUrl = cfg.providers.lmstudio?.baseUrl ?? "http://localhost:19735/v1";
      provider = createOpenAIProvider({ apiKey: "lm-studio", baseUrl });
    } else {
      const key = cfg.providers.openai?.apiKey ?? process.env["OPENAI_API_KEY"] ?? "";
      provider = createOpenAIProvider({ apiKey: key });
    }

    const runnerTools: RunnerTool[] = allTools.map((t) => ({
      name: t.definition.name,
      execute: t.execute.bind(t),
      definition: t.definition,
    }));

    const runner = createRunner({
      provider,
      model,
      tools: runnerTools,
      systemPrompt:
        "You are BYTE, a K-Universe AI coding agent. Help the user with coding tasks. Be concise and direct.",
    });

    if (prompt) {
      const result = await runner.sendMessage(prompt);
      process.stdout.write(result.content + "\n");
      return;
    }

    const { startTUI } = await import("./adapters/tui.js");
    await startTUI({ runner, model, providerName });
  });

program.parseAsync(process.argv).catch((err: Error) => {
  process.stderr.write(`Error: ${err.message}\n`);
  process.exit(1);
});
