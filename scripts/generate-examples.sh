#!/usr/bin/env bash
# Regenerate the eight preview PNGs in examples/outputs/ and build
# side-by-side comparison PNGs (source screenshot | ASCII render) so the
# README can show "before vs after" for each mode.
#
# Produces:
#   examples/outputs/NN-<label>.png             (flat ASCII render)
#   examples/outputs/compare-NN-<label>.png     (source | ASCII, labelled)
#
# Requires: go (for build fallback), python3 with Pillow (pip install pillow).
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

BIN="${ROOT_DIR}/vendor/agent-ascii"
OUT="${ROOT_DIR}/examples/outputs"
SRC="${ROOT_DIR}/examples/screenshots"

mkdir -p "$OUT"
if [[ ! -x "$BIN" ]]; then
  go build -o "$BIN" .
fi

if ! python3 -c "from PIL import Image" 2>/dev/null; then
  echo "generate-examples: Python Pillow not found." >&2
  echo "  Install with: python3 -m pip install --user pillow" >&2
  exit 1
fi

compose() {
  local src_png=$1 ascii_png=$2 caption=$3 out_png=$4
  python3 - "$src_png" "$ascii_png" "$caption" "$out_png" <<'PYEOF'
import os, sys
from PIL import Image, ImageDraw, ImageFont

src_path, ascii_path, caption, out_path = sys.argv[1:]

TARGET_H = 1000
PAD = 16
LABEL_H = 44
BG = (255, 255, 255)
FG = (17, 17, 17)
DIM = (110, 110, 110)

FONT_CANDIDATES = [
    "/System/Library/Fonts/Supplemental/Arial.ttf",
    "/System/Library/Fonts/Supplemental/Helvetica.ttc",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/TTF/DejaVuSans.ttf",
    "C:\\Windows\\Fonts\\arial.ttf",
]

def load_font(size):
    for p in FONT_CANDIDATES:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                continue
    return ImageFont.load_default()

FONT_BOLD = load_font(22)
FONT_DIM  = load_font(16)

def resize(path):
    im = Image.open(path).convert("RGB")
    w, h = im.size
    new_w = max(1, round(w * TARGET_H / h))
    return im.resize((new_w, TARGET_H), Image.LANCZOS)

src  = resize(src_path)
rend = resize(ascii_path)

total_w = PAD + src.width + PAD + rend.width + PAD
total_h = PAD + LABEL_H + src.height + PAD

canvas = Image.new("RGB", (total_w, total_h), BG)
draw   = ImageDraw.Draw(canvas)

src_title = f"source: {os.path.basename(src_path)}"
src_sub   = f"{Image.open(src_path).size[0]}×{Image.open(src_path).size[1]}"
ascii_sub = "ASCII render (PNG)"

draw.text((PAD, PAD),          src_title,  fill=FG,  font=FONT_BOLD)
draw.text((PAD, PAD + 24),     src_sub,    fill=DIM, font=FONT_DIM)

x2 = PAD + src.width + PAD
draw.text((x2, PAD),           caption,    fill=FG,  font=FONT_BOLD)
draw.text((x2, PAD + 24),      ascii_sub,  fill=DIM, font=FONT_DIM)

canvas.paste(src,  (PAD, PAD + LABEL_H))
canvas.paste(rend, (x2,  PAD + LABEL_H))

canvas.save(out_path, "PNG", optimize=True)
PYEOF
}

render() {
  local num=$1 label=$2 source=$3; shift 3
  local caption="agent-ascii $*"
  local src_png="${SRC}/${source}.png"
  local flat="${OUT}/${num}-${label}.png"
  local cmp="${OUT}/compare-${num}-${label}.png"

  if [[ ! -f "$src_png" ]]; then
    echo "  skip ${num}-${label}: missing ${src_png}" >&2
    return
  fi

  "$BIN" "$src_png" "$@" --save-img "$OUT" --only-save >/dev/null
  mv -f "${OUT}/${source}-ascii-art.png" "$flat"

  compose "$src_png" "$flat" "$caption" "$cmp"

  echo "  ${num}  ${label}  →  $(basename "$flat"), $(basename "$cmp")"
}

echo "Rendering 8 preview PNGs + side-by-side comparisons into ${OUT}"
render 01 basic                 apple-desktop  --width 80
render 02 complex               apple-desktop  --width 80 --complex
render 03 braille               apple-desktop  --width 80 --braille --dither=false
render 04 braille-dither        apple-desktop  --width 80 --braille
render 05 layout                apple-desktop  --width 80 --layout
render 06 negative              apple-mobile   --width 60 --negative
render 07 complex-map           apple-mobile   --width 60 --map ' .-=+#@'
render 08 braille-dither-mobile x-mobile       --width 60 --braille

echo "Done."
