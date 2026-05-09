# KU-Signal Plan 004 — Universal Tool Distribution

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `ku-signal` installable via a single command on every major surface — npm/bun/pnpm, curl binary, Homebrew, AUR, and all AI coding tools (Claude Code, OpenCode, Cursor, Windsurf) — with a single `git tag v*` push triggering all of it automatically.

**Architecture:** `bin/ku-signal.mjs` npm shim, Bun cross-compiled binaries for 4 platforms, GoReleaser orchestrates GitHub Release + Homebrew + AUR + deb/rpm, GitHub Actions fires on `v*` tag and also publishes to npm.

**Tech Stack:** Bun (binary compile), GoReleaser v2, GitHub Actions, npm registry (`@ku/signal`), Homebrew tap (`k-universe-dev/homebrew-tap`), AUR (`ku-signal-bin`)

**Status:** ✅ Executed 2026-05-09 — all distribution artifacts in place.

---

## Context

Before this plan: `"private": true`, no GitHub remote, no CI/CD, no install story.

After this plan: one `git tag v0.1.0 && git push --tags` ships everything.

---

## Compatible install surfaces (all work after this plan)

| Method | Command |
|---|---|
| bun | `bun install -g @ku/signal` |
| npm | `npm install -g @ku/signal` |
| pnpm | `pnpm install -g @ku/signal` |
| curl (macOS/Linux) | `curl -fsSL .../install.sh \| bash` |
| Homebrew | `brew tap k-universe-dev/tap && brew install ku-signal` |
| AUR | `paru -S ku-signal-bin` |
| Claude Code | `claude mcp add ku-signal -- npx -y @ku/signal` |
| OpenCode | `opencode mcp add ku-signal -- npx -y @ku/signal` |
| Cursor | Add `@ku/signal` to `~/.cursor/mcp.json` |
| Windsurf | Add `@ku/signal` to `~/.windsurf/mcp_config.json` |

---

## File Map

| File | Action |
|---|---|
| `package.json` | Modified — `@ku/signal`, public, `bin: ku-signal`, `files`, `publishConfig` |
| `bin/ku-signal.mjs` | Created — `#!/usr/bin/env node` shim |
| `.npmignore` | Created — excludes src/tests/docs from published package |
| `scripts/build-binaries.sh` | Created — Bun cross-compile for 4 platforms |
| `.goreleaser.yml` | Created — GitHub Release, Homebrew, AUR, deb/rpm |
| `.github/workflows/release.yml` | Created — full CI/CD on `v*` tag |
| `install.sh` | Replaced — user-facing binary downloader |
| `README.md` | Replaced — install section + MCP blocks + quick start |

---

## Task 1: Package identity — ✅ DONE

**Commit:** `ad47988 chore: rename package to @ku/signal, configure npm publish`

`package.json`: `name: "@ku/signal"`, no `private`, `bin: { "ku-signal": "./bin/ku-signal.mjs" }`, `files: ["bin/", "dist/", "README.md"]`, `publishConfig: { access: "public" }`, `prepublishOnly: "pnpm typecheck && pnpm build"`.

---

## Task 2: bin shim — ✅ DONE

**Commit:** `bff034c feat(dist): add bin/ku-signal.mjs shim entry point`

`bin/ku-signal.mjs`:
```javascript
#!/usr/bin/env node
import "../dist/cli.js";
```

---

## Task 3: .npmignore — ✅ DONE

**Commit:** `0eae776 chore: add .npmignore to trim published package to bin/ + dist/`

Excludes: `src/`, `tests/`, `docs/`, `notes/`, `scripts/`, `.github/`, `install.sh`, `tsconfig.json`, `pnpm-lock.yaml`.

---

## Task 4: Bun binary build script — ✅ DONE

**Commit:** `e4a0a09 feat(dist): add Bun cross-compile script for 4 platforms`

`scripts/build-binaries.sh` — builds:
- `dist/bins/ku-signal_linux_amd64`
- `dist/bins/ku-signal_linux_arm64`
- `dist/bins/ku-signal_darwin_amd64`
- `dist/bins/ku-signal_darwin_arm64`
- `dist/bins/ku-signal_windows_amd64.exe`

---

## Task 5: GoReleaser config — ✅ DONE

**Commit:** `7cd21b5 feat(dist): add GoReleaser config for GitHub Release, Homebrew, AUR, deb/rpm`

`.goreleaser.yml` — `prebuilt` builder, `k-universe-dev/homebrew-tap`, `ku-signal-bin` AUR, nfpm deb/rpm/apk.

---

## Task 6: GitHub Actions — ✅ DONE

**Commit:** `ceb56cc feat(ci): GitHub Actions release workflow — build, GoReleaser, npm publish`

`.github/workflows/release.yml` — trigger `v*` tags: setup-bun → install → typecheck → test → build → goreleaser → npm publish.

Secrets: `NPM_TOKEN`, `HOMEBREW_TAP_TOKEN`, `AUR_PRIVATE_KEY`.

---

## Task 7: install.sh — ✅ DONE

**Commits:** `fbb39ac` + `7c5ea56`

`install.sh` — detects OS/arch, downloads correct binary from GitHub Releases, installs to `/usr/local/bin`. Windows exits early with npm fallback message.

---

## Task 8: README — ✅ DONE

**Commit:** `c968ed9 docs: new README with install section, AI tool MCP blocks, quick start`

Full install section, all AI tool MCP blocks, quick start, K-Wire invariants, architecture table.

---

## First Release (manual prerequisites)

```bash
# 1. Add GitHub remote
git remote add origin git@github.com:k-universe-dev/ku-signal.git
git push -u origin master

# 2. Set GitHub Actions secrets:
#    NPM_TOKEN          — npmjs.com → Access Tokens → Automation
#    HOMEBREW_TAP_TOKEN — GitHub PAT with repo write on k-universe-dev/homebrew-tap
#    AUR_PRIVATE_KEY    — SSH private key for aur.archlinux.org

# 3. Tag and push — fires the full release pipeline
git tag v0.1.0 && git push --tags
```
