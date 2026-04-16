#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
SKILL_NAME="agent-ascii"
SKILL_REF="${AGENT_ASCII_SKILL_REF:-main}"
TARGET_ROOT="${AGENT_ASCII_SKILL_DIR:-}"
SOURCE_FILE="${REPO_ROOT}/skills/${SKILL_NAME}/SKILL.md"
REMOTE_URL="https://raw.githubusercontent.com/Vinniai/agent-ascii/${SKILL_REF}/skills/${SKILL_NAME}/SKILL.md"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dir)
      TARGET_ROOT="$2"
      shift 2
      ;;
    --ref)
      SKILL_REF="$2"
      REMOTE_URL="https://raw.githubusercontent.com/Vinniai/agent-ascii/${SKILL_REF}/skills/${SKILL_NAME}/SKILL.md"
      shift 2
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 1
      ;;
  esac
done

if [[ -z "$TARGET_ROOT" ]]; then
  if [[ -n "${CODEX_HOME:-}" ]]; then
    TARGET_ROOT="${CODEX_HOME}/skills"
  elif [[ -d "${HOME}/.codex/skills" || ! -d "${HOME}/.agents/skills" ]]; then
    TARGET_ROOT="${HOME}/.codex/skills"
  else
    TARGET_ROOT="${HOME}/.agents/skills"
  fi
fi

DEST_DIR="${TARGET_ROOT}/${SKILL_NAME}"
DEST_FILE="${DEST_DIR}/SKILL.md"

mkdir -p "$DEST_DIR"

if [[ -f "$SOURCE_FILE" ]]; then
  cp "$SOURCE_FILE" "$DEST_FILE"
else
  curl -fsSL "$REMOTE_URL" -o "$DEST_FILE"
fi

echo "Installed ${SKILL_NAME} skill to ${DEST_FILE}"
echo "Use npx agent-ascii for published usage, or the local repo launcher when working from source."
