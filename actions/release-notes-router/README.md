# release-notes-router

Composite action that dispatches the `release-notes` agentic workflow when a
semver tag is pushed to a project repository (Integration Pattern 4:
shared-sdlc dispatches agentic workflows).

The agentic workflow drafts release notes as a pull request for human review
before the release is published.

---

## Inputs

| Input | Required | Default | Description |
|---|---|---|---|
| `github-token` | Yes | — | Token with `actions:write` on `agentic-workflow-repo` |
| `agentic-workflow-repo` | Yes | — | `owner/repo` containing `release-notes.md` |
| `agentic-workflow-ref` | No | `main` | Ref to dispatch against |
| `base-tag` | No | `''` | Previous tag for comparison (auto-detected if empty) |

---

## Example caller

```yaml
# .github/workflows/release.yml
on:
  push:
    tags: ['v*']

jobs:
  release-notes:
    runs-on: ubuntu-latest
    permissions:
      actions: write
    steps:
      - uses: lhuasheng/shared-sdlc/actions/release-notes-router@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          agentic-workflow-repo: lhuasheng/.github
          agentic-workflow-ref: v1.0.0
```

---

## What happens

1. The action validates that the pushed tag matches the semver pattern `vX.Y.Z`.
2. If valid, it calls `dispatch-agentic` to trigger `release-notes.md` in
   the agentic workflow repository.
3. The agentic workflow opens a draft PR with generated release notes for
   human review.
4. A human reviews and edits the draft, then publishes the release.

Non-semver tags (e.g. `beta-1`, `nightly`) are silently skipped.
