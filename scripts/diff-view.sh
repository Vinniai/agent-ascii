#!/usr/bin/env bash
# diff-view.sh — PR/terminal-friendly visual diff of two screenshots.
#
# Renders both images with `agent-ascii --layout`, then emits three stacked panels:
#   1. SIDE-BY-SIDE  — framed before / after with viewport guides
#   2. CHANGE HEATMAP — same grid, ▓/█ on cells that differ (spatial pinpoint)
#   3. UNIFIED DIFF  — line-level text diff (existing agent-ascii diff)
#
# Usage:
#   scripts/diff-view.sh <before.png> <after.png> [--width N] [--out file.txt]
#
# Width defaults to 80. Output goes to stdout unless --out is provided.

set -euo pipefail

WIDTH=80
OUT=""
POS=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --width) WIDTH=$2; shift 2 ;;
    --out)   OUT=$2;   shift 2 ;;
    -h|--help)
      sed -n '2,15p' "$0"; exit 0 ;;
    *) POS+=("$1"); shift ;;
  esac
done

if [[ ${#POS[@]} -lt 2 ]]; then
  echo "usage: $(basename "$0") <before.png> <after.png> [--width N] [--out file.txt]" >&2
  exit 2
fi

BEFORE=${POS[0]}
AFTER=${POS[1]}

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BIN="${AGENT_ASCII_BIN:-${ROOT_DIR}/vendor/agent-ascii}"
if [[ ! -x "$BIN" ]]; then
  (cd "$ROOT_DIR" && go build -o "$BIN" .)
fi

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

render() {
  local img=$1 dest=$2
  "$BIN" "$img" --layout --width "$WIDTH" \
    --save-txt "$TMP" --only-save --save-txt-history=false >/dev/null
  local stem
  stem="$(basename "${img%.*}")"
  mv "$TMP/${stem}-ascii-art.txt" "$dest"
}

render "$BEFORE" "$TMP/before.txt"
render "$AFTER"  "$TMP/after.txt"

"$BIN" diff --text "$TMP/before.txt" "$TMP/after.txt" > "$TMP/unified.diff" || true

run_python() {
  python3 - "$TMP/before.txt" "$TMP/after.txt" "$TMP/unified.diff" "$WIDTH" "$BEFORE" "$AFTER" <<'PYEOF'
import os, sys

b_path, a_path, u_path, W, b_img, a_img = sys.argv[1:]
W = int(W)

def load(p):
    return open(p).read().rstrip("\n").split("\n")

before  = load(b_path)
after   = load(a_path)
unified = open(u_path).read()

rows = max(len(before), len(after))
before += [""] * (rows - len(before))
after  += [""] * (rows - len(after))

def cellpad(s, w):
    if len(s) >= w:
        return s[:w]
    return s + " " * (w - len(s))

def frame(title, lines, w):
    label = f" {title} "
    fill  = "─" * max(0, w - len(label) - 1)
    top   = "┌" + label + fill + "┐"
    bot   = "└" + "─" * w + "┘"
    mid_i = len(lines) // 2
    rows_out = [top]
    for i, ln in enumerate(lines):
        body = cellpad(ln, w)
        left = "│"
        right = "│"
        rows_out.append(left + body + right)
    rows_out.append(bot)
    return rows_out

def pad_block(block, target_rows, w):
    blank = " " * (w + 2)
    if len(block) < target_rows:
        block = block + [blank] * (target_rows - len(block))
    return block

def region_label(row, rows, col, w):
    """Coarse 3x3 grid label: TL TC TR / ML MC MR / BL BC BR."""
    r = "T" if row < rows/3 else ("M" if row < 2*rows/3 else "B")
    c = "L" if col < w/3   else ("C" if col < 2*w/3   else "R")
    return r + c

out = []

out.append(f"# SIDE-BY-SIDE  (width={W}, rows={rows})")
out.append(f"#   left : {os.path.basename(b_img)}")
out.append(f"#   right: {os.path.basename(a_img)}")

b_frame = frame(f"BEFORE  {os.path.basename(b_img)}", before, W)
a_frame = frame(f"AFTER   {os.path.basename(a_img)}", after,  W)
n = max(len(b_frame), len(a_frame))
b_frame = pad_block(b_frame, n, W)
a_frame = pad_block(a_frame, n, W)
for bl, al in zip(b_frame, a_frame):
    out.append(bl + "  " + al)
out.append("")

heat_rows = []
changes_per_region = {}
for i in range(rows):
    bl = cellpad(before[i], W)
    al = cellpad(after[i],  W)
    row_chars = []
    for j, (bc, ac) in enumerate(zip(bl, al)):
        if bc == ac:
            row_chars.append(" ")
        else:
            row_chars.append("█")
            reg = region_label(i, rows, j, W)
            changes_per_region[reg] = changes_per_region.get(reg, 0) + 1
    heat_rows.append("".join(row_chars))

total_cells   = rows * W
changed_cells = sum(1 for ln in heat_rows for ch in ln if ch != " ")
pct           = (changed_cells / total_cells * 100) if total_cells else 0.0

out.append(f"# CHANGE HEATMAP  ({changed_cells}/{total_cells} cells differ = {pct:.1f}%)")
if changes_per_region:
    top_regions = sorted(changes_per_region.items(), key=lambda kv: -kv[1])
    hotspots = ", ".join(f"{reg}={n}" for reg, n in top_regions[:6])
    out.append(f"#   hotspots (3x3 grid T/M/B × L/C/R): {hotspots}")
else:
    out.append("#   no cell-level changes detected (pure-color drift is invisible to --layout braille)")
out.extend(frame("DIFF", heat_rows, W))
out.append("")

out.append("# UNIFIED DIFF  (agent-ascii diff --text)")
out.append(unified.rstrip() if unified.strip() else "(no textual difference)")

print("\n".join(out))
PYEOF
}

if [[ -n "$OUT" ]]; then
  run_python > "$OUT"
  echo "Wrote $OUT" >&2
else
  run_python
fi
