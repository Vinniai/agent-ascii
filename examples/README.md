# Example Inputs

This directory contains public website screenshots captured with `agent-browser` for local smoke testing.

Files:

- `screenshots/tesla-mobile.png`
- `screenshots/tesla-desktop.png`
- `screenshots/x-mobile.png`
- `screenshots/apple-mobile.png`
- `screenshots/apple-desktop.png`
- `screenshots/google-mobile.png`
- `screenshots/google-desktop.png`

## Local Testing

From a git checkout, the npm package tries to build the native binary from source during install if `go` is available.

```bash
npm install
npx agent-ascii examples/screenshots/apple-mobile.png
```

If `go` was not installed when `npm install` ran, install Go and rebuild:

```bash
npm rebuild agent-ascii
```

Or build the binary directly:

```bash
go build -o vendor/agent-ascii .
npx agent-ascii examples/screenshots/google-desktop.png --width 120
```

## Batch Smoke Test

Use the helper script to run several conversions in a row:

```bash
./scripts/test-local.sh
```
