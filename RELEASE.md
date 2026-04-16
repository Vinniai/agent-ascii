# Release Process for agent-ascii

## Overview
This document describes how to release agent-ascii to GitHub and npm.

## Prerequisites

### npm Account Setup
Before publishing to npm for the first time, you must:

1. **Create an @vinniai Organization** (for scoped packages)
   - Log in to npm.org as your account
   - Visit https://www.npmjs.com/org/create
   - Create a free organization named `vinniai`
   - This allows publishing packages under `@vinniai/*` scope

2. **Generate an npm Token**
   - Log in to https://www.npmjs.com
   - Go to Account Settings → Auth Tokens
   - Generate a new token with "Publish" permissions
   - Save this token securely

3. **Configure GitHub Secret**
   - Go to GitHub repo → Settings → Secrets and variables → Actions
   - Create secret `NPM_TOKEN` with the value from step 2
   - This allows the workflow to publish packages automatically

## Release Steps

### 1. Update Version
```bash
# Update package.json version
npm version patch  # or minor, major
# This automatically updates all package.json files and creates a git commit
```

### 2. Verify Everything
```bash
# Run validation
npm run release:check

# Run local smoke test
bash scripts/ci-smoke.sh

# Verify all platform packages are configured
for pkg in packages/npm/*/package.json; do jq '{name, version}' "$pkg"; done
```

### 3. Create and Push Release Tag
```bash
# Create tag (after version update)
git tag v1.0.0  # Match the version in package.json

# Push to GitHub (triggers release workflow)
git push origin v1.0.0
```

### 4. Monitor GitHub Actions
- Go to https://github.com/Vinniai/agent-ascii/actions
- Watch for the `release` workflow to complete
- Check both `publish-platform-packages` and `publish-root-package` jobs

## Release Workflow

The `.github/workflows/release.yml` workflow:

1. **release-assets** job
   - Runs on tag push (v*)
   - Builds cross-platform binaries using GoReleaser
   - Creates GitHub Release with binary assets
   - Runs: `goreleaser release --clean`

2. **publish-platform-packages** job
   - Depends on: `release-assets`
   - Matrix job for 5 platforms:
     - darwin-arm64, darwin-x64 (macOS)
     - linux-arm64, linux-x64 (Linux)
     - win32-x64 (Windows)
   - Builds platform binaries
   - Publishes to npm as `@vinniai/{platform}@version`

3. **publish-root-package** job
   - Depends on: `release-assets`
   - Publishes root package as `agent-ascii@version`
   - References platform packages as optional dependencies

## Package Structure

### Root Package
- **Name**: `agent-ascii`
- **Location**: repo root
- **Binary wrapper**: `bin/agent-ascii.js`
- **Downloads platform packages on install**

### Platform Packages
- **Names**: `@vinniai/{darwin-arm64,darwin-x64,linux-arm64,linux-x64,win32-x64}`
- **Location**: `packages/npm/{platform}/`
- **Contains**: Pre-built binary for that platform
- **Optional**: Listed in root package's `optionalDependencies`

## Troubleshooting

### npm 404 Errors
**Problem**: `npm error 404 Not Found - PUT https://registry.npmjs.org/agent-ascii`

**Solution**: Ensure npm account is set up (see Prerequisites section)
- Create @vinniai organization on npm.org
- Verify NPM_TOKEN has publish permissions
- Check that scoped packages don't have naming conflicts

### GoReleaser Errors
Check `.goreleaser.yml` configuration:
- Version must be set to `version: 2`
- Binary name must match across all platforms
- LDFLAGS must have correct import path

### Validation Failures
Run `npm run release:check` to identify issues:
- Version mismatch between root and platform packages
- Missing required files for release
- Incorrect optional dependency references

## Local Testing

To test the installation flow locally:

```bash
# Build local binary
./scripts/test-local.sh

# Test root package
npm install --no-save .

# Test agent-ascii command
npx agent-ascii --help
```

## Rollback

If a release has issues and needs to be removed:

```bash
# Delete GitHub release
gh release delete v1.0.0 --yes

# Delete npm packages
npm unpublish agent-ascii@1.0.0
npm unpublish @vinniai/darwin-arm64@1.0.0
# ... repeat for other platform packages

# Delete git tag
git tag -d v1.0.0
git push origin :refs/tags/v1.0.0
```

## References

- GoReleaser: https://goreleaser.com
- npm Scoped Packages: https://docs.npmjs.com/cli/v10/using-npm/scope
- npm Organizations: https://docs.npmjs.com/orgs
- GitHub Actions: https://docs.github.com/en/actions
