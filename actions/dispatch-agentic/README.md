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
| `workflow-repo` | Yes | — | `owner/repo` containing the compiled agentic workflow — usually the calling repo itself (`${{ github.repository }}`) |
| `workflow-ref` | No | `main` | Branch, tag, or SHA to dispatch against |
| `workflow-file` | Yes | — | Filename of the **compiled** agentic workflow (e.g. `pr-review.lock.yml`) — never the `.md`; GitHub Actions only registers `.yml` files |
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
          workflow-repo: ${{ github.repository }}
          workflow-ref: main
          workflow-file: pr-review.lock.yml
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
as defined in the AI-SDLC architecture. The agentic workflow runs as an
independent workflow run in `workflow-repo` (normally the calling repo, which
vendors the compiled `.lock.yml` via `new-project.sh`) after the dispatch
succeeds.

For Pattern 1 (sequential handoff), place this action _after_ your
deterministic gates so the agentic workflow only runs when gates pass:

```yaml
steps:
  - uses: lhuasheng/shared-sdlc/actions/ci-gates@v1
    # ...
  - uses: lhuasheng/shared-sdlc/actions/dispatch-agentic@v1
    with:
      workflow-file: architecture-review.lock.yml
      # ...
```
