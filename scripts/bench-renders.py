#!/usr/bin/env python3
"""
bench-renders.py — measure size, tokens, and visual fidelity across
mode × width × source combos so we know which render settings give
the best bytes-per-information tradeoff for agents.

For each combo we compute:
  txt_bytes : raw UTF-8 size of the ASCII/braille text
  tokens    : tiktoken (cl100k_base) count — the real LLM cost
  png_bytes : size of --save-img PNG (for visual preview delivery)
  mae       : mean absolute error between a grayscale, cell-aligned
              resample of the source and the rendered text, scored on
              how closely the ink density matches source luminance
              (lower = more faithful)

Output: ./examples/outputs/bench.csv and printed markdown table.
"""
import csv
import os
import subprocess
import sys
from pathlib import Path

try:
    import tiktoken
except ImportError:
    print("pip install --user tiktoken", file=sys.stderr)
    sys.exit(1)

from PIL import Image
import numpy as np
from skimage.metrics import structural_similarity as ssim

ROOT = Path(__file__).resolve().parent.parent
BIN = ROOT / "vendor" / "agent-ascii"
SRC = ROOT / "examples" / "screenshots"
OUT = ROOT / "examples" / "outputs" / "bench"
OUT.mkdir(parents=True, exist_ok=True)

ENC = tiktoken.get_encoding("cl100k_base")

SOURCES = [
    "apple-watch-closeup",
    "apple-iphone-closeup",
    "x-signup-closeup",
    "webpage-basic",
]

MODES = [
    ("basic",          []),
    ("complex",        ["--complex"]),
    ("braille",        ["--braille", "--dither=false"]),
    ("braille-dither", ["--braille"]),
    ("layout",         ["--layout"]),
]

WIDTHS = [40, 60, 80, 100]


def run(cmd):
    return subprocess.check_output(cmd, stderr=subprocess.DEVNULL)


def rasterize_fidelity(src_path, rendered_png, canvas=(512, 384)):
    """SSIM-based fidelity: both images as grayscale "ink" maps,
    where 1.0 = dark pixels. Returns structural similarity in [-1, 1],
    higher is better (we convert to 1-ssim so lower=better matches MAE)."""
    def prep(path, invert):
        im = Image.open(path).convert("L").resize(canvas, Image.LANCZOS)
        arr = np.asarray(im, dtype=np.float32) / 255.0
        return (1.0 - arr) if invert else arr
    # Source: dark text on light paper, so ink = 1 - luminance
    src_ink = prep(src_path, invert=True)
    # Render PNG: bright text on black bg, so ink = luminance
    rnd_ink = prep(rendered_png, invert=False)
    # Normalize so both have 0..1 range matching
    for a in (src_ink, rnd_ink):
        lo, hi = a.min(), a.max()
        if hi - lo > 1e-6:
            a[:] = (a - lo) / (hi - lo)
    score = ssim(src_ink, rnd_ink, data_range=1.0)
    return float(1.0 - score)  # lower is better


def bench():
    rows = []
    for src in SOURCES:
        src_path = SRC / f"{src}.png"
        if not src_path.exists():
            print(f"  skip {src}: missing")
            continue
        for mode_name, mode_flags in MODES:
            for w in WIDTHS:
                label = f"{src}__{mode_name}__w{w}"
                txt_dir = OUT / label
                txt_dir.mkdir(exist_ok=True)
                # text render
                run([
                    str(BIN), str(src_path),
                    "--width", str(w),
                    *mode_flags,
                    "--save-txt", str(txt_dir),
                    "--only-save",
                ])
                txt_file = txt_dir / f"{src}-ascii-art.txt"
                txt_bytes = txt_file.stat().st_size
                txt = txt_file.read_text()
                tokens = len(ENC.encode(txt))
                # png render
                run([
                    str(BIN), str(src_path),
                    "--width", str(w),
                    *mode_flags,
                    "--save-img", str(txt_dir),
                    "--only-save",
                ])
                png_file = txt_dir / f"{src}-ascii-art.png"
                png_bytes = png_file.stat().st_size
                # fidelity: rasterize both, compare at canvas resolution
                mae = rasterize_fidelity(src_path, png_file)
                rows.append({
                    "source": src,
                    "mode": mode_name,
                    "width": w,
                    "chars": len(txt),
                    "txt_bytes": txt_bytes,
                    "tokens": tokens,
                    "png_bytes": png_bytes,
                    "mae": round(mae, 4),
                })
                print(f"  {label:50s} txt={txt_bytes:6d}B tok={tokens:5d} png={png_bytes:6d}B mae={mae:.3f}")
    return rows


def write_csv(rows):
    csv_path = OUT.parent / "bench.csv"
    with open(csv_path, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        w.writeheader()
        w.writerows(rows)
    print(f"\n  wrote {csv_path}")


def print_table(rows):
    # Leaderboard: best bytes-per-fidelity per source
    print("\n=== best tokens-per-fidelity, per source ===")
    print(f"{'source':28s} {'mode':16s} {'w':>3s} {'tokens':>7s} {'png':>8s} {'mae':>6s} {'score':>7s}")
    by_src = {}
    for r in rows:
        by_src.setdefault(r["source"], []).append(r)
    for src, group in by_src.items():
        # score = tokens * mae (lower is better: cheap AND faithful)
        ranked = sorted(group, key=lambda r: r["tokens"] * max(r["mae"], 0.001))
        for r in ranked[:5]:
            score = r["tokens"] * max(r["mae"], 0.001)
            print(f"{src:28s} {r['mode']:16s} {r['width']:>3d} "
                  f"{r['tokens']:>7d} {r['png_bytes']:>8d} {r['mae']:>6.3f} "
                  f"{score:>7.1f}")
        print()


if __name__ == "__main__":
    rows = bench()
    write_csv(rows)
    print_table(rows)
