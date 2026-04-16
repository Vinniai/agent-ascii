---
name: agent-ascii
description: Convert local files, URLs, or stdin into ASCII art. Use for smoke-testing image rendering, generating saved ASCII output, or previewing screenshots from this repo.
version: 1.0.0
---

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
4. If a task needs GitHub Actions integration, use the repo’s `action.yml` surface instead of shelling out ad hoc.
5. For colored terminal output, `diff` compares **stripped** text; stderr notes **color-only** changes when raw output differs but stripped text matches.
