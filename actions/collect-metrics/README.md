# collect-metrics

Composite action that collects repository health metrics and writes a
`metrics.json` artifact conforming to
[`schemas/metrics.schema.json`](../../schemas/metrics.schema.json).

Used as a pre-step by the `tech-debt` and `weekly-digest` agentic workflows
(Integration Pattern 3: agent orchestrates shared-sdlc tools).

---

## Inputs

| Input | Required | Default | Description |
|---|---|---|---|
| `github-token` | Yes | — | Token with `actions:read`, `issues:read`, `pull-requests:read` |
| `output-file` | No | `metrics.json` | Output artifact path |
| `lookback-days` | No | `30` | Days to look back for time-windowed metrics |
| `repository` | No | `github.repository` | `owner/repo` to collect metrics for |
| `shared-sdlc-repo` | No | `lhuasheng/shared-sdlc` | Source of the script |
| `shared-sdlc-ref` | No | `main` | Ref to fetch the script from |

## Outputs

| Output | Description |
|---|---|
| `metrics-file` | Path of the written `metrics.json` |

---

## Example caller

```yaml
- name: Collect metrics
  uses: lhuasheng/shared-sdlc/actions/collect-metrics@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    lookback-days: '30'

- name: Dispatch tech-debt scan
  uses: lhuasheng/shared-sdlc/actions/dispatch-agentic@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    workflow-repo: lhuasheng/.github
    workflow-file: tech-debt.md
    payload: '{ "metrics_artifact": "metrics" }'
```

---

## Output schema

The `metrics.json` produced by this action conforms to
[`schemas/metrics.schema.json`](../../schemas/metrics.schema.json):

```json
{
  "collectedAt": "2026-07-07T09:00:00Z",
  "repository": "lhuasheng/my-project",
  "lookbackDays": 30,
  "openIssues": 12,
  "mergedPrs": 28,
  "openPrs": 4,
  "commitCount": 87,
  "contributors": 5,
  "ciSuccessRatePct": 94
}
```
