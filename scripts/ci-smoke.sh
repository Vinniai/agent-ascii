#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# Deterministic single-file saves (CI env would otherwise default --save-txt-history on).
unset CI || true

export TERM="${TERM:-xterm-256color}"
export COLORTERM="${COLORTERM:-truecolor}"

if ! command -v go >/dev/null 2>&1; then
  echo "go is required for smoke tests."
  exit 1
fi

mkdir -p vendor .agent-ascii-out-ci

BIN_NAME="agent-ascii"
if [[ "${OSTYPE:-}" == msys* || "${OSTYPE:-}" == cygwin* ]]; then
  BIN_NAME="agent-ascii.exe"
fi

TEMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TEMP_DIR"' EXIT

go build \
  -mod=mod \
  -ldflags "-s -w -X github.com/Vinniai/agent-ascii/internal/version.Version=ci-smoke" \
  -o "${TEMP_DIR}/${BIN_NAME}" \
  .

AGENT_ASCII_BINARY_PATH="${TEMP_DIR}/${BIN_NAME}" node ./bin/agent-ascii.js examples/screenshots/apple-mobile.png \
  --width 80 \
  --save-txt .agent-ascii-out-ci \
  --only-save

AGENT_ASCII_BINARY_PATH="${TEMP_DIR}/${BIN_NAME}" node ./bin/agent-ascii.js examples/screenshots/google-desktop.png \
  --width 100 \
  --grayscale \
  --save-txt .agent-ascii-out-ci \
  --only-save

cp examples/screenshots/google-desktop.png "${TEMP_DIR}/layout-google.png"
AGENT_ASCII_BINARY_PATH="${TEMP_DIR}/${BIN_NAME}" node ./bin/agent-ascii.js "${TEMP_DIR}/layout-google.png" \
  --layout \
  --save-txt .agent-ascii-out-ci \
  --only-save

cat examples/screenshots/x-mobile.png | \
  AGENT_ASCII_BINARY_PATH="${TEMP_DIR}/${BIN_NAME}" node ./bin/agent-ascii.js - \
    --width 72 \
    --save-txt .agent-ascii-out-ci \
    --only-save

test -f .agent-ascii-out-ci/apple-mobile-ascii-art.txt
test -f .agent-ascii-out-ci/google-desktop-ascii-art.txt
test -f .agent-ascii-out-ci/layout-google-ascii-art.txt
test -f .agent-ascii-out-ci/piped-img-ascii-art.txt

AGENT_ASCII_BINARY_PATH="${TEMP_DIR}/${BIN_NAME}" node ./bin/agent-ascii.js diff \
  examples/screenshots/apple-mobile.png \
  examples/screenshots/apple-mobile.png \
  --width 40

AGENT_ASCII_BINARY_PATH="${TEMP_DIR}/${BIN_NAME}" node ./bin/agent-ascii.js diff --text \
  .agent-ascii-out-ci/apple-mobile-ascii-art.txt \
  .agent-ascii-out-ci/apple-mobile-ascii-art.txt
