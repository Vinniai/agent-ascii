## General Rules

- MUST: Treat Go as the source of truth for conversion behavior. The npm layer is a launcher and distribution surface.
- MUST: Keep the root package version in sync with every package in `packages/npm/`.
- MUST: Keep `optionalDependencies` in the root `package.json` aligned with the platform package versions.
- MUST: Preserve the public surfaces:
  - `action.yml`
  - `skills/agent-ascii/SKILL.md`
  - `scripts/install-skill.sh`
- MUST: Prefer extending the current release model over introducing a second packaging system.
- MUST: Use the checked-in example screenshots for smoke tests when touching CLI behavior, launcher logic, or CI.
- MUST: Keep saved-output workflows quiet in CI by using `--only-save` when artifacts are the goal.
- MUST: Avoid repo-wide structural changes just to mirror another tool’s stack. Match functionality, not irrelevant implementation choices.

## Before Committing

Run the checks that apply to the changes:

```bash
npm run release:check
npm pack --dry-run
npm run smoke
```

If touching platform packages or CI packaging logic, also verify one platform package pack flow:

```bash
mkdir -p packages/npm/linux-x64/bin
go build -o packages/npm/linux-x64/bin/agent-ascii .
npm pack --dry-run ./packages/npm/linux-x64
rm -f packages/npm/linux-x64/bin/agent-ascii
```
