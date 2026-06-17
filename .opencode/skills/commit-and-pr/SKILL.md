---
name: commit-and-pr
description: Use when committing changes or creating pull requests in this repo. Covers conventional commits, DCO sign-off, the lint-staged pre-commit hook, and PR conventions.
---

# Commit and PR Workflow

This repository enforces strict commit and PR conventions through Husky hooks
and CI checks. Follow these rules to avoid repeated commit failures and CI
rejections.

## Commit message format

Conventional commits are enforced via commitlint:

```
<type>[optional scope]: <description>
```

Allowed types: `build`, `chore`, `ci`, `docs`, `feat`, `fix`, `perf`,
`refactor`, `revert`, `style`, `test`.

Examples:

```
fix: resolve crash when loading large .opossum files
feat(attribution-form): add license expression autocomplete
chore: update dependency versions
```

Body max line length is 600 characters.

## DCO sign-off

Every commit must include a `Signed-off-by:` trailer. Use:

```bash
git commit -s -m "type: description"
```

The `-s` flag adds the trailer automatically from your `user.name` and
`user.email` config.

## Pre-commit hook

Husky runs `yarn pre-commit` (lint-staged) on every commit. It checks **all
files in the repo**, not just the ones you staged. This means your commit can
fail due to issues in files you did not touch.

What lint-staged runs:

| Pattern                                 | Checks                                                                   |
| --------------------------------------- | ------------------------------------------------------------------------ |
| `*` (all files)                         | `yarn copyright-lint-check`, `knip`, `prettier --write --ignore-unknown` |
| `*.{ts,tsx}`                            | `eslint`                                                                 |
| `!(src/ElectronBackend/**/*)*.{ts,tsx}` | `tsc -p ./` (frontend + shared)                                          |
| `src/ElectronBackend/**/*.{ts,tsx}`     | `yarn db:generate` then `tsc --noEmit -p src/ElectronBackend`            |

### When the hook fails on unrelated files

If the hook fails due to issues in files outside your change (e.g. missing
copyright headers in other repo files), you can bypass it with `--no-verify`,
but only when your own staged changes are compliant. Fix the root cause
separately.

```bash
git commit --no-verify -s -m "type: description"
```

### When the hook fails on your files

Fix the issues rather than bypassing. Common fixes:

- Missing copyright header → add it (see the `add-copyright-headers` skill)
- Prettier formatting → run `yarn format`
- ESLint errors → run `yarn lint` (fixes automatically) or `yarn lint-check`
  (check only)
- TypeScript errors → run `yarn typecheck`
- Knip unused exports → remove the dead code

## Creating a pull request

- Target the `main` branch.
- Use conventional commit format for the PR title (same format as commit
  messages).
- Use `gh pr create` with a clear description of the change and its motivation.
- CI runs: `format-check`, `lint-check`, `typecheck`, `circular-import-check`,
  `knip`, `test:unit`, `test:e2e:ci`, and `copyright-lint-check`.

## Commit lint for PRs

CI runs `yarn lint-commits` which checks every commit in the PR against
`origin/main`. All commits in the branch must follow conventional commit format,
not just the latest one.
