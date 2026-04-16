# agent-ascii

[![release-version](https://img.shields.io/github/v/release/Vinniai/agent-ascii?label=Latest%20Version)](https://github.com/Vinniai/agent-ascii/releases/latest)
[![license](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://github.com/Vinniai/agent-ascii/blob/master/LICENSE.txt)
[![language](https://img.shields.io/badge/Language-Go-blue)](https://golang.org/)
![release-downloads](https://img.shields.io/github/downloads/Vinniai/agent-ascii/total?color=1d872d&label=Release%20Downloads)

Convert images and GIFs into ASCII art in your terminal. Available on Windows, Linux and macOS — no Go required via npx.

Supports both ASCII character maps and braille patterns. Optimized for rendering UI screenshots, web pages, and photos.

> Inspired by [ascii-image-converter](https://github.com/TheZoraiz/ascii-image-converter) by Zoraiz Hassan.

**Supported input formats:** JPEG · PNG · BMP · WEBP · TIFF · GIF

---

## Table of Contents

- [Installation](#installation)
  - [npx](#npx)
  - [npm Global Install](#npm-global-install)
  - [GitHub Action](#github-action)
  - [Agent Skill](#agent-skill)
  - [Go](#go)
  - [Release Binaries](#release-binaries)
- [Examples](#examples)
  - [HTML layout (wordmark diff)](#html-layout-wordmark-diff)
- [CLI Usage](#cli-usage)
  - [Flags](#flags)
  - [Comparison / diff](#comparison--diff)
- [Automation](#automation)
- [Library Usage](#library-usage)
- [Packages Used](#packages-used)
- [License](#license)

---

## Installation

### npx

Run directly without installing:

```
npx agent-ascii ./image.png
```

The package downloads a prebuilt OS-specific binary on first run. No Go installation required.

### npm Global Install

```
npm install --global agent-ascii
```

Then run:

```
agent-ascii ./image.png
```

### GitHub Action

```yaml
- uses: Vinniai/agent-ascii@v1
  with:
    paths: |
      examples/screenshots/apple-mobile.png
      examples/screenshots/google-desktop.png
    flags: --width 72
    output-dir: .agent-ascii-out
```

By default the action saves `.txt` artifacts with `--only-save`.

### Agent Skill

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/Vinniai/agent-ascii/main/scripts/install-skill.sh)
```

Manual install target:

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/Vinniai/agent-ascii/main/scripts/install-skill.sh) --dir "$HOME/.codex/skills"
```

### Go

```
go install github.com/Vinniai/agent-ascii@latest
```

### Release Binaries

Download for your platform from the [releases page](https://github.com/Vinniai/agent-ascii/releases/latest), extract, and copy to your `PATH`:

```bash
# macOS / Linux
sudo cp agent-ascii /usr/local/bin/

# Windows — place agent-ascii.exe in a directory on your PATH
```

---

## Examples

Most examples below use real screenshots from `examples/screenshots/`. Decrease terminal font size or increase width for best quality.

### HTML layout (wordmark diff)

Two minimal pages in [`examples/webpage/`](examples/webpage/) render the **agent-ascii** wordmark in **JetBrains Mono** (Google Fonts):

| File | Layout |
|------|--------|
| [`agent-ascii-basic.html`](examples/webpage/agent-ascii-basic.html) | Title centered in the viewport |
| [`agent-ascii-top-third.html`](examples/webpage/agent-ascii-top-third.html) | Same styling; title in the **upper third** (`grid-template-rows: 1fr 2fr`) |

Take screenshots at **800×1200**, run with `--layout`, then compare the saved text outputs:

```bash
npm run example:webpage
```

This runs [`scripts/example-webpage-diff.sh`](scripts/example-webpage-diff.sh): headless Chrome screenshots → `examples/webpage/captures/*.png` (gitignored) → braille layout with `--layout --negative --dither` → `*-ascii-art.txt` (gitignored) → unified diff **`examples/webpage/layout-diff.txt`** (checked in).

**Without Chrome:** open each HTML file in a browser, save full-page captures as `captures/basic.png` and `captures/top-third.png`, then follow the manual steps in [`examples/webpage/README.md`](examples/webpage/README.md) (same `diff --text` flow).

### Basic ASCII (`--width 80`)

```
agent-ascii examples/screenshots/google-desktop.png --width 80
```

<p align="center">
  <img src="https://raw.githubusercontent.com/Vinniai/agent-ascii/main/examples/outputs/01-basic.png" width="700">
</p>

### Complex character range (`--complex`)

Uses a wider ASCII character set for more tonal detail.

```
agent-ascii examples/screenshots/google-desktop.png --width 80 --complex
```

<p align="center">
  <img src="https://raw.githubusercontent.com/Vinniai/agent-ascii/main/examples/outputs/02-complex.png" width="700">
</p>

### Braille (`--braille`)

Uses Unicode braille patterns — terminal must support UTF-8.

```
agent-ascii examples/screenshots/google-desktop.png --width 80 --braille
```

<p align="center">
  <img src="https://raw.githubusercontent.com/Vinniai/agent-ascii/main/examples/outputs/03-braille.png" width="700">
</p>

### Braille + dither (`--braille`; dither on by default)

Dithering spreads pixel error across neighbors, giving sharper edges in braille mode. **Dithering is enabled by default** with `--braille` (`-D` / `--dither`; use `--dither=false` to match the previous off-by-default behavior).

```
agent-ascii examples/screenshots/google-desktop.png --width 80 --braille
```

<p align="center">
  <img src="https://raw.githubusercontent.com/Vinniai/agent-ascii/main/examples/outputs/04-braille-dither.png" width="700">
</p>

### Layout mode (`--layout`)

Optimized for inspecting UI screenshots and web pages — auto-selects braille with adaptive contrast and dithering.

```
agent-ascii examples/screenshots/google-desktop.png --width 80 --layout
```

<p align="center">
  <img src="https://raw.githubusercontent.com/Vinniai/agent-ascii/main/examples/outputs/05-layout.png" width="700">
</p>

### Negative (`--negative`)

Inverts the character density, useful for light-background images.

```
agent-ascii examples/screenshots/apple-mobile.png --width 60 --negative
```

<p align="center">
  <img src="https://raw.githubusercontent.com/Vinniai/agent-ascii/main/examples/outputs/06-negative.png" width="500">
</p>

### Custom character map (`--map`)

Define your own character gradient from darkest to lightest.

```
agent-ascii examples/screenshots/apple-mobile.png --width 60 --map " .-=+#@"
```

<p align="center">
  <img src="https://raw.githubusercontent.com/Vinniai/agent-ascii/main/examples/outputs/07-complex-map.png" width="500">
</p>

### Braille + dither on mobile (`--braille`)

```
agent-ascii examples/screenshots/apple-mobile.png --width 60 --braille
```

<p align="center">
  <img src="https://raw.githubusercontent.com/Vinniai/agent-ascii/main/examples/outputs/08-braille-dither-mobile.png" width="500">
</p>

---

## CLI Usage

> **Tip:** Decrease font size or zoom out your terminal for maximum quality.

```
agent-ascii [image paths/urls or piped stdin] [flags]
```

Piped input is also supported:

```bash
cat myImage.png | agent-ascii -
```

### Flags

| Flag | Short | Description |
|------|-------|-------------|
| `--color` | `-C` | Display in original image colors (requires 24-bit/8-bit terminal) |
| `--color-bg` | | Apply color to character background instead of foreground |
| `--braille` | `-b` | Use Unicode braille characters instead of ASCII |
| `--dither` | `-D` | Apply dithering for braille conversion (**default: on**; no-op without `--braille`; `--dither=false` to disable). Short **`-d` is `--dimensions`**, not dither. |
| `--threshold N` | | Braille on/off threshold (0–255, default: 128) |
| `--layout` | | Optimize for UI/webpage screenshot inspection |
| `--complex` | `-c` | Extended ASCII character range for more detail |
| `--map "chars"` | `-m` | Custom character gradient, darkest to lightest |
| `--grayscale` | `-g` | Grayscale output |
| `--negative` | `-n` | Invert colors |
| `--width N` | `-W` | Output width in characters (maintains aspect ratio) |
| `--height N` | `-H` | Output height in characters (maintains aspect ratio) |
| `--dimensions W,H` | `-d` | Explicit width and height in characters |
| `--full` | `-f` | Fill terminal width |
| `--flipX` | `-x` | Flip horizontally |
| `--flipY` | `-y` | Flip vertically |
| `--save-img path` | `-s` | Save as PNG to path |
| `--save-txt path` | | Save as text file |
| `--save-txt-history` | | With `--save-txt`, write `*-ascii-art-latest.txt` and **overwrite** a dotfile `.*-ascii-art.history` with the **previous** run’s text (same stem each time; no growing append). Git-friendly: ignore the dotfile. Default **on** when `CI` is set; use `--save-txt-history=false` for overwrite-only `*-ascii-art.txt` |
| `--diff-vs-last` | | With `--save-txt-history`, print a unified diff vs the previous snapshot to **stderr** |
| `--diff-last-fail` | | With `--save-txt-history`, exit **1** when the new output differs from the previous snapshot (CI gate; combine with `--diff-vs-last` to see the diff) |
| `--save-gif path` | | Save GIF as ASCII art GIF |
| `--save-bg R,G,B,A` | | Background color for saved images (RGBA) |
| `--font path` | | Font .ttf file for saved images |
| `--font-color R,G,B` | | Font color for output and saved images |
| `--only-save` | | Skip terminal output when saving |
| `--formats` | | Show supported input formats |

### Comparison / diff

Compare two rendered outputs with a **unified diff** (similar to `git diff`). ANSI escape sequences are **stripped** before diffing so line changes stay readable when using `--color`. If the raw strings differ only in styling, a notice is printed to **stderr** while the exit code stays **0** (stripped text matches).

**Exit codes:** `0` = same after stripping ANSI, `1` = different, `2` = error.

**Two images (or URLs)** — same flags apply to both conversions; `--save-*` and `--only-save` are ignored for `diff`:

```bash
agent-ascii diff examples/screenshots/apple-mobile.png examples/screenshots/google-desktop.png --width 40
```

**Two saved text files** (e.g. from `--save-txt --only-save`):

```bash
agent-ascii diff --text ./out/before-ascii-art.txt ./out/after-ascii-art.txt
```

For an end-to-end demo (HTML wordmark pages → screenshots → saved ASCII → **`examples/webpage/layout-diff.txt`**), see [HTML layout (wordmark diff)](#html-layout-wordmark-diff).

**Tracked snapshots over time** — with `--save-txt` and `--save-txt-history` (on by default under `CI`), each run overwrites `*-ascii-art-latest.txt` and **overwrites** `.<name>-ascii-art.history` with the prior run’s text (one slot per stem, not an append log). Previous output for diffing is taken from `latest`, then legacy numbered `*-ascii-art-*.txt` if present, then legacy `*-ascii-art.txt`, then the history dotfile (plain text; older append-only history files are still read for migration). Use `--diff-vs-last` for a git-style unified diff on stderr, and `--diff-last-fail` to fail when output drifts.

---

## Automation

Three automation surfaces ship with this repo:

| Surface | Path | Purpose |
|---------|------|---------|
| GitHub Action | `action.yml` | Reusable action for CI and PR workflows |
| Agent Skill | `skills/agent-ascii/SKILL.md` | Public skill for AI agent setups |
| Agent Rules | `AGENTS.md` | Contributor and in-repo agent guidelines |

Use screenshots in `examples/screenshots/` for repeatable smoke tests in CI.

---

## Library Usage

```
go get -u github.com/Vinniai/agent-ascii/aic_package
```

```go
package main

import (
	"fmt"
	"github.com/Vinniai/agent-ascii/aic_package"
)

func main() {
	flags := aic_package.DefaultFlags()
	flags.Width = 80
	flags.Braille = true
	flags.Dither = true

	asciiArt, err := aic_package.Convert("myImage.png", flags)
	if err != nil {
		fmt.Println(err)
		return
	}
	fmt.Print(asciiArt)
}
```

> **Note:** For headless environments (web servers, CI), set at least one of `flags.Width`, `flags.Height`, or `flags.Dimensions` — terminal size detection won't be available.

---

## Packages Used

- [github.com/spf13/cobra](https://github.com/spf13/cobra)
- [github.com/fogleman/gg](https://github.com/fogleman/gg)
- [github.com/mitchellh/go-homedir](https://github.com/mitchellh/go-homedir)
- [github.com/nathan-fiscaletti/consolesize-go](https://github.com/nathan-fiscaletti/consolesize-go)
- [github.com/disintegration/imaging](https://github.com/disintegration/imaging)
- [github.com/gookit/color](https://github.com/gookit/color)
- [github.com/makeworld-the-better-one/dither](https://github.com/makeworld-the-better-one/dither)
- [github.com/pmezard/go-difflib](https://github.com/pmezard/go-difflib)

---

## License

[Apache-2.0](https://github.com/Vinniai/agent-ascii/blob/master/LICENSE.txt) © 2021 Zoraiz Hassan
