# collect-audit-data

Composite action that collects repository compliance data and writes
`audit-data.json` for use by the
[`compliance-report`](../../workflows/compliance-report.md) agentic workflow.

Checks performed:
- Branch protection rules on `main`
- Presence of a `CODEOWNERS` file
- Count of direct pushes to `main` (non-merge commits) in the lookback window
- Secret scanning status

---

## Inputs

| Input | Required | Default | Description |
|---|---|---|---|
| `github-token` | Yes | — | Token with `administration:read`, `actions:read`, `contents:read` |
| `output-file` | No | `audit-data.json` | Output artifact path |
| `repository` | No | `github.repository` | `owner/repo` to audit |
| `lookback-days` | No | `30` | Days to look back for direct-push detection |

## Outputs

| Output | Description |
|---|---|
| `audit-file` | Path of the written `audit-data.json` |

---

## Example caller

```yaml
- name: Collect audit data
  uses: lhuasheng/shared-sdlc/actions/collect-audit-data@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    lookback-days: '30'

- name: Dispatch compliance report
  uses: lhuasheng/shared-sdlc/actions/dispatch-agentic@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    workflow-repo: lhuasheng/shared-agentic
    workflow-file: compliance-report.md
    payload: '{ "audit_artifact": "audit-data" }'
```

---

## Output structure

```json
{
  "collectedAt": "2026-07-01T09:00:00Z",
  "repository": "lhuasheng/my-project",
  "lookbackDays": 30,
  "branchProtection": { ... },
  "hasCODEOWNERS": true,
  "directPushCount": 0,
  "secretScanningStatus": "enabled"
}
```
