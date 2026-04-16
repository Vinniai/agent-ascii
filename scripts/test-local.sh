#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

export TERM="${TERM:-xterm-256color}"
export COLORTERM="${COLORTERM:-truecolor}"

if ! command -v go >/dev/null 2>&1; then
  echo "go is required for local testing from a git checkout."
  exit 1
fi

BIN_NAME="agent-ascii"
if [[ "${OSTYPE:-}" == msys* || "${OSTYPE:-}" == cygwin* ]]; then
  BIN_NAME="agent-ascii.exe"
fi

TEMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TEMP_DIR"' EXIT

go build \
  -mod=mod \
  -ldflags "-s -w -X github.com/Vinniai/agent-ascii/internal/version.Version=local-dev" \
  -o "${TEMP_DIR}/${BIN_NAME}" \
  .

echo
echo "Rendering sample screenshots with the local binary..."
echo

AGENT_ASCII_BINARY_PATH="${TEMP_DIR}/${BIN_NAME}" node ./bin/agent-ascii.js examples/screenshots/apple-mobile.png --width 80
echo
AGENT_ASCII_BINARY_PATH="${TEMP_DIR}/${BIN_NAME}" node ./bin/agent-ascii.js examples/screenshots/google-desktop.png --width 100
echo
AGENT_ASCII_BINARY_PATH="${TEMP_DIR}/${BIN_NAME}" node ./bin/agent-ascii.js examples/screenshots/google-desktop.png --layout
echo
AGENT_ASCII_BINARY_PATH="${TEMP_DIR}/${BIN_NAME}" node ./bin/agent-ascii.js examples/screenshots/x-mobile.png --width 80 --grayscale
