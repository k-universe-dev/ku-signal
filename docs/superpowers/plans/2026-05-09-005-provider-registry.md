# KU-Signal Plan 005 — Cloud Provider Registry + Universal API Compatibility

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make KU-Signal's provider layer cloud-extensible — any OpenAI-compatible API (Groq, Mistral, Together, OpenRouter, Gemini, Ollama, custom endpoints) works without touching source code, OAuth tokens are supported alongside API keys, and a registry resolves provider names at runtime.

**Architecture:** `ProviderRegistry` class maps names to factory functions. A generic `openai-compat` provider handles any OAI-compatible endpoint using the existing `openai` SDK `baseUrl` option. Config gains `customProviders[]` with OAuth fields. `defaultProvider` becomes a free string (not a locked enum). Built-in providers (anthropic, openai, lmstudio) are registered at startup. New providers are added via `ku-signal provider:add`.

**Tech Stack:** TypeScript strict, Zod (existing), `openai` SDK (existing — `baseUrl` covers all OAI-compat APIs)

**Status:** ✅ Executed 2026-05-09 — 61 tests pass, 4/4 K-Wire invariants.

---

## Context

Three problems existed before this plan:
1. `defaultProvider: z.enum(["anthropic","openai","lmstudio"])` — adding Groq required schema + CLI edits
2. Hardcoded `if/else` in `cli.ts` — edited for every new provider
3. No OAuth support — only static `apiKey` strings

---

## Compatible APIs (all work after this plan)

| Provider | Base URL |
|---|---|
| Groq | `api.groq.com/openai/v1` |
| Mistral | `api.mistral.ai/v1` |
| Together AI | `api.together.xyz/v1` |
| OpenRouter | `openrouter.ai/api/v1` |
| Gemini | `generativelanguage.googleapis.com/v1beta/openai` |
| Ollama | `localhost:11434/v1` |
| LM Studio | `localhost:19735/v1` |

---

## File Map

| File | Action |
|---|---|
| `src/providers/registry.ts` | Created — `ProviderRegistry` class |
| `src/providers/openai-compat/index.ts` | Created — generic OAI-compat provider |
| `src/config.ts` | Modified — `defaultProvider: z.string()`, `customProviders[]` |
| `src/cli.ts` | Modified — `buildRegistry(cfg)` replaces `if/else`, `provider:add` command |
| `tests/unit/registry.test.ts` | Created — 5 tests |
| `tests/unit/providers.test.ts` | Modified — 3 new OAI-compat tests |

---

## Task 1: ProviderRegistry — ✅ DONE

**Commit:** `d5b4c30 feat(providers): ProviderRegistry — register/resolve/list/hasProvider`

`src/providers/registry.ts` — `ProviderRegistry` class with `register(name, factory)`, `resolve(name)`, `list()`, `hasProvider(name)`.

5 tests: resolve registered, throws unknown, list names, override, hasProvider.

---

## Task 2: Generic OpenAI-compat provider — ✅ DONE

**Commit:** `5c5640a feat(providers): generic OpenAI-compat provider with apiKey + oauthToken support`

`src/providers/openai-compat/index.ts` — `createOpenAICompatProvider({ name, baseUrl, models, apiKey?, oauthToken? })`.

OAuth: when `oauthToken` is set, sends `Authorization: Bearer <token>` header. Falls back to `"no-key"` when neither is provided (Ollama).

3 tests: name/models passthrough, Ollama no-key, oauthToken.

---

## Task 3: Config schema extension — ✅ DONE

**Commit:** `da4c678 feat(config): open defaultProvider to any string, add customProviders[] with OAuth fields`

Changes to `src/config.ts`:
- `defaultProvider: z.string().min(1)` (was `z.enum(...)`)
- `customProviders: z.array(z.object({ name, baseUrl, apiKey?, oauthToken?, oauthExpiresAt?, models[] })).default([])`
- `addCustomProvider(opts)` — upserts by name

---

## Task 4: CLI integration — ✅ DONE

**Commit:** `8e431e5 feat(cli): provider registry replaces if/else + add provider:add command`

`buildRegistry(cfg)` registers anthropic, openai, lmstudio, and all `cfg.customProviders`.

`provider:add` subcommand:
```bash
ku-signal provider:add \
  --name groq \
  --base-url https://api.groq.com/openai/v1 \
  --models llama-3-70b-8192,mixtral-8x7b-32768 \
  --api-key $GROQ_API_KEY
```

---

## Verification

```bash
pnpm test            # 61 pass
pnpm typecheck       # 0 errors
npx tsx scripts/verify.ts   # 4/4 K-Wire PASS
```
