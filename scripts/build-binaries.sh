#!/usr/bin/env bash
set -euo pipefail

# Bun cross-compile targets → output filenames

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
