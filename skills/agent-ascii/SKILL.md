---

## name: agent-ascii

description: Convert local files, URLs, or stdin into ASCII art. Use for smoke-testing image rendering, generating saved ASCII output, or previewing screenshots from this repo.
version: 1.0.0

# agent-ascii

Render images and GIFs into terminal ASCII or braille art.

## When to Use

- Converting a local image into ASCII for inspection
- Saving `.txt` or `.png` ASCII output from screenshots
- Smoke-testing the checked-in example screenshots in this repo
- Converting a URL or piped stdin without manually installing Go
- Comparing two renders (before/after) with `diff` — two images with the same flags, or two `.txt` files via `--text`

## Typical Usage

Published package:

```bash
npx -y agent-ascii@latest ./image.png --width 80
```

Save text output:

```bash
npx -y agent-ascii@latest ./image.png --save-txt . --only-save
```

Use a checked-in smoke-test image from this repo:

```bash
npx -y agent-ascii@latest examples/screenshots/apple-mobile.png --width 80
```

Pipe binary input:

```bash
cat examples/screenshots/google-mobile.png | npx -y agent-ascii@latest - --width 72
```

Compare two screenshots (unified diff; ANSI stripped for readability; exit `1` if different):

```bash
npx -y agent-ascii@latest diff ./before.png ./after.png --width 80
```

Compare two saved text outputs:

```bash
npx -y agent-ascii@latest diff --text ./out/a-ascii-art.txt ./out/b-ascii-art.txt
```

**Flags:** With `--braille`, dither is **on** by default (`-D` / `--dither`; use `--dither=false` to disable). Short `-d` is `--dimensions`, not dither.

## Source Checkout Notes

End users of the published npm package do not need Go.

If you are working from a git checkout and the local launcher has no bundled binary yet, build one first:

```bash
./scripts/test-local.sh
```

Or:

```bash
go build -o vendor/agent-ascii .
node ./bin/agent-ascii.js examples/screenshots/x-mobile.png --width 80
```

## Workflow

1. Prefer `npx -y agent-ascii@latest` for published usage.
2. Use `--save-txt <dir> --only-save` in CI or automation so logs stay readable. Under `CI`, `--save-txt-history` defaults on: only `*-ascii-art-latest.txt` in the tree; the dotfile `.*-ascii-art.history` holds the **previous** run and is **overwritten** each time (ignore in git). Use `--save-txt-history=false` to keep a single `*-ascii-art.txt`. `--diff-vs-last` prints a unified diff vs the prior snapshot; `--diff-last-fail` exits 1 on drift.
3. Use the files in `examples/screenshots/` for predictable smoke tests.
4. If a task needs GitHub Actions integration, use the repo's `action.yml` surface instead of shelling out ad hoc.
5. For colored terminal output, `diff` compares **stripped** text; stderr notes **color-only** changes when raw output differs but stripped text matches.

## Browser Automation Companion

Pair agent-ascii with a headless browser (e.g. `agent-browser`) to keep context small while still "seeing" the page. Pattern: **tree for clicks, ASCII for eyes**.

- **Clicks and navigation** — use the browser's accessibility snapshot (`agent-browser snapshot -i`). It already carries semantic refs (`@e1`, `@e2`) and is typically 6–12 KB per page. Do not try to extract click targets from ASCII — braille/ASCII output has no element identity.
- **Visual verification** — render the raw screenshot through `agent-ascii --layout --width 60` (≈3 KB) or `--width 100` (≈9 KB). Use this to confirm the hero rendered, a modal opened, the page didn't break — not to decide what to click.
- **Drift gate** — combine `--save-txt --save-txt-history --diff-vs-last --diff-last-fail` to turn any screenshot step into a cheap CI regression signal.

Benchmark (apple.com → /mac/ → /mac-mini/, 3 steps):

| Approach | Total bytes fed to model |
|---|---|
| snapshot only | ~30 KB |
| snapshot + ASCII @ width 60 | ~40 KB |
| snapshot + ASCII @ width 100 | ~58 KB |
| annotated JPEG screenshots | ~300 KB (and image tokens cost more per byte) |

**When ASCII beats image tokens**: smoke tests, layout-drift gates, "did anything visible break" checks. **When to reach for an image instead**: color verification, fine-grained visual review, canvas/chart content, or debugging a specific pixel-level issue.

Minimal companion flow:

```bash
# 1. Navigate + get refs (tree)
agent-browser open https://example.com && agent-browser snapshot -i

# 2. Act using refs
agent-browser click @e5 && agent-browser wait --load networkidle

# 3. Capture + ASCII-verify (eyes) — cheap visual confirmation
agent-browser screenshot --screenshot-dir ./shots
npx -y agent-ascii@latest ./shots/screenshot-*.png --layout --width 60 \
  --save-txt ./shots --only-save --save-txt-history --diff-vs-last
```

