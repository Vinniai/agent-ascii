#!/usr/bin/env bash
# Renders the example HTML pages to PNG (headless Chromium/Chrome if available),
# converts with agent-ascii --layout --negative --dither, and writes a unified diff to examples/webpage/layout-diff.txt
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WEB_DIR="${ROOT_DIR}/examples/webpage"
OUT_DIR="${WEB_DIR}/captures"
DIFF_OUT="${WEB_DIR}/layout-diff.txt"

mkdir -p "${OUT_DIR}"

find_chrome() {
  local c
  for c in \
    "${CHROME_BIN:-}" \
    chromium \
    chromium-browser \
    google-chrome-stable \
    google-chrome \
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
    "/Applications/Chromium.app/Contents/MacOS/Chromium" \
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge"
  do
    if [[ -n "${c}" && -x "${c}" ]]; then
      echo "${c}"
      return 0
    fi
  done
  return 1
}

screenshot() {
  local html_path=$1
  local png_path=$2
  local chrome
  chrome="$(find_chrome)" || {
    echo "example-webpage-diff: no headless Chrome/Chromium found." >&2
    echo "Install Chrome or set CHROME_BIN, or capture ${html_path} manually to ${png_path}" >&2
    return 1
  }
  local url="file://${html_path}"
  # Fixed viewport matches layout inspection examples (roughly phone-tall).
  if ! "${chrome}" \
    --headless=new \
    --disable-gpu \
    --hide-scrollbars \
    --window-size=800,1200 \
    --screenshot="${png_path}" \
    "${url}" 2>/dev/null
  then
    "${chrome}" \
      --headless \
      --disable-gpu \
      --hide-scrollbars \
      --window-size=800,1200 \
      --screenshot="${png_path}" \
      "${url}" 2>/dev/null
  fi
}

BIN="${ROOT_DIR}/agent-ascii"
if [[ ! -x "${BIN}" ]]; then
  (cd "${ROOT_DIR}" && go build -o "${BIN}" .)
fi

BASIC_HTML="${WEB_DIR}/agent-ascii-basic.html"
TOP_HTML="${WEB_DIR}/agent-ascii-top-third.html"
PNG_BASIC="${OUT_DIR}/basic.png"
PNG_TOP="${OUT_DIR}/top-third.png"

screenshot "${BASIC_HTML}" "${PNG_BASIC}"
screenshot "${TOP_HTML}" "${PNG_TOP}"

TXT_BASIC="${OUT_DIR}/basic-ascii-art.txt"
TXT_TOP="${OUT_DIR}/top-third-ascii-art.txt"

# --layout: braille + edge-focused preprocessing; --negative: invert for dark UIs; --dither: sharper braille edges
CONVERT_FLAGS=(--layout --negative --dither --width 80 --save-txt "${OUT_DIR}" --only-save --save-txt-history=false)

AGENT_ASCII_BINARY_PATH="${BIN}" node "${ROOT_DIR}/bin/agent-ascii.js" "${PNG_BASIC}" "${CONVERT_FLAGS[@]}"

AGENT_ASCII_BINARY_PATH="${BIN}" node "${ROOT_DIR}/bin/agent-ascii.js" "${PNG_TOP}" "${CONVERT_FLAGS[@]}"

if [[ ! -f "${TXT_BASIC}" ]]; then
  echo "Missing ${TXT_BASIC}" >&2
  exit 1
fi
if [[ ! -f "${TXT_TOP}" ]]; then
  echo "Missing ${TXT_TOP}" >&2
  exit 1
fi

TMP_DIFF="$(mktemp)"
set +e
"${BIN}" diff --text "${TXT_BASIC}" "${TXT_TOP}" > "${TMP_DIFF}"
diff_code=$?
set -e

{
  echo "=== agent-ascii layout diff (basic vs top-third; --layout --negative --dither) ==="
  echo "Generated: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "Sources: examples/webpage/captures/basic.png examples/webpage/captures/top-third.png"
  echo "Exit code: ${diff_code} (0 identical, 1 different, 2 error)"
  echo ""
  cat "${TMP_DIFF}"
} > "${DIFF_OUT}"
rm -f "${TMP_DIFF}"

echo "Wrote ${DIFF_OUT}"
exit 0
