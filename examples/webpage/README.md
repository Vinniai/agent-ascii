# Example HTML pages (layout diff)

Also summarized in the root **[README.md](../../README.md#html-layout-wordmark-diff)** under *HTML layout (wordmark diff)*.

Two minimal pages render the **agent-ascii** wordmark in **JetBrains Mono** (Google Fonts):


| File                         | Layout                                                                     |
| ---------------------------- | -------------------------------------------------------------------------- |
| `agent-ascii-basic.html`     | Title centered in the viewport                                             |
| `agent-ascii-top-third.html` | Same styling; title in the **upper third** (`grid-template-rows: 1fr 2fr`) |


Use them to produce before/after screenshots, convert with `--layout --negative --dither`, and compare with `agent-ascii diff --text`.

## One-shot: PNG + ASCII + diff

From the repo root (Chrome/Chromium required for headless capture):

```bash
npm run example:webpage
```

Or:

```bash
bash ./scripts/example-webpage-diff.sh
```

This builds `agent-ascii` if needed, writes `captures/basic.png` and `captures/top-third.png`, saves braille layout text next to them (with `--layout --negative --dither`), and writes `**layout-diff.txt**` (unified diff + header).

## Manual capture

Open either HTML file in a browser at **800×1200** (or use DevTools device mode), save full-page screenshots as `captures/basic.png` and `captures/top-third.png`, then:

```bash
go build -o agent-ascii .
./agent-ascii examples/webpage/captures/basic.png --layout --negative --dither --width 80 --save-txt examples/webpage/captures --only-save --save-txt-history=false
./agent-ascii examples/webpage/captures/top-third.png --layout --negative --dither --width 80 --save-txt examples/webpage/captures --only-save --save-txt-history=false
./agent-ascii diff --text \
  examples/webpage/captures/basic-ascii-art.txt \
  examples/webpage/captures/top-third-ascii-art.txt \
  > examples/webpage/layout-diff.txt
```

Generated files under `captures/` (`*.png`, `*-ascii-art.txt`) are gitignored. `**layout-diff.txt**` (repo root of `examples/webpage/`) and the HTML sources are committed as documentation of the drift between layouts.