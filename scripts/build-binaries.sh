#!/usr/bin/env bash
set -euo pipefail

# Bun cross-compile targets → output filenames

# Stub react-devtools-core — Ink imports it unconditionally but it's only used
# for the React DevTools browser extension in development. Not needed in
# production binaries. Creating a minimal stub avoids a missing-module error
# during Bun cross-compilation without pulling in the full package.
mkdir -p node_modules/react-devtools-core
printf '{"name":"react-devtools-core","version":"0.0.0","main":"index.js"}\n' \
  > node_modules/react-devtools-core/package.json
printf 'module.exports = { connectToDevTools: () => {}, activate: () => {} };\n' \
  > node_modules/react-devtools-core/index.js

mkdir -p dist/bins

echo "Building ku-signal binaries..."

bun build src/cli.ts --compile \
  --target=bun-linux-x64-musl \
  --outfile=dist/bins/ku-signal_linux_amd64

bun build src/cli.ts --compile \
  --target=bun-linux-aarch64-musl \
  --outfile=dist/bins/ku-signal_linux_arm64

bun build src/cli.ts --compile \
  --target=bun-darwin-x64 \
  --outfile=dist/bins/ku-signal_darwin_amd64

bun build src/cli.ts --compile \
  --target=bun-darwin-arm64 \
  --outfile=dist/bins/ku-signal_darwin_arm64

bun build src/cli.ts --compile \
  --target=bun-windows-x64 \
  --outfile=dist/bins/ku-signal_windows_amd64.exe

echo "Done. Binaries in dist/bins/:"
ls -lh dist/bins/
