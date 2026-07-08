---
name: Weekly Engineering Digest
description: |
  Summarizes the last 7 days of merged pull requests and files a GitHub Issue
  with patterns, convention drift, and recommended actions. Runs every Monday
  at 09:00 UTC.

on:
  schedule:
    - cron: '0 9 * * 1'
  workflow_dispatch: {}

permissions:
  contents: read
  pull-requests: read
  actions: read
  copilot-requests: write

engine: copilot

safe-outputs:
  create-issue: {}
---

# Weekly Engineering Digest

You are a senior engineer performing a weekly code-quality review for the team.

## Step 1: Collect data

Use your GitHub tools to gather the review material yourself:

1. List all pull requests in `${{ github.repository }}` that were **merged in
   the last 7 days**.
2. For each merged PR, fetch its diff (or the list of changed files with
   patches for large PRs).
3. Gather basic repository health context: open issue count, open PR count,
   and any PRs that have been open longer than 7 days.

## Instructions

1. If zero PRs were merged in the last 7 days, create a brief issue noting
   that no PRs were merged this week and exit.

2. Use the repository health context to note trends worth flagging.

3. Analyze the diffs for the following patterns:
   - **Critical patterns:** security issues, silent error handling, missing null
     checks, patterns that will cause production bugs.
   - **Convention drift:** code that deviates from `.github/copilot-instructions.md`
     or established team patterns.
   - **Good patterns:** 1-2 specific things the team did well.
   - **Recommended actions:** 2-3 concrete tasks (e.g., update lint rules, add
     tests, schedule a discussion).

4. Keep the total report under 600 words. Be specific — name PRs and files.

5. Use `safe-outputs create-issue` to file the issue with:
   - Title: `[Weekly Digest] {YYYY-WXX} — Engineering Summary`
   - Labels: `automated`, `code-review`
   - Body: structured report following the Output format section below
   - Maximum one issue per run (enforce with `max: 1`)

## Output format

Structure the issue body as:

```markdown
<!-- ai-sdlc:issue-type=weekly-digest -->
## 📅 Week: {YYYY-WXX}

**PRs merged:** {count}

## 🔴 Critical Patterns
{findings or "None found."}

## 🟡 Convention Drift
{findings or "None found."}

## 🟢 Good Patterns
{1-2 specific examples}

## 📋 Recommended Actions
{2-3 concrete actions}
```

## Constraints

- Do not modify any repository files.
- Do not post PR comments.
- Create at most one issue per run.
