#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if ! command -v go >/dev/null 2>&1; then
  echo "go is required for local testing from a git checkout."
  exit 1
fi

mkdir -p vendor

BIN_NAME="agent-ascii"
if [[ "${OSTYPE:-}" == msys* || "${OSTYPE:-}" == cygwin* ]]; then
  BIN_NAME="agent-ascii.exe"
fi

go build -ldflags "-s -w -X github.com/Vinniai/agent-ascii/internal/version.Version=local-dev" -o "vendor/${BIN_NAME}" .

echo
echo "Rendering sample screenshots with the local binary..."
echo

npx agent-ascii examples/screenshots/apple-mobile.png --width 80
echo
npx agent-ascii examples/screenshots/google-desktop.png --width 100
echo
npx agent-ascii examples/screenshots/x-mobile.png --width 80 --grayscale
