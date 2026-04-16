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
2. Use `--save-txt <dir> --only-save` in CI or automation so logs stay readable.
3. Use the files in `examples/screenshots/` for predictable smoke tests.
4. If a task needs GitHub Actions integration, use the repo’s `action.yml` surface instead of shelling out ad hoc.
