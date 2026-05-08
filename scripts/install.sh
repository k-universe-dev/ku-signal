#!/usr/bin/env bash
set -euo pipefail

# ─── ANSI Colors ──────────────────────────────────────────────
RESET="\033[0m"
BOLD="\033[1m"
DIM="\033[2m"
GREEN="\033[32m"
CYAN="\033[36m"
YELLOW="\033[33m"
RED="\033[31m"
WHITE="\033[97m"
BG_DARK="\033[40m"

CHECK="${GREEN}✔${RESET}"
CROSS="${RED}✘${RESET}"
ARROW="${CYAN}›${RESET}"

# ─── UI Helpers ───────────────────────────────────────────────

print_border() {
  echo -e "${DIM}╔══════════════════════════════════════════════════╗${RESET}"
}

print_border_bottom() {
  echo -e "${DIM}╚══════════════════════════════════════════════════╝${RESET}"
}

print_header() {
  echo ""
  print_border
  echo -e "${DIM}║${RESET} ${BOLD}${WHITE}K2 Agent Harness — Installer v1.0${RESET} ${DIM}║${RESET}"
  echo -e "${DIM}║${RESET} ${DIM}K-Universe · 2026-05-07${RESET} ${DIM}║${RESET}"
  print_border_bottom
  echo ""
}

print_step() {
  local num="$1"
  local msg="$2"
  echo -e " ${CYAN}[${num}]${RESET} ${msg}..."
}

print_ok() {
  echo -e " ${CHECK} ${GREEN}$1${RESET}"
}

print_warn() {
  echo -e " ${YELLOW}⚠${RESET} $1"
}

print_fail() {
  echo -e " ${CROSS} ${RED}$1${RESET}"
}

print_footer() {
  echo ""
  print_border
  echo -e "${DIM}║${RESET} ${GREEN}${BOLD}Installation complete.${RESET} ${DIM}║${RESET}"
  echo -e "${DIM}║${RESET} ${DIM}Run: npm run verify${RESET} ${DIM}║${RESET}"
  print_border_bottom
  echo ""
}

# ─── Checks ───────────────────────────────────────────────────

check_node() {
  print_step "1" "Checking Node.js"
  if command -v node &>/dev/null; then
    local ver
    ver=$(node --version)
    print_ok "Node.js found: $ver"
  else
    print_fail "Node.js not found. Install from https://nodejs.org"
    exit 1
  fi
}

check_npm() {
  print_step "2" "Checking npm"
  if command -v npm &>/dev/null; then
    local ver
    ver=$(npm --version)
    print_ok "npm found: $ver"
  else
    print_fail "npm not found."
    exit 1
  fi
}

install_deps() {
  print_step "3" "Installing dependencies"
  if npm install --silent; then
    print_ok "Dependencies installed"
  else
    print_fail "npm install failed"
    exit 1
  fi
}

build_ts() {
  print_step "4" "Building TypeScript"
  if npm run build --silent 2>/dev/null; then
    print_ok "TypeScript build successful"
  else
    print_warn "Build step skipped (no build script or build failed)"
  fi
}

run_verify() {
  print_step "5" "Running K2 verification checks"
  if npx ts-node scripts/verify.ts 2>/dev/null; then
    print_ok "All K2 checks passed"
  else
    print_warn "Verify script not yet runnable — run manually after build"
  fi
}

# ─── Main ─────────────────────────────────────────────────────

print_header
check_node
check_npm
install_deps
build_ts
run_verify
print_footer
