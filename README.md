# KU-Signal

**K-Universe agent coordination engine.** Typed K-Wire protocol, headless AgentCore, swappable adapters (CLI / TUI / VS Code / WebSocket).

[![npm](https://img.shields.io/npm/v/@ku/signal)](https://www.npmjs.com/package/@ku/signal)

---

## Install

### npm / pnpm / bun (recommended)

```bash
bun install -g @ku/signal
npm install -g @ku/signal
pnpm install -g @ku/signal
```

### curl (binary — macOS / Linux)

```bash
curl -fsSL https://raw.githubusercontent.com/k-universe-dev/ku-signal/main/install.sh | bash
```

### Homebrew (macOS / Linux)

```bash
brew tap k-universe-dev/tap
brew install ku-signal
```

### AUR (Arch Linux)

```bash
paru -S ku-signal-bin
# or
yay -S ku-signal-bin
```

### Windows

```powershell
bun install -g @ku/signal
```

---

## AI Coding Tools

### Claude Code

```bash
claude mcp add ku-signal -- npx -y @ku/signal
```

### OpenCode

```bash
opencode mcp add ku-signal -- npx -y @ku/signal
```

### Cursor

Add to `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "ku-signal": {
      "command": "npx",
      "args": ["-y", "@ku/signal"]
    }
  }
}
```

### Windsurf

Add to `~/.windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "ku-signal": {
      "command": "npx",
      "args": ["-y", "@ku/signal"]
    }
  }
}
```

### All tools at once (agent-add)

```bash
npx -y agent-add \
  --mcp '{"server":{"command":"npx","args":["-y","@ku/signal"]}}' \
  --target cursor,claude,opencode,windsurf
```

---

## Quick start

```bash
ku-signal --help
ku-signal init          # create BYTE.md in current project
ku-signal config --set-anthropic-key sk-...
ku-signal               # launch TUI
ku-signal -p "Hello"    # one-shot print mode
```

---

## K-Wire Invariants

```bash
npx tsx scripts/verify.ts
```

Expected: 4/4 PASS — KWire-1, KWire-2, KWire-3, ARCH.

---

## Architecture

| Path | Purpose |
|---|---|
| `src/protocol/` | Typed Zod schemas — K-Wire protocol |
| `src/core/` | Headless AgentCore + Runner |
| `src/adapters/` | CLI, socket, TUI (Ink), VS Code |
| `src/providers/` | Anthropic, OpenAI/LM Studio |
| `src/tools/` | file_read, file_write, bash, search |
| `src/extensions/` | Extension manifest schema + discovery |

## License

MIT — K-Universe Dev
