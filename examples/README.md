# Example Inputs

This directory contains public website screenshots captured with `agent-browser` for local smoke testing, plus small HTML examples for layout diffs.

## Web wordmark + layout diff

- `webpage/agent-ascii-basic.html` — centered title
- `webpage/agent-ascii-top-third.html` — title in the upper third
- See `webpage/README.md` and run `npm run example:webpage` to regenerate `webpage/layout-diff.txt` (requires Chrome/Chromium for headless PNG capture).

## Screenshots (smoke)

Files:

- `screenshots/tesla-mobile.png`
- `screenshots/tesla-desktop.png`
- `screenshots/x-mobile.png`
- `screenshots/apple-mobile.png`
- `screenshots/apple-desktop.png`
- `screenshots/google-mobile.png`
- `screenshots/google-desktop.png`

## Local Testing

Published npm installs use prebuilt platform packages, so end users do not need Go. A source checkout is different: the repo does not commit binaries, so local testing from git still requires Go to build a fallback binary in `vendor/`.

```bash
npm install
./scripts/test-local.sh
```

Or build the binary directly:

```bash
go build -o vendor/agent-ascii .
npx agent-ascii examples/screenshots/google-desktop.png --width 120
```

The repo CI uses these same screenshots through `npm run smoke` and the local `action.yml` self-test workflow.

## Batch Smoke Test

Use the helper script to run several conversions in a row:

```bash
./scripts/test-local.sh
```
