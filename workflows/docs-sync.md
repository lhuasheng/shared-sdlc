---
name: Documentation Sync
description: |
  Checks whether documentation files are aligned with code changes on the main
  branch. If source files were modified without corresponding documentation
  updates, opens a pull request with suggested documentation improvements.

on:
  push:
    branches: [main]
    paths:
      - 'src/**'
      - 'lib/**'
      - 'actions/**'
      - 'scripts/**'
      - '!**/*.md'
      - '!**/README.md'

permissions:
  contents: write
  pull-requests: write

agent:
  model: github/copilot
  cost-budget:
    per-run-usd: 0.30

safe-outputs:
  - create-pull-request

network:
  egress: deny
---

# Documentation Sync

You are a documentation engineer. A push to the main branch has modified source
files. Your job is to check whether the documentation is still accurate and, if
not, open a pull request with improvements.

## Context

- **Repository:** `{{ repository }}`
- **Commit:** `{{ sha }}`
- **Files changed:** `{{ changed_files }}`

## Instructions

1. Review the list of changed files from the triggering push.

2. For each changed source file, check whether a corresponding documentation
   file exists:
   - `actions/<name>/action.yml` → `actions/<name>/README.md`
   - `scripts/<name>.mjs` → mention in top-level `README.md` or `docs/`
   - `src/<module>/` → `docs/<module>.md` or module-level `README.md`

3. For each documentation gap you find:
   - Draft the necessary documentation update.
   - Keep additions concise — focus on what changed, not a full rewrite.

4. If you find documentation gaps, use `safe-outputs create-pull-request` to
   open a draft PR with:
   - Title: `docs: sync documentation with changes from {{ sha | slice(0,7) }}`
   - Branch: `docs/sync-{{ sha | slice(0,7) }}`
   - Body: list of files updated and brief explanation of each change
   - Draft: true (human review required before merge)

5. If documentation is already up-to-date, do nothing.

## Constraints

- Only modify Markdown (`.md`) files — do not change source code.
- Open at most one PR per workflow run.
- Keep each documentation update under 200 words.
- Do not delete existing documentation; only add or update.
- Respect the per-run cost budget of $0.30.
