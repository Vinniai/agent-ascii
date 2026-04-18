#!/usr/bin/env python3
"""
bench-multi-diffs.py — end-to-end: for each source, derive a plausible
"after" screenshot by adding a new banner and masking a removed region,
render both with --layout --width 60, and emit a red/green heatmap PNG.

Also prints the diff cost/signal table per pair.

Outputs land in examples/outputs/diffs/<pair>/.
"""
import subprocess
import sys
from pathlib import Path

import tiktoken
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
BIN  = ROOT / "vendor" / "agent-ascii"
SRC  = ROOT / "examples" / "screenshots"
OUT  = ROOT / "examples" / "outputs" / "diffs"
OUT.mkdir(parents=True, exist_ok=True)

ENC = tiktoken.get_encoding("cl100k_base")

# synth "after" recipes per source — (banner_band_y_frac, mask_band_y_frac)
# bands are (start, end) as fractions of image height
RECIPES = {
    "apple-watch-closeup":  {"banner": (0.02, 0.09), "mask": (0.55, 0.70)},
    "apple-iphone-closeup": {"banner": (0.03, 0.10), "mask": (0.62, 0.82)},
    "x-signup-closeup":     {"banner": (0.01, 0.08), "mask": (0.45, 0.58)},
}

# natural pair already in the repo
NATURAL_PAIRS = [
    ("webpage",       "webpage-basic",       "webpage-top-third"),
]


def run(cmd, **kw):
    return subprocess.run(cmd, capture_output=True, **kw)


def render(src, tag, width=60, flags=("--layout",)):
    d = OUT / tag
    d.mkdir(exist_ok=True, parents=True)
    subprocess.check_call([
        str(BIN), str(src), *flags, "--width", str(width),
        "--save-txt", str(d), "--save-img", str(d), "--only-save",
    ], stderr=subprocess.DEVNULL)
    txt = next(d.glob("*-ascii-art.txt"))
    png = next(d.glob("*-ascii-art.png"))
    return txt, png


def synth_after(src_png, out_png, banner, mask):
    im = Image.open(src_png).convert("RGB")
    w, h = im.size
    d = ImageDraw.Draw(im)
    # added: dark banner strip at top with lighter inset text area
    y0, y1 = int(banner[0] * h), int(banner[1] * h)
    d.rectangle([0, y0, w, y1], fill=(18, 18, 18))
    # insets simulate button/text inside banner -> denser cells -> green adds
    inset_y = (y0 + y1) // 2
    for x_frac in (0.08, 0.30, 0.52, 0.74):
        xa = int(x_frac * w)
        d.rectangle([xa, inset_y - 6, xa + int(w * 0.15), inset_y + 6], fill=(220, 220, 220))
    # removed: blank a mid-section band to paper-white
    my0, my1 = int(mask[0] * h), int(mask[1] * h)
    d.rectangle([int(w * 0.05), my0, int(w * 0.95), my1], fill=(250, 246, 239))
    im.save(out_png, optimize=True)


def heatmap(before_txt, after_txt, out_png, title):
    subprocess.check_call([
        sys.executable, str(ROOT / "scripts" / "render-rg-heatmap.py"),
        str(before_txt), str(after_txt), str(out_png),
        "--cell", "10", "--title", title,
    ])


def diff_stats(before_txt, after_txt):
    # unified text diff via agent-ascii diff --text
    r = run([str(BIN), "diff", "--text", str(before_txt), str(after_txt)])
    diff_bytes = len(r.stdout)
    diff_tokens = len(ENC.encode(r.stdout.decode("utf-8", errors="replace")))
    # cell heatmap counts
    a = before_txt.read_text().splitlines()
    b = after_txt.read_text().splitlines()
    rows = max(len(a), len(b))
    cols = max((len(l) for l in a + b), default=0)
    EMPTY = {" ", "\u2800", "\t"}
    removed = added = modified = 0
    ninths = {k: 0 for k in ("TL","TC","TR","ML","MC","MR","BL","BC","BR")}
    names = [["TL","TC","TR"],["ML","MC","MR"],["BL","BC","BR"]]
    for r_i in range(rows):
        la = a[r_i] if r_i < len(a) else ""
        lb = b[r_i] if r_i < len(b) else ""
        for c_i in range(cols):
            ca = la[c_i] if c_i < len(la) else " "
            cb = lb[c_i] if c_i < len(lb) else " "
            if ca == cb:
                continue
            ae, be = ca in EMPTY, cb in EMPTY
            if ae and not be: added += 1
            elif not ae and be: removed += 1
            else: modified += 1
            br = min(2, r_i * 3 // max(rows, 1))
            bc = min(2, c_i * 3 // max(cols, 1))
            ninths[names[br][bc]] += 1
    summary = "  ".join(f"{k}:{v}" for k, v in sorted(ninths.items(), key=lambda kv: -kv[1])[:4] if v)
    summary_tokens = len(ENC.encode(summary))
    changed = removed + added + modified
    return {
        "rows": rows, "cols": cols, "total": rows * cols,
        "removed": removed, "added": added, "modified": modified,
        "changed_pct": round(100 * changed / max(rows * cols, 1), 1),
        "diff_bytes": diff_bytes, "diff_tokens": diff_tokens,
        "ninths_summary": summary, "summary_tokens": summary_tokens,
    }


def bench_pair(label, before_src, after_src):
    print(f"\n=== {label} ===")
    before_txt, before_png = render(before_src, f"{label}/before")
    after_txt,  after_png  = render(after_src,  f"{label}/after")
    heatmap_png = OUT / label / "heatmap.png"
    heatmap(before_txt, after_txt, heatmap_png, f"{label}  —  red = removed,  green = added,  amber = modified")
    stats = diff_stats(before_txt, after_txt)
    print(f"  grid {stats['rows']}×{stats['cols']}  "
          f"+{stats['added']}  -{stats['removed']}  ~{stats['modified']}  "
          f"({stats['changed_pct']}%)")
    print(f"  unified diff  : {stats['diff_bytes']:>6d} B  {stats['diff_tokens']:>5d} tok")
    print(f"  9-box summary : {stats['summary_tokens']:>3d} tok  ({stats['ninths_summary']})")
    return stats


def main():
    # natural pair first
    for tag, before, after in NATURAL_PAIRS:
        bench_pair(tag, SRC / f"{before}.png", SRC / f"{after}.png")

    # synthesized pairs
    for src, recipe in RECIPES.items():
        after_src = OUT / src / "synthetic-after.png"
        after_src.parent.mkdir(parents=True, exist_ok=True)
        synth_after(SRC / f"{src}.png", after_src,
                    recipe["banner"], recipe["mask"])
        bench_pair(src, SRC / f"{src}.png", after_src)


if __name__ == "__main__":
    main()
