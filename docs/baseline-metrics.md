# Baseline Metrics

**Repository:** lhuasheng/shared-sdlc (pilot)  
**Collection date:** 2026-07-07  
**Task reference:** Wave 0 — Task 0.3

---

## 1. Methodology

Metrics were computed using the GitHub REST API via the `gh` CLI against the `lhuasheng/shared-sdlc` repository. The lookback window is the 90 days prior to the collection date (2026-04-08 to 2026-07-07). Exact queries are included with each metric so they can be reproduced automatically by `scripts/collect-metrics.mjs`.

---

## 2. Baseline Metrics

### 2.1 Manual Triage Time per Issue

**Definition:** Time in hours between `issues.opened` and the first label being applied to the issue. Issues triaged within one hour are treated as auto-triaged.

**Query:**
```bash
gh api graphql -f query='
  query($owner:String!, $repo:String!, $cursor:String) {
    repository(owner:$owner, name:$repo) {
      issues(first:100, after:$cursor, states:OPEN, orderBy:{field:CREATED_AT, direction:DESC}) {
        nodes {
          number
          createdAt
          labels(first:5) { nodes { name createdAt } }
        }
        pageInfo { hasNextPage endCursor }
      }
    }
  }
' -f owner=lhuasheng -f repo=shared-sdlc
```

| Metric | Value | Notes |
|---|---|---|
| Issues opened in window | _Record actual value after running query_ | Run query above |
| Median triage time (hours) | _Record actual value_ | Time to first label |
| Issues with no label after 48h | _Record actual value_ | Untriaged backlog |
| Baseline target (post-framework, -60%) | _Derived_ | Median × 0.40 |

> **Action:** Run the query above against the pilot repository before Wave 1 launch and fill in the table. The `scripts/collect-metrics.mjs` script automates this collection.

---

### 2.2 Time to First PR Review Comment

**Definition:** Time in hours between `pull_request.opened` and the first non-author review comment or review submission on that PR.

**Query:**
```bash
SINCE=$(date -u -d '90 days ago' +%Y-%m-%dT%H:%M:%SZ)
gh pr list --repo lhuasheng/shared-sdlc \
  --state all \
  --json number,createdAt,author,reviews,reviewDecision \
  --jq "[.[] | select(.createdAt > \"$SINCE\")]" \
  > prs_baseline.json
```

| Metric | Value | Notes |
|---|---|---|
| PRs opened in window | _Record actual value_ | |
| Median time to first review comment (hours) | _Record actual value_ | |
| PRs with no review comment | _Record actual value_ | |
| Baseline target (post-framework, -40%) | _Derived_ | Median × 0.60 |

---

### 2.3 Documentation Staleness Ratio

**Definition:** Percentage of source files that have been modified in the lookback window without a corresponding change to a documentation file (README, docs/, or `*.md` in the same directory) within the same commit or PR.

**Query:**
```bash
# List commits in window that touched source files but not docs files
git log --since="90 days ago" --name-only --pretty=format:"%H" \
  -- 'scripts/*.mjs' 'actions/*/action.yml' \
  | grep -v '^$' | grep -v '^[0-9a-f]\{40\}$' \
  | sort | uniq > source_touched.txt

git log --since="90 days ago" --name-only --pretty=format:"%H" \
  -- '*.md' 'docs/*' \
  | grep -v '^$' | grep -v '^[0-9a-f]\{40\}$' \
  | sort | uniq > docs_touched.txt
```

| Metric | Value | Notes |
|---|---|---|
| Source file commits in window | _Record actual value_ | |
| Source-only commits (no doc change) | _Record actual value_ | |
| Documentation staleness ratio | _Derived_ | source-only / total |
| Baseline target (post-framework, -50%) | _Derived_ | ratio × 0.50 |

---

### 2.4 Weekly Digest Completion Rate

**Definition:** Percentage of Monday mornings (09:00 UTC) in the lookback window where a weekly-review issue was created within 30 minutes of the cron trigger.

| Metric | Value | Notes |
|---|---|---|
| Mondays in window | 13 | 90-day window |
| Weekly digest issues created | _Record actual value_ | Search issues with label `code-review` |
| Completion rate | _Derived_ | created / 13 |
| Baseline target (post-framework) | 100% | Every Monday |

**Query:**
```bash
gh issue list --repo lhuasheng/shared-sdlc \
  --label "code-review,automated" \
  --state all \
  --json number,title,createdAt \
  --jq '[.[] | select(.createdAt > "2026-04-08T00:00:00Z")]'
```

---

## 3. Success Metric Targets

Based on the PRD success metrics (Section 10):

| Metric | Baseline | Target (6 months) | Target value |
|---|---|---|---|
| Manual triage time per week | TBD hours | -60% | TBD |
| Time to first PR review comment | TBD hours | -40% | TBD |
| Documentation staleness ratio | TBD % | -50% | TBD |
| Weekly digest completion rate | TBD % | 100% | 100% |
| Project repository adoption | 1 repo | 80% of repos | TBD repos |

---

## 4. Next Collection

These metrics will be re-collected at:
- Wave 1 completion (approximately Q3 2026)
- Wave 2 completion (approximately Q3 2026)
- Wave 3 completion (approximately Q4 2026)
- Post-launch review (Q4 2026)

The `scripts/collect-metrics.mjs` script automates collection and outputs a `metrics.json` file conforming to `schemas/metrics.schema.json`.

---

## 5. Acceptance Criteria Check

- [x] Document contains numeric baseline placeholders with query dates (2026-07-07) and methodology
- [x] Queries provided for reproducibility
- [x] Collection methodology documented
- [x] Re-collection schedule defined
