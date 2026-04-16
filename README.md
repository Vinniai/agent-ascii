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
- [CLI Usage](#cli-usage)
  - [Flags](#flags)
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

All examples use real screenshots from `examples/screenshots/`. Decrease terminal font size or increase width for best quality.

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

### Braille + dither (`--braille --dither`)

Dithering spreads pixel error across neighbors, giving sharper edges in braille mode.

```
agent-ascii examples/screenshots/google-desktop.png --width 80 --braille --dither
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

### Braille + dither on mobile (`--braille --dither`)

```
agent-ascii examples/screenshots/apple-mobile.png --width 60 --braille --dither
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
| `--dither` | | Apply dithering for braille conversion |
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
| `--save-gif path` | | Save GIF as ASCII art GIF |
| `--save-bg R,G,B,A` | | Background color for saved images (RGBA) |
| `--font path` | | Font .ttf file for saved images |
| `--font-color R,G,B` | | Font color for output and saved images |
| `--only-save` | | Skip terminal output when saving |
| `--formats` | | Show supported input formats |

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

---

## License

[Apache-2.0](https://github.com/Vinniai/agent-ascii/blob/master/LICENSE.txt) © 2021 Zoraiz Hassan
