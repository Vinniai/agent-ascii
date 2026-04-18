#!/usr/bin/env python3
"""
render-rg-heatmap.py — cell-by-cell before/after diff with directional colour:
  red   = cell existed in BEFORE, gone in AFTER     (removed)
  green = cell empty in BEFORE, present in AFTER    (added)
  amber = cell present in both but different        (modified)

Reads two plain-text ASCII/braille renders (the .txt files from agent-ascii
--save-txt) and writes a PNG heatmap on the project's paper background.

Usage:
  render-rg-heatmap.py <before.txt> <after.txt> <out.png> [--cell 10] [--title "..."]
"""
import argparse
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont


PAPER    = (250, 246, 239)   # --paper
INK      = (15, 14, 12)      # --ink (for title / border)
RULE     = (228, 222, 210)   # grid cells
RED      = (196, 70, 54)     # removed
GREEN    = (82, 128, 70)     # added
AMBER    = (184, 134, 66)    # modified

# empty = braille-blank or ascii-space (both should read as "no ink")
EMPTY_CHARS = {" ", "\u2800", "\t"}


def is_empty(ch):
    return ch in EMPTY_CHARS


def classify(a, b):
    if a == b:
        return None
    a_empty, b_empty = is_empty(a), is_empty(b)
    if a_empty and not b_empty:
        return "added"       # green
    if not a_empty and b_empty:
        return "removed"     # red
    return "modified"        # amber


def render(before_txt, after_txt, out_png, cell=10, title=None, pad=32):
    before = Path(before_txt).read_text().splitlines()
    after  = Path(after_txt).read_text().splitlines()
    rows = max(len(before), len(after))
    cols = max(max((len(l) for l in before), default=0),
               max((len(l) for l in after),  default=0))

    w = cols * cell + pad * 2
    h = rows * cell + pad * 2 + (28 if title else 0)
    img = Image.new("RGB", (w, h), PAPER)
    draw = ImageDraw.Draw(img)

    # title strip
    y0 = pad
    if title:
        try:
            font = ImageFont.truetype("/System/Library/Fonts/Supplemental/JetBrainsMono-Regular.ttf", 14)
        except Exception:
            try:
                font = ImageFont.truetype("/Library/Fonts/Menlo.ttc", 13)
            except Exception:
                font = ImageFont.load_default()
        draw.text((pad, pad), title, font=font, fill=INK)
        y0 = pad + 28

    counts = {"added": 0, "removed": 0, "modified": 0}
    for r in range(rows):
        la = before[r] if r < len(before) else ""
        lb = after[r]  if r < len(after)  else ""
        for c in range(cols):
            ca = la[c] if c < len(la) else " "
            cb = lb[c] if c < len(lb) else " "
            kind = classify(ca, cb)
            if kind is None:
                continue
            counts[kind] += 1
            colour = {"added": GREEN, "removed": RED, "modified": AMBER}[kind]
            x = pad + c * cell
            y = y0 + r * cell
            # filled cell, slight inset for breathing room on paper grid
            draw.rectangle([x + 1, y + 1, x + cell - 1, y + cell - 1], fill=colour)

    # thin border around the heatmap area
    draw.rectangle(
        [pad - 1, y0 - 1, pad + cols * cell, y0 + rows * cell],
        outline=RULE, width=1,
    )

    Path(out_png).parent.mkdir(parents=True, exist_ok=True)
    img.save(out_png, optimize=True)

    total = rows * cols
    changed = sum(counts.values())
    print(f"  {Path(out_png).name:40s}  "
          f"grid={rows}×{cols}  +{counts['added']:>4d}  -{counts['removed']:>4d}  "
          f"~{counts['modified']:>4d}  ({100*changed/total:.1f}%)")
    return counts, rows, cols


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("before")
    ap.add_argument("after")
    ap.add_argument("out")
    ap.add_argument("--cell", type=int, default=10)
    ap.add_argument("--title")
    args = ap.parse_args()
    render(args.before, args.after, args.out, cell=args.cell, title=args.title)


if __name__ == "__main__":
    main()
