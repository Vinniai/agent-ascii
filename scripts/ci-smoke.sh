#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if ! command -v go >/dev/null 2>&1; then
  echo "go is required for smoke tests."
  exit 1
fi

mkdir -p vendor .agent-ascii-out-ci

BIN_NAME="agent-ascii"
if [[ "${OSTYPE:-}" == msys* || "${OSTYPE:-}" == cygwin* ]]; then
  BIN_NAME="agent-ascii.exe"
fi

go build \
  -ldflags "-s -w -X github.com/Vinniai/agent-ascii/internal/version.Version=ci-smoke" \
  -o "vendor/${BIN_NAME}" \
  .

node ./bin/agent-ascii.js examples/screenshots/apple-mobile.png \
  --width 80 \
  --save-txt .agent-ascii-out-ci \
  --only-save

node ./bin/agent-ascii.js examples/screenshots/google-desktop.png \
  --width 100 \
  --grayscale \
  --save-txt .agent-ascii-out-ci \
  --only-save

cat examples/screenshots/x-mobile.png | \
  node ./bin/agent-ascii.js - \
    --width 72 \
    --save-txt .agent-ascii-out-ci \
    --only-save

test -f .agent-ascii-out-ci/apple-mobile-ascii-art.txt
test -f .agent-ascii-out-ci/google-desktop-ascii-art.txt
test -f .agent-ascii-out-ci/piped-img-ascii-art.txt
