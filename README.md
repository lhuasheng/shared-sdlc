# shared-sdlc

Reusable composite GitHub Actions and helper scripts that implement the AI-SDLC
gates. Every project repo in the org points its thin workflow files at the
actions in this repo, so the gate logic lives in one place.

> **This repo must be public** if your project repos are public, or accessible
> to your org via a GitHub App / `ACTIONS_RUNTIME_TOKEN` if private — otherwise
> the `uses: org/shared-sdlc/...` references won't resolve.

## What's in here

```
actions/
  ci-gates/            ← Gate 4: lint, test, PR size, security, spec link
  ai-pr-review/        ← Gate 3: /ai-review command → Claude review comment
  weekly-review/       ← Gate 3: Monday 9am → Claude pattern review issue
scripts/
  pr-review.mjs        ← Claude API call for a single PR
  weekly-review.mjs    ← Claude API call for the weekly digest
  collect-diffs.mjs    ← Pulls each week's PR diffs via gh
```

## How a project repo uses these

Project repos contain **thin caller workflows** (~15 lines each) that invoke
the composite actions. See `project-1/.github/workflows/` for working examples.

```yaml
# project-1/.github/workflows/ci.yml
- uses: lhuasheng/shared-sdlc/actions/ci-gates@main
  with:
    node-version: '20'
    test-cmd: 'npm run test:coverage'
```

Change a gate's logic here once and every project picks it up on the next CI
run.

## Versioning

Pin project repos to a tag (e.g. `@v1`) once the gates stabilise. Bump the tag
when you intentionally roll out a behaviour change. Floating `@main` is fine
while the team is still iterating on the gates.

## Required secrets in project repos

| Secret | Used by |
|---|---|
| `ANTHROPIC_API_KEY` | `ai-pr-review`, `weekly-review` |
| `GITHUB_TOKEN` (provided automatically) | All actions |

## Adapting for non-Node stacks

`ci-gates` exposes inputs for every command (`lint-cmd`, `typecheck-cmd`,
`test-cmd`, `install-cmd`). Set them to your stack's equivalents, or set them
to an empty string to skip that step. The PR-size, secret-scan, and spec-link
steps are language-agnostic and run regardless.
