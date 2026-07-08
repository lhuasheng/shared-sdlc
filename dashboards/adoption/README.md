# Adoption Dashboard

This directory contains the configuration and instructions for the AI-SDLC
framework adoption tracking dashboard.

---

## Overview

The adoption dashboard tracks the rollout of the AI-SDLC framework across
project repositories in your organization. It displays:

- Number of repositories onboarded
- Workflows enabled per repository
- Adoption trend over time
- Repositories not yet onboarded

---

## Data source

Adoption data is collected by querying the GitHub API for repositories that
reference shared-sdlc actions or agentic workflows in their workflow files.

### Collection query

```bash
# Find all repos using shared-sdlc actions
gh api "search/code?q=uses+lhuasheng/shared-sdlc+in:file+language:yaml+org:YOUR_ORG" \
  --paginate \
  --jq '[.items[] | {repo: .repository.full_name, file: .name}]' \
  | jq 'group_by(.repo) | map({repo: .[0].repo, workflows: [.[].file]})'
```

Automate this with the adoption report script:

```bash
GH_TOKEN=<token> GITHUB_ORG=your-org node scripts/collect-metrics.mjs
```

---

## Dashboard configuration (Grafana)

### Import the dashboard

1. Open Grafana → Dashboards → Import
2. Upload `adoption-dashboard.json` from this directory
3. Configure the data source
4. Set the `org` variable to your GitHub organization

### Dashboard panels

| Panel | Metric | Description |
|---|---|---|
| Repositories onboarded | `ai_sdlc_repos_onboarded` | Count of repos using shared-sdlc |
| Adoption rate | `ai_sdlc_repos_onboarded / ai_sdlc_repos_total` | % of org repos onboarded |
| Workflows per repo | `ai_sdlc_workflows_enabled` | Heatmap of which workflows are enabled |
| Adoption trend | `ai_sdlc_repos_onboarded` over time | Rolling 6-month adoption trend |
| Not yet onboarded | List | Repos in org without shared-sdlc |

---

## Lightweight alternative

If you don't have Grafana, run the adoption check script monthly:

```bash
# List all repos in the org and check for shared-sdlc usage
GH_TOKEN=<token> GITHUB_ORG=your-org \
gh api "orgs/YOUR_ORG/repos?type=all&per_page=100" --paginate \
  --jq '.[].full_name' | while read repo; do
  if gh api "search/code?q=shared-sdlc+repo:$repo" --jq '.total_count' | grep -q '^[1-9]'; then
    echo "✅ $repo — onboarded"
  else
    echo "⬜ $repo — not onboarded"
  fi
done
```

---

## Adoption success criteria (from PRD Section 10)

| Metric | Target | Timeline |
|---|---|---|
| Project repository adoption rate | 80% | 6 months post-GA |
| Workflows enabled per onboarded repo | ≥ 3 | At onboarding |
| Weekly digest completion rate | 100% | Wave 1 launch |
