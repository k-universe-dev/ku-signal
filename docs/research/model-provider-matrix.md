# Model Provider Matrix

**Date:** 2026-05-07

---

| Provider | Context Window | Cost / 1M tokens | Integration Status | Notes |
|---|---|---|---|---|
| **OpenAI** GPT-4.1 | 1M tokens | $2.00 / $8.00 | Planned | Best reasoning, highest cost |
| **Anthropic** Claude Sonnet 4.6 | 200K tokens | $3.00 / $15.00 | Planned | Best for codebase coherence |
| **Google** Gemini 3.1 Pro | 1M tokens | $1.25 / $5.00 | Planned | Best multimodal, design-to-code |
| **Google** Gemini 3.1 Flash | 1M tokens | $0.15 / $0.60 | Planned | Fast, cheap, weak reasoning |
| **Moonshot** Kimi K-Wire.5 | 256K tokens | $1.00 / $4.00 | Experimental | Strong Chinese + English |
| **Mistral** Large 2 | 128K tokens | $2.00 / $6.00 | Planned | Good European compliance |
| **DeepSeek** V3 | 64K tokens | $0.14 / $0.28 | Experimental | Cheapest, good coding |
| **Meta** Llama 4 Scout | 128K tokens | Self-hosted | Experimental | Open weights, local run |
| **Alibaba** Qwen3-Next | 262K tokens | $0.50 / $2.00 | Experimental | Strong agentic features |

---

## Integration Priority

1. **Phase 1:** OpenAI, Anthropic, Google (Gemini Pro) — highest quality, proven APIs
2. **Phase 2:** Moonshot, Mistral — regional / compliance requirements
3. **Phase 3:** DeepSeek, Qwen — cost-optimized / self-hosted options

---

## Notes

- All providers implement the `ModelProvider` interface from `src/core/models.ts`
- Provider-specific SDK imports live in `src/providers/{provider}/` only
- No provider SDK imports in `src/core/models.ts` — architecture rule enforced
