#!/usr/bin/env bash
# Renders the example HTML pages to PNG (headless Chrome/Chromium), then
# produces two committed artifacts via scripts/diff-view.sh:
#   examples/webpage/layout-diff.txt   — basic vs top-third (layout drift)
#   examples/webpage/color-diff.txt    — basic vs blue accent (color drift)
# Each artifact contains: framed side-by-side + change heatmap + unified diff.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WEB_DIR="${ROOT_DIR}/examples/webpage"
OUT_DIR="${WEB_DIR}/captures"
WIDTH="${DIFF_VIEW_WIDTH:-80}"

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
  if ! "${chrome}" \
    --headless=new \
    --disable-gpu \
    --hide-scrollbars \
    --window-size=1000,1200 \
    --screenshot="${png_path}" \
    "${url}" 2>/dev/null
  then
    "${chrome}" \
      --headless \
      --disable-gpu \
      --hide-scrollbars \
      --window-size=1000,1200 \
      --screenshot="${png_path}" \
      "${url}" 2>/dev/null
  fi
}

BIN="${ROOT_DIR}/vendor/agent-ascii"
if [[ ! -x "${BIN}" ]]; then
  (cd "${ROOT_DIR}" && go build -o "${BIN}" .)
fi

BASIC_HTML="${WEB_DIR}/agent-ascii-basic.html"
TOP_HTML="${WEB_DIR}/agent-ascii-top-third.html"
BLUE_HTML="${WEB_DIR}/agent-ascii-blue.html"
PNG_BASIC="${OUT_DIR}/basic.png"
PNG_TOP="${OUT_DIR}/top-third.png"
PNG_BLUE="${OUT_DIR}/blue.png"

screenshot "${BASIC_HTML}" "${PNG_BASIC}"
screenshot "${TOP_HTML}"   "${PNG_TOP}"
screenshot "${BLUE_HTML}"  "${PNG_BLUE}"

write_diff() {
  local label=$1 before=$2 after=$3 out=$4
  local tmp
  tmp="$(mktemp)"
  AGENT_ASCII_BIN="${BIN}" bash "${ROOT_DIR}/scripts/diff-view.sh" \
    "${before}" "${after}" --width "${WIDTH}" --out "${tmp}"
  {
    echo "=== agent-ascii ${label} ==="
    echo "Generated: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
    echo "Sources:   $(basename "${before}")  →  $(basename "${after}")"
    echo "Mode:      --layout (braille + adaptive contrast + dither), width ${WIDTH}"
    echo ""
    cat "${tmp}"
  } > "${out}"
  rm -f "${tmp}"
  echo "Wrote ${out}"
}

write_diff "layout diff (basic vs top-third)" \
  "${PNG_BASIC}" "${PNG_TOP}"  "${WEB_DIR}/layout-diff.txt"

write_diff "color diff (basic vs blue accent)" \
  "${PNG_BASIC}" "${PNG_BLUE}" "${WEB_DIR}/color-diff.txt"

exit 0
