#!/usr/bin/env python3
"""
bench-diffs.py — compare ways an agent could detect "what changed"
between a before/after screenshot pair.

For the webpage-basic vs webpage-top-third pair, under the best-performing
render settings (--layout --width 60), we measure three diff strategies:

  1. text-diff  : unified diff of the two ASCII .txt files
                  (what you paste into a prompt)
  2. heatmap    : count of cells that changed + coordinate list
                  (structured signal; can be summarised coarsely)
  3. png-diff   : raw per-pixel MAE between rasterised renders
                  (what "image diff" looks like; not LLM-consumable)

We report bytes, tokens, signal/noise (does the diff actually point to
the changed region?), and what the agent can do with each.
"""
import subprocess
import sys
from pathlib import Path

import tiktoken
from PIL import Image, ImageDraw
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
BIN  = ROOT / "vendor" / "agent-ascii"
SRC  = ROOT / "examples" / "screenshots"
OUT  = ROOT / "examples" / "outputs" / "diffs"
OUT.mkdir(parents=True, exist_ok=True)

ENC = tiktoken.get_encoding("cl100k_base")

BEFORE = SRC / "webpage-basic.png"
AFTER  = SRC / "webpage-top-third.png"
WIDTH  = 60
FLAGS  = ["--layout", "--width", str(WIDTH)]


def run(cmd, **kw):
    return subprocess.run(cmd, capture_output=True, **kw)


def render(src, tag):
    d = OUT / tag
    d.mkdir(exist_ok=True)
    subprocess.check_call([
        str(BIN), str(src), *FLAGS,
        "--save-txt", str(d), "--save-img", str(d), "--only-save",
    ], stderr=subprocess.DEVNULL)
    txt = next(d.glob("*-ascii-art.txt"))
    png = next(d.glob("*-ascii-art.png"))
    return txt, png


def text_diff(left_txt, right_txt):
    out = OUT / "text-diff.patch"
    r = run([str(BIN), "diff", "--text", str(left_txt), str(right_txt)])
    out.write_bytes(r.stdout)
    return out, r.returncode


def cell_heatmap(left_txt, right_txt):
    """Per-cell change map. Each char/cell in the text grid is compared."""
    a = left_txt.read_text().splitlines()
    b = right_txt.read_text().splitlines()
    rows = max(len(a), len(b))
    cols = max((len(l) for l in a + b), default=0)
    changed = []
    for r in range(rows):
        la = a[r] if r < len(a) else ""
        lb = b[r] if r < len(b) else ""
        for c in range(cols):
            ca = la[c] if c < len(la) else " "
            cb = lb[c] if c < len(lb) else " "
            if ca != cb:
                changed.append((r, c))
    return changed, rows, cols


def summarise_heatmap(cells, rows, cols, bins=(3, 3)):
    """Summarise into a coarse ninths grid (TL/TC/TR / ML/MC/MR / BL/BC/BR)."""
    names = [
        ["TL", "TC", "TR"],
        ["ML", "MC", "MR"],
        ["BL", "BC", "BR"],
    ]
    buckets = {n: 0 for row in names for n in row}
    for (r, c) in cells:
        br = min(bins[0] - 1, r * bins[0] // max(rows, 1))
        bc = min(bins[1] - 1, c * bins[1] // max(cols, 1))
        buckets[names[br][bc]] += 1
    return buckets


def png_pixel_mae(left_png, right_png, canvas=(512, 384)):
    def prep(p):
        return np.asarray(
            Image.open(p).convert("L").resize(canvas, Image.LANCZOS),
            dtype=np.float32,
        ) / 255.0
    a, b = prep(left_png), prep(right_png)
    return float(np.abs(a - b).mean())


def source_png_pixel_mae(canvas=(512, 384)):
    """For context: what's the pixel-MAE between the raw source PNGs?"""
    def prep(p):
        return np.asarray(
            Image.open(p).convert("L").resize(canvas, Image.LANCZOS),
            dtype=np.float32,
        ) / 255.0
    return float(np.abs(prep(BEFORE) - prep(AFTER)).mean())


def pretty_kb(b):
    return f"{b/1024:.1f} KB" if b > 1024 else f"{b} B"


def main():
    print("rendering pair with --layout --width 60 ...")
    lt, lp = render(BEFORE, "before")
    rt, rp = render(AFTER, "after")

    print("\n--- 1. unified text diff ---")
    patch, rc = text_diff(lt, rt)
    diff_bytes = patch.stat().st_size
    diff_text = patch.read_text()
    diff_tokens = len(ENC.encode(diff_text))
    diff_lines = diff_text.count("\n")
    print(f"  patch:    {pretty_kb(diff_bytes):>10s}  tokens={diff_tokens:>6d}  lines={diff_lines}")
    print(f"  exit:     {rc} (1 = diff present)")

    print("\n--- 2. cell heatmap ---")
    cells, rows, cols = cell_heatmap(lt, rt)
    total = rows * cols
    pct = 100 * len(cells) / max(total, 1)
    buckets = summarise_heatmap(cells, rows, cols)
    hotspots = sorted(buckets.items(), key=lambda kv: -kv[1])[:4]
    # coord list as text the agent could see:
    coord_text = "\n".join(f"{r:>3d},{c:>3d}" for r, c in cells)
    coord_bytes = len(coord_text.encode("utf-8"))
    coord_tokens = len(ENC.encode(coord_text))
    summary_text = "  ".join(f"{k}:{v}" for k, v in hotspots if v)
    summary_bytes = len(summary_text.encode("utf-8"))
    summary_tokens = len(ENC.encode(summary_text))
    print(f"  grid:     {rows}x{cols} = {total} cells")
    print(f"  changed:  {len(cells)} cells ({pct:.1f}%)")
    print(f"  hotspots: {summary_text}")
    print(f"  full coord list   : {pretty_kb(coord_bytes):>10s}  tokens={coord_tokens:>6d}")
    print(f"  coarse 9-box sum  : {pretty_kb(summary_bytes):>10s}  tokens={summary_tokens:>6d}")

    print("\n--- 3. raw PNG pixel diff ---")
    render_mae = png_pixel_mae(lp, rp)
    source_mae = source_png_pixel_mae()
    # what you'd have to send an LLM: a png of the diff, as bytes
    # (we just measure sizes of the render PNGs themselves)
    lp_bytes, rp_bytes = lp.stat().st_size, rp.stat().st_size
    print(f"  raw-source MAE   : {source_mae:.4f}  (reference)")
    print(f"  rendered MAE     : {render_mae:.4f}  (agent sees this via rasters)")
    print(f"  two PNGs to ship : {pretty_kb(lp_bytes + rp_bytes):>10s}   (not text — model must vision-parse)")

    print("\n=== agent cost/signal tradeoff ===")
    print(f"{'strategy':<24s} {'bytes':>10s} {'tokens':>8s}  consumable?  locates region?")
    print(f"{'text-diff (unified)':<24s} {pretty_kb(diff_bytes):>10s} {diff_tokens:>8d}  yes (text)    yes, line-accurate")
    print(f"{'full coord list':<24s} {pretty_kb(coord_bytes):>10s} {coord_tokens:>8d}  yes (text)    yes, cell-accurate")
    print(f"{'9-box summary':<24s} {pretty_kb(summary_bytes):>10s} {summary_tokens:>8d}  yes (text)    coarse (ninths)")
    print(f"{'two PNG renders':<24s} {pretty_kb(lp_bytes+rp_bytes):>10s} {'~vision':>8s}  image only    only via model attention")


if __name__ == "__main__":
    main()
