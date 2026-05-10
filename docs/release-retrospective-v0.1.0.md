# ku-signal v0.1.0 Release Retrospective

> Released: 2026-05-09 | Repo: k-universe-dev/ku-signal

## Overview

v0.1.0 took 3 CI runs to ship. Run 1 failed on a GoReleaser schema mismatch from a stale Plan 004 spec. Run 2 migrated to Bun cross-compilation but hit a missing optional peer dep that Bun's bundler refused to skip. Run 3 succeeded after stubbing the missing module. A post-release audit uncovered a silent npm publish failure on every run due to a missing secret — `@ku/signal` was never actually published to npm.

---

## Run #1 — GoReleaser Config Error (25611112398)

### What happened

The release workflow ran GoReleaser and exited immediately with code 1. No binaries were built.

### Root cause

`.goreleaser.yml` contained a `prebuilt:` field nested under the `builds:` entry. GoReleaser v2 does not recognize `prebuilt` as a valid field in `config.Build`. The config was sourced from a Plan 004 spec written against the GoReleaser v1 schema.

```
yaml: unmarshal errors:
  line 24: field prebuilt not found in type config.Build
```

Additional noise (not the failure cause): go.sum cache miss (not a Go project), Node.js 20 deprecation warnings across `actions/checkout@v4`, `setup-go@v5`, and `goreleaser-action@v6`.

### Fix applied

Abandoned GoReleaser entirely. Rewrote the release workflow to use Bun cross-compilation + `gh` CLI for release asset upload (commit: "ci: rewrite release workflow — replace GoReleaser with Bun + gh CLI").

---

## Run #2 — Bun Bundler: react-devtools-core (25611206564)

### What happened

`scripts/build-binaries.sh` failed with exit code 1 during the "Build cross-platform binaries" step. This was the first run after the GoReleaser-to-Bun migration.

### Root cause

Bun's bundler attempted to resolve `react-devtools-core` — an optional peer dependency of `ink` (the React-for-CLI library). The import lives in `ink`'s `devtools.js` shim, active only when React DevTools are connected. It is not listed in `dependencies`, only in ink's optional peer deps. Bun does not skip missing optional imports at bundle time.

```
error: Could not resolve: "react-devtools-core". Maybe you need to "bun install"?
    at /home/runner/work/ku-signal/ku-signal/node_modules/ink/build/devtools.js:6:22
```

### Fix applied

Stubbed `react-devtools-core` with a minimal no-op module so Bun can resolve the import at bundle time without pulling in the real devtools package (commit: "ci: stub react-devtools-core for Bun cross-compilation").

---

## Run #3 — Success (25611274405)

All 5 cross-platform binary targets built and uploaded to the GitHub Release. The stub resolved the only blocker. No other issues surfaced during the build.

---

## Audit Findings

### Critical

**1. NPM_TOKEN secret is absent — npm publish silently fails on every release.**

`gh secret list` returns an empty array. `@ku/signal` returns 404 on npm — the package has never been published. The workflow has `continue-on-error: true` on the publish step, so CI reports green regardless of auth failure.

**2. `prepublishOnly` calls `pnpm` — not installed in CI.**

The script invokes `pnpm`, but CI only has `bun`. This also fails silently due to `continue-on-error: true`.

### Warnings

- `react-devtools-core` stub writes directly into `node_modules/` at build time and is not version-controlled. This is fragile — any clean install before bundling will drop the stub.
- Darwin cross-compilation runs on `ubuntu-latest`. Works now, but will break if any native module is added.
- Re-pushing an existing tag after binaries are built causes `gh release create` to error on the existing release — assets will be lost.
- No lint step. Only typecheck and test run before release.

### Info

- Binaries are not minified (`--minify` flag absent).
- `bun-version: latest` is not pinned — a Bun major bump could break the build silently.
- Tags from non-main branches trigger the full release workflow.
- No `npm pack --dry-run` gate before publish.

---

## Recommended Fixes for v0.1.1

**1. Add NPM_TOKEN to repo secrets and remove `continue-on-error` from the publish step.**

```yaml
- name: Publish to npm
  env:
    NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
  run: bun publish --access public
  # no continue-on-error — let it fail visibly
```

Set the secret via: `gh secret set NPM_TOKEN --body "<token>"`

**2. Replace the `node_modules/` stub with a proper package resolution override.**

Add a stub package committed to the repo and wire it via `package.json`:

```json
// package.json
{
  "overrides": {
    "react-devtools-core": "./stubs/react-devtools-core"
  }
}
```

```js
// stubs/react-devtools-core/index.js
module.exports = {};
```

```json
// stubs/react-devtools-core/package.json
{ "name": "react-devtools-core", "version": "0.0.0", "main": "index.js" }
```

**3. Fix `prepublishOnly` to use `bun` instead of `pnpm`.**

```json
// package.json
{
  "scripts": {
    "prepublishOnly": "bun run build && bun run test"
  }
}
```

**4. Pin Bun version.**

```yaml
- uses: oven-sh/setup-bun@v2
  with:
    bun-version: "1.2.13"  # pin to current stable
```

**5. Add `npm pack --dry-run` gate before publish.**

```yaml
- name: Verify package contents
  run: bun pack --dry-run
```

**6. Restrict release trigger to main branch only.**

```yaml
on:
  push:
    tags:
      - "v*"
    branches:
      - main
```

Or use a job condition:

```yaml
jobs:
  release:
    if: github.ref == 'refs/heads/main'
```

---

## What Shipped in v0.1.0

- 5 cross-platform binaries built via Bun (linux-x64, linux-arm64, darwin-x64, darwin-arm64, win-x64)
- GitHub Release created with binary assets attached
- npm publish: **skipped** — `@ku/signal` was never published due to missing `NPM_TOKEN` secret; CI reported success due to `continue-on-error: true`
