# Example HTML pages (visual diff)

Also summarized in the root **[README.md](../../README.md#html-layout-wordmark-diff)** under *HTML layout (wordmark diff)*.

Three minimal pages render a shared `agent-ascii` landing layout — nav, hero card, 3-card feature grid, footer — in **JetBrains Mono + Inter** (Google Fonts) on a white background:

| File                         | Variant                                                                       |
| ---------------------------- | ----------------------------------------------------------------------------- |
| `agent-ascii-basic.html`     | Baseline. Hero centered, emerald accent (`#10b981`).                          |
| `agent-ascii-top-third.html` | Same styling; hero pushed to the **upper third** and feature cards reordered. |
| `agent-ascii-blue.html`      | Same layout as basic; accent swapped to blue (`#3b82f6`).                     |

Use the basic page as the before-image and compare against the other two to produce:

- **layout drift** (basic → top-third): hero and primary action move, cards reshuffle.
- **color drift** (basic → blue): pixels shift on buttons, pills, dots, CTA glyphs.

## One-shot: PNG + three-panel visual diff

From the repo root (Chrome/Chromium required for headless capture):

```bash
npm run example:webpage
```

Or:

```bash
bash ./scripts/example-webpage-diff.sh
```

This builds `agent-ascii` if needed, captures each HTML at 1000×1200 into `captures/*.png`, then runs `scripts/diff-view.sh` to produce two committed artifacts:

- `layout-diff.txt` — basic vs top-third
- `color-diff.txt` — basic vs blue

Each file contains three stacked panels:

1. **SIDE-BY-SIDE** — framed `BEFORE` / `AFTER` braille renders with viewport borders so the spatial envelope is visible even in a terminal.
2. **CHANGE HEATMAP** — same grid, `█` on cells that differ, counted and broken down by a 3×3 region grid (`T/M/B × L/C/R`) so hotspots jump out.
3. **UNIFIED DIFF** — `agent-ascii diff --text` output for line-level review.

The header at the top of each artifact records the timestamp, source PNGs, and render mode.

## Manual capture

Open any HTML file at **1000×1200** (or use DevTools device mode), save full-page screenshots into `captures/`, then:

```bash
go build -o vendor/agent-ascii .

AGENT_ASCII_BIN=./vendor/agent-ascii bash scripts/diff-view.sh \
  examples/webpage/captures/basic.png \
  examples/webpage/captures/top-third.png \
  --width 80 \
  --out examples/webpage/layout-diff.txt
```

Generated files under `captures/` (`*.png`, `*-ascii-art.txt`) are gitignored. The HTML sources, `layout-diff.txt`, and `color-diff.txt` are committed as documentation of the drift between variants.
