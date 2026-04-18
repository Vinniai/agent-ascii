#!/usr/bin/env python3
"""
annotate-diff.py — bake the cell-level diff directly into the rendered
after-image so the agent reads one annotated artefact instead of
comparing two side-by-side.

Cells that differ between two ASCII/braille renders are painted:
  red     = ink in BEFORE, empty in AFTER      (removed)
  green   = empty in BEFORE, ink in AFTER      (added)
  amber   = ink in both, glyph shifted         (modified)

Two outputs:
  <out>.png   — the after render with translucent coloured overlays
  <out>.ansi  — the after text with per-cell ANSI background colours
                (openable in any modern terminal / paste into PR body)

Usage:
  annotate-diff.py <before.txt> <after.txt> <after.png> <out-base>
"""
import argparse
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

# OKLCH tokens converted to sRGB, matching site --paper/--ink/--add/--remove/--accent
PAPER = (250, 246, 239)
INK = (15, 14, 12)
ADD = (82, 128, 70)       # green
REMOVE = (196, 70, 54)    # red
MOD = (184, 134, 66)      # amber

EMPTY_CHARS = {" ", "\u2800", "\t", ""}


def is_empty(ch):
    return ch in EMPTY_CHARS


def classify(a, b):
    if a == b:
        return None
    ae, be = is_empty(a), is_empty(b)
    if ae and not be:
        return "added"
    if not ae and be:
        return "removed"
    return "modified"


COLOUR = {"added": ADD, "removed": REMOVE, "modified": MOD}

# 8-bit ANSI codes (xterm 256) approximating each colour for terminal output
ANSI_BG = {"added": "\x1b[48;5;65m", "removed": "\x1b[48;5;124m", "modified": "\x1b[48;5;136m"}
ANSI_RESET = "\x1b[0m"


def annotate_png(before_txt, after_txt, after_png, out_png):
    before = Path(before_txt).read_text().splitlines()
    after = Path(after_txt).read_text().splitlines()
    rows = max(len(before), len(after))
    cols = max(max((len(l) for l in before), default=0),
               max((len(l) for l in after), default=0))

    base = Image.open(after_png).convert("RGBA")
    w, h = base.size
    cw = w / cols
    ch = h / rows

    # overlay layer — translucent rectangles
    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    counts = {"added": 0, "removed": 0, "modified": 0}
    for r in range(rows):
        la = before[r] if r < len(before) else ""
        lb = after[r] if r < len(after) else ""
        for c in range(cols):
            ca = la[c] if c < len(la) else " "
            cb = lb[c] if c < len(lb) else " "
            kind = classify(ca, cb)
            if kind is None:
                continue
            counts[kind] += 1
            x0 = round(c * cw)
            y0 = round(r * ch)
            x1 = round((c + 1) * cw)
            y1 = round((r + 1) * ch)
            col = COLOUR[kind]
            # removed cells are empty — use a solid-ish fill so the loss is visible.
            # added cells keep the glyph clearly readable — translucent wash.
            # modified cells get the lightest wash, preserving glyph detail.
            alpha = {"removed": 170, "added": 110, "modified": 90}[kind]
            draw.rectangle([x0, y0, x1 - 1, y1 - 1], fill=(*col, alpha))

    composed = Image.alpha_composite(base, overlay)

    # add a legend strip at the bottom with counts
    legend_h = 36
    out = Image.new("RGBA", (w, h + legend_h), PAPER + (255,))
    out.paste(composed, (0, 0))
    ld = ImageDraw.Draw(out)
    try:
        font = ImageFont.truetype(
            "/System/Library/Fonts/Supplemental/JetBrainsMono-Regular.ttf", 13
        )
    except Exception:
        try:
            font = ImageFont.truetype("/Library/Fonts/Menlo.ttc", 13)
        except Exception:
            font = ImageFont.load_default()

    entries = [
        (ADD, f"+{counts['added']}  added"),
        (REMOVE, f"-{counts['removed']}  removed"),
        (MOD, f"~{counts['modified']}  modified"),
    ]
    x = 14
    y = h + (legend_h - 14) // 2
    for col, label in entries:
        ld.rectangle([x, y, x + 12, y + 12], fill=col + (255,))
        ld.text((x + 18, y - 2), label, font=font, fill=INK + (255,))
        x += 14 + ld.textlength(label, font=font) + 28

    out.convert("RGB").save(out_png, optimize=True)
    return counts, rows, cols


def annotate_ansi(before_txt, after_txt, out_ansi):
    before = Path(before_txt).read_text().splitlines()
    after = Path(after_txt).read_text().splitlines()
    rows = max(len(before), len(after))
    cols = max(max((len(l) for l in before), default=0),
               max((len(l) for l in after), default=0))
    lines = []
    for r in range(rows):
        la = before[r] if r < len(before) else ""
        lb = after[r] if r < len(after) else ""
        out = []
        current = None  # active background kind
        for c in range(cols):
            ca = la[c] if c < len(la) else " "
            cb = lb[c] if c < len(lb) else " "
            kind = classify(ca, cb)
            if kind != current:
                if current is not None:
                    out.append(ANSI_RESET)
                if kind is not None:
                    out.append(ANSI_BG[kind])
                current = kind
            # for removed cells (cb is empty), render the before glyph as a
            # ghost — agent sees "this is what used to be here"
            glyph = cb if not is_empty(cb) else (ca if not is_empty(ca) else " ")
            out.append(glyph)
        if current is not None:
            out.append(ANSI_RESET)
        lines.append("".join(out))
    Path(out_ansi).write_text("\n".join(lines) + "\n")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("before_txt")
    ap.add_argument("after_txt")
    ap.add_argument("after_png")
    ap.add_argument("out_base", help="output base path; writes <base>.png and <base>.ansi")
    args = ap.parse_args()

    out_png = args.out_base if args.out_base.endswith(".png") else args.out_base + ".png"
    out_ansi = (
        args.out_base[:-4] + ".ansi"
        if args.out_base.endswith(".png")
        else args.out_base + ".ansi"
    )
    Path(out_png).parent.mkdir(parents=True, exist_ok=True)

    counts, rows, cols = annotate_png(
        args.before_txt, args.after_txt, args.after_png, out_png
    )
    annotate_ansi(args.before_txt, args.after_txt, out_ansi)
    total = rows * cols
    changed = sum(counts.values())
    print(
        f"  {Path(out_png).name:40s}  "
        f"grid={rows}×{cols}  +{counts['added']}  -{counts['removed']}  "
        f"~{counts['modified']}  ({100*changed/total:.1f}%)"
    )


if __name__ == "__main__":
    main()
