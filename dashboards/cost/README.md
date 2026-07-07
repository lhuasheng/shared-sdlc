# Cost Dashboard

This directory contains the configuration and instructions for the AI-SDLC
cost tracking dashboard.

---

## Overview

The cost dashboard visualizes per-repository and per-workflow spending for
GitHub Copilot agentic workflow runs. It displays:

- Current-month spend per repository
- Spend trend over the last 3 months
- Budget utilization per repository (actual vs. configured budget)
- Per-workflow cost breakdown

---

## Data source

Cost data is sourced from the GitHub Copilot usage API:

```bash
# Organization-level Copilot usage (requires billing:read)
gh api "orgs/{org}/copilot/usage" --jq '.[] | {date, total_suggestions_count, total_acceptances_count}'

# Per-seat usage (Enterprise only)
gh api "orgs/{org}/copilot/billing/seats"
```

For granular per-workflow cost tracking, instrument each agentic workflow to
emit an OpenTelemetry span with these attributes:
- `ai_sdlc.workflow.name`
- `ai_sdlc.workflow.repository`
- `ai_sdlc.workflow.run_id`
- `ai_sdlc.workflow.cost_usd` (from Copilot billing API)

---

## Dashboard configuration (Grafana)

### Prerequisites
- Grafana instance (cloud or self-hosted)
- OpenTelemetry Collector configured to receive spans from GitHub Actions
- Prometheus or ClickHouse as the metrics backend

### Import the dashboard

1. Open Grafana → Dashboards → Import
2. Upload `cost-dashboard.json` from this directory
3. Configure the data source to point to your metrics backend
4. Set the `org` variable to your GitHub organization name

### Dashboard panels

| Panel | Metric | Description |
|---|---|---|
| Current month spend | `ai_sdlc_cost_usd_total` | Total spend by repository this month |
| Monthly trend | `ai_sdlc_cost_usd_total` | 3-month rolling spend trend |
| Budget utilization | `ai_sdlc_cost_usd_total / ai_sdlc_budget_usd` | Budget used % per repo |
| Per-workflow cost | `ai_sdlc_cost_usd_total by workflow` | Cost breakdown by workflow type |
| Cost alerts | `ai_sdlc_budget_breach_total` | Count of budget breach events |

---

## Lightweight alternative (no Grafana)

If you don't have a Grafana instance, run the cost report script manually:

```bash
# Collect usage for the current month
GH_TOKEN=<billing-token> \
GITHUB_ORG=your-org \
node scripts/collect-metrics.mjs
```

Or schedule a monthly GitHub Actions workflow:

```yaml
# .github/workflows/cost-report.yml
name: Monthly Cost Report
on:
  schedule:
    - cron: '0 9 1 * *'
jobs:
  report:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Collect cost data
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          GITHUB_ORG: ${{ github.repository_owner }}
        run: node scripts/collect-metrics.mjs
      - uses: actions/upload-artifact@v4
        with:
          name: cost-report-${{ github.run_id }}
          path: metrics.json
```

---

## Budget enforcement

Set monthly budget caps in GitHub Copilot billing settings:

1. Go to **Organization Settings → Copilot → Policies**
2. Set a spending limit per user or organization
3. Configure the budget breach alert in `monitoring/alerting.yml`

Per-run budgets are enforced in each agentic workflow's frontmatter:

```yaml
agent:
  cost-budget:
    per-run-usd: 0.50
```
