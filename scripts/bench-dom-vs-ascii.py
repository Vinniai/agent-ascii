#!/usr/bin/env python3
"""
bench-dom-vs-ascii.py — three-way comparison of how an agent can "see"
a live web page:

  (a) DOM outline        : agent-browser snapshot  (accessibility tree text)
  (b) ASCII render       : agent-ascii --layout --width 80 on screenshot
  (c) ASCII + DOM labels : same ASCII render + per-region anchor list
                           mapping DOM nodes to cell coords

For each strategy we capture wall time, byte size, and tiktoken
(cl100k_base) token count. A single wall-time run is not a benchmark —
we report median of N=3 runs per strategy per URL.

Output: examples/outputs/dom-vs-ascii.csv + printed markdown table.
"""
import csv
import json
import statistics
import subprocess
import sys
import time
from pathlib import Path

import tiktoken
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
BIN = ROOT / "vendor" / "agent-ascii"
OUT = ROOT / "examples" / "outputs" / "three-way"
OUT.mkdir(parents=True, exist_ok=True)

ENC = tiktoken.get_encoding("cl100k_base")

URLS = [
    ("agent-ascii-home", "http://localhost:3000/"),
    ("example-com",      "https://example.com/"),
    ("npm-agent-ascii",  "https://www.npmjs.com/package/agent-ascii"),
]

WIDTH = 1280
HEIGHT = 900
RUNS = 3

# JS to pull labeled DOM nodes with bounding boxes
DOM_JS = """(() => {
  const SEL = 'h1,h2,h3,h4,h5,h6,a,button,input,textarea,select,label,[role=button],[role=link],[role=tab],[role=menuitem],[aria-label]';
  const nodes = document.querySelectorAll(SEL);
  const out = [];
  for (const n of nodes) {
    const r = n.getBoundingClientRect();
    if (r.width < 4 || r.height < 4) continue;
    if (r.y + r.height < 0 || r.y > window.innerHeight * 3) continue;
    const text = (n.innerText || n.value || n.getAttribute('aria-label') || '').trim().slice(0, 80);
    if (!text && !n.getAttribute('aria-label')) continue;
    const role = n.getAttribute('role') || n.tagName.toLowerCase();
    out.push({role, text, x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height)});
  }
  return out;
})()"""


def run(cmd, **kw):
    return subprocess.run(cmd, capture_output=True, text=True, **kw)


def browse_goto(url):
    subprocess.check_call(
        ["agent-browser", "open", url, "--width", str(WIDTH), "--height", str(HEIGHT)],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )


def browse_snapshot():
    r = subprocess.run(["agent-browser", "snapshot"], capture_output=True, text=True, check=True)
    return r.stdout


def browse_screenshot(out_png):
    subprocess.check_call(
        ["agent-browser", "screenshot", str(out_png)],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )


def browse_dom_nodes():
    r = subprocess.run(["agent-browser", "eval", DOM_JS], capture_output=True, text=True, check=True)
    return json.loads(r.stdout.strip())


def render_ascii(src_png, width=80):
    r = subprocess.run(
        [str(BIN), str(src_png), "--layout", "--width", str(width)],
        stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, text=True, check=True,
    )
    return r.stdout


def ascii_grid_dims(text):
    lines = [l for l in text.splitlines() if l.strip()]
    return (len(lines), max((len(l) for l in lines), default=0))


def compose_ascii_with_labels(ascii_text, dom_nodes, img_size):
    """Append a compact label block mapping DOM anchors to cell rows."""
    rows, cols = ascii_grid_dims(ascii_text)
    img_w, img_h = img_size
    cell_w = img_w / max(cols, 1)
    cell_h = img_h / max(rows, 1)
    tags = []
    seen = set()
    for n in dom_nodes[:48]:  # cap to keep anchors cheap
        r0 = max(0, int(n["y"] / cell_h))
        r1 = min(rows - 1, int((n["y"] + n["h"]) / cell_h))
        c0 = max(0, int(n["x"] / cell_w))
        c1 = min(cols - 1, int((n["x"] + n["w"]) / cell_w))
        key = (n["role"], n["text"][:30], r0)
        if key in seen:
            continue
        seen.add(key)
        text = n["text"].replace("\n", " ")[:56]
        if not text:
            continue
        tags.append(f'[{n["role"]} r={r0}-{r1} c={c0}-{c1}] "{text}"')
    label_block = "\n".join(tags)
    return ascii_text + "\n---\n" + label_block


def tok(s):
    return len(ENC.encode(s))


def bytes_of(s):
    return len(s.encode("utf-8"))


def measure(fn):
    t0 = time.perf_counter()
    out = fn()
    return out, time.perf_counter() - t0


def bench_url(label, url):
    print(f"\n=== {label}  {url} ===")
    # one warm-up visit
    browse_goto(url)
    time.sleep(0.6)

    results = {"dom": [], "ascii": [], "both": []}
    sizes = {}
    samples = {}

    for run_idx in range(RUNS):
        # (a) DOM snapshot
        def go_dom():
            return browse_snapshot()
        snap, t_dom = measure(go_dom)
        results["dom"].append(t_dom)

        # (b) ASCII render — includes screenshot + convert
        shot = OUT / f"{label}-run{run_idx}.png"
        def go_ascii():
            browse_screenshot(shot)
            return render_ascii(shot)
        ascii_out, t_ascii = measure(go_ascii)
        results["ascii"].append(t_ascii)

        # (c) ASCII + DOM labels — reuse screenshot + grab dom nodes
        def go_both():
            nodes = browse_dom_nodes()
            img = Image.open(shot)
            return compose_ascii_with_labels(ascii_out, nodes, img.size)
        combined, t_both = measure(go_both)
        # both includes only extra DOM-extraction + composition cost; we add
        # the base ASCII time since that run produced the render
        results["both"].append(t_ascii + t_both)

        # only store sample outputs once
        if run_idx == 0:
            sizes = {
                "dom":  (bytes_of(snap),     tok(snap)),
                "ascii": (bytes_of(ascii_out), tok(ascii_out)),
                "both":  (bytes_of(combined), tok(combined)),
            }
            samples = {"dom": snap, "ascii": ascii_out, "both": combined}

    rows = []
    for strategy in ("dom", "ascii", "both"):
        b, t = sizes[strategy]
        median_ms = 1000 * statistics.median(results[strategy])
        rows.append({
            "url_label": label, "url": url, "strategy": strategy,
            "bytes": b, "tokens": t, "median_ms": round(median_ms, 1),
        })
        print(f"  {strategy:<6s}  bytes={b:>7d}  tokens={t:>6d}  median={median_ms:>6.1f} ms")

    # save sample outputs for inspection
    for k, s in samples.items():
        (OUT / f"{label}-{k}.txt").write_text(s)

    return rows


def main():
    all_rows = []
    for label, url in URLS:
        try:
            all_rows += bench_url(label, url)
        except subprocess.CalledProcessError as e:
            print(f"  skipped {label}: {e}")
            continue

    csv_path = OUT / "dom-vs-ascii.csv"
    with open(csv_path, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(all_rows[0].keys()))
        w.writeheader()
        w.writerows(all_rows)
    print(f"\nwrote {csv_path}")

    # markdown-style summary
    print("\n| url | strategy | bytes | tokens | median ms |")
    print("|-----|----------|-------|--------|-----------|")
    for r in all_rows:
        print(f"| {r['url_label']} | {r['strategy']} | {r['bytes']} | {r['tokens']} | {r['median_ms']} |")


if __name__ == "__main__":
    main()
