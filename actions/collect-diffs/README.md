# collect-diffs

Composite action that fetches the unified diff for every merged PR in a
supplied list and writes a `diffs.json` artifact conforming to
[`schemas/diffs.schema.json`](../../schemas/diffs.schema.json).

This action wraps `scripts/collect-diffs.mjs` so that agentic workflows can
consume structured diff data as a pre-step (Integration Patterns 2 and 3).

---

## Inputs

| Input | Required | Default | Description |
|---|---|---|---|
| `github-token` | Yes | — | Token with `pull-requests:read` |
| `merged-prs-json` | No | `merged_prs.json` | Path to JSON array of merged PR objects |
| `output-file` | No | `diffs.json` | Path for the output artifact |
| `max-diff-lines` | No | `200` | Max diff lines to include per PR |
| `repository` | No | `github.repository` | `owner/repo` to fetch diffs from |
| `shared-sdlc-repo` | No | `lhuasheng/shared-sdlc` | Repository to fetch the script from |
| `shared-sdlc-ref` | No | `main` | Ref to use when fetching the script |

## Outputs

| Output | Description |
|---|---|
| `diffs-file` | Path of the written `diffs.json` |
| `pr-count` | Number of PRs for which diffs were collected |

---

## Example caller

```yaml
# Used as a pre-step before an agentic workflow dispatch
- name: Gather PRs merged this week
  shell: bash
  env:
    GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  run: |
    SINCE=$(date -u -d '7 days ago' +%Y-%m-%dT%H:%M:%SZ)
    gh pr list --repo "${{ github.repository }}" \
      --state merged \
      --json number,title,author,mergedAt \
      --jq "[.[] | select(.mergedAt > \"$SINCE\")]" \
      > merged_prs.json

- name: Collect diffs
  id: diffs
  uses: lhuasheng/shared-sdlc/actions/collect-diffs@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}

- name: Dispatch weekly digest
  uses: lhuasheng/shared-sdlc/actions/dispatch-agentic@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    workflow-repo: lhuasheng/shared-agentic
    workflow-file: weekly-digest.md
    payload: |
      { "diffs_artifact": "diffs", "pr_count": "${{ steps.diffs.outputs.pr-count }}" }
```

---

## Output schema

The `diffs.json` file produced by this action conforms to
[`schemas/diffs.schema.json`](../../schemas/diffs.schema.json):

```json
[
  {
    "pr": 42,
    "title": "feat: add user auth",
    "author": "alice",
    "mergedAt": "2026-07-01T12:00:00Z",
    "diff": "@@ -1,3 +1,5 @@\n ..."
  }
]
```
