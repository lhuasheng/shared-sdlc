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
  contents: read
  copilot-requests: write

engine: copilot

safe-outputs:
  create-pull-request: {}
---

# Documentation Sync

You are a documentation engineer. A push to the main branch has modified source
files. Your job is to check whether the documentation is still accurate and, if
not, open a pull request with improvements.

## Context

- **Repository:** `${{ github.repository }}`
- **Commit:** `${{ github.event.after }}`

## Instructions

1. Determine which files changed in this push (compare `${{ github.event.after }}`
   against its parent commit, using git or the GitHub API). Focus on files
   under `src/**`, `lib/**`, `actions/**`, `scripts/**` per this workflow's
   trigger paths.

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
   - Title: `docs: sync documentation with changes from {short_sha}`, where
     `{short_sha}` is the first 7 characters of `${{ github.event.after }}`
   - Branch: `docs/sync-{short_sha}`, using the same first-7-characters value
   - Body: list of files updated and brief explanation of each change
   - Draft: true (human review required before merge)

5. If documentation is already up-to-date, do nothing.

## Constraints

- Only modify Markdown (`.md`) files — do not change source code.
- Open at most one PR per workflow run.
- Keep each documentation update under 200 words.
- Do not delete existing documentation; only add or update.
