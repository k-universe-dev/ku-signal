#!/usr/bin/env bash
set -euo pipefail

REPO="k-universe-dev/ku-signal"
BINARY="ku-signal"
INSTALL_DIR="/usr/local/bin"
VERSION="${KU_SIGNAL_VERSION:-latest}"

# Detect OS and arch
OS="$(uname -s | tr '[:upper:]' '[:lower:]')"
ARCH="$(uname -m)"

case "$ARCH" in
  x86_64)  ARCH="amd64" ;;
  aarch64|arm64) ARCH="arm64" ;;
  *)
    echo "Unsupported architecture: $ARCH" >&2
    exit 1
    ;;
esac

case "$OS" in
  linux|darwin) ;;
  *)
    echo "Unsupported OS: $OS. On Windows, use: bun install -g @k-universe/signal" >&2
    exit 1
    ;;
esac

# Resolve version
if [ "$VERSION" = "latest" ]; then
  VERSION="$(curl -fsSL "https://api.github.com/repos/${REPO}/releases/latest" | grep '"tag_name"' | sed 's/.*"tag_name": "v\([^"]*\)".*/\1/')"
fi

ARCHIVE_NAME="${BINARY}_${VERSION}_${OS}_${ARCH}.tar.gz"
URL="https://github.com/${REPO}/releases/download/v${VERSION}/${ARCHIVE_NAME}"

echo "Installing ku-signal v${VERSION} (${OS}/${ARCH})..."

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

curl -fsSL "$URL" -o "$TMP/${ARCHIVE_NAME}"
tar -xzf "$TMP/${ARCHIVE_NAME}" -C "$TMP"

# Install — use sudo if needed
if [ -w "$INSTALL_DIR" ]; then
  install -m 755 "$TMP/${BINARY}" "${INSTALL_DIR}/${BINARY}"
else
  sudo install -m 755 "$TMP/${BINARY}" "${INSTALL_DIR}/${BINARY}"
fi

echo "Installed: $(command -v ku-signal)"
ku-signal --version
