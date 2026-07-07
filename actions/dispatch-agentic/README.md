# dispatch-agentic

Composite action that routes a human slash-command or automated trigger to a
**GitHub Agentic Workflow** (Integration Pattern 4: shared-sdlc dispatches
agentic workflows).

Use this action whenever a deterministic workflow needs to hand off a reasoning
task to the agentic layer — for example, responding to a `/ai-review` PR
comment or dispatching release-notes generation after a tag push.

---

## Inputs

| Input | Required | Default | Description |
|---|---|---|---|
| `github-token` | Yes | — | Token with `actions:write` on `workflow-repo` |
| `workflow-repo` | Yes | — | `owner/repo` containing the agentic workflow (e.g. `lhuasheng/.github`) |
| `workflow-ref` | No | `main` | Branch, tag, or SHA to dispatch against |
| `workflow-file` | Yes | — | Filename of the agentic workflow (e.g. `pr-review.md`) |
| `payload` | No | `{}` | JSON string of inputs to forward to the agentic workflow |

## Outputs

| Output | Description |
|---|---|
| `dispatch-status` | HTTP status code returned by the workflow dispatch API call (expect `204`) |

---

## Example caller

```yaml
# .github/workflows/ai-review-dispatch.yml
on:
  issue_comment:
    types: [created]

jobs:
  dispatch-review:
    if: |
      github.event.issue.pull_request &&
      startsWith(github.event.comment.body, '/ai-review')
    runs-on: ubuntu-latest
    permissions:
      actions: write
    steps:
      - uses: lhuasheng/shared-sdlc/actions/dispatch-agentic@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          workflow-repo: lhuasheng/.github
          workflow-ref: v1.0.0
          workflow-file: pr-review.md
          payload: |
            {
              "pr_number": "${{ github.event.issue.number }}",
              "repository": "${{ github.repository }}",
              "triggered_by": "${{ github.actor }}"
            }
```

---

## Integration pattern

This action implements **Pattern 4 (shared-sdlc dispatches agentic workflows)**
as defined in the AI-SDLC architecture. The agentic workflow runs independently
in the `lhuasheng/.github` repository runtime after the dispatch succeeds —
agentic workflow files live in that repo's `.github/workflows/` rather than a
separate `shared-agentic` repository.

For Pattern 1 (sequential handoff), place this action _after_ your
deterministic gates so the agentic workflow only runs when gates pass:

```yaml
steps:
  - uses: lhuasheng/shared-sdlc/actions/ci-gates@v1
    # ...
  - uses: lhuasheng/shared-sdlc/actions/dispatch-agentic@v1
    with:
      workflow-file: architecture-review.md
      # ...
```
