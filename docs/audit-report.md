# Repository Audit Report

**Repository:** lhuasheng/shared-sdlc  
**Audit date:** 2026-07-07  
**Auditor:** AI-SDLC Framework implementation agent  
**Task reference:** Wave 0 — Task 0.1

---

## 1. Summary

The `shared-sdlc` repository currently implements four composite GitHub Actions and three Node.js helper scripts. It covers the deterministic gate layer well for CI, AI-assisted PR review, and weekly code-quality reporting. The repository lacks the following capabilities required by the AI-SDLC PRD: a dispatch-agentic action, structured JSON artifact output, shared context contracts (labels, comment markers, schemas), and agentic-workflow Markdown files for reasoning-heavy tasks.

---

## 2. Composite Actions

| Directory | Name | Description | PRD Requirement | Gap |
|---|---|---|---|---|
| `actions/ci-gates` | AI-SDLC CI Gates | Runs lint, typecheck, tests, PR-size check, secret scan, spec-link check, npm audit | SDL-01, SDL-02, SDL-03 | Does not publish structured JSON artifacts (ci-summary.json, test-results.json) |
| `actions/ai-pr-review` | AI-SDLC On-Demand PR Review | Triggered by `/ai-review` comment; calls Claude API; posts review comment | SDL-04 (partial), AGT-04 | Calls Claude directly instead of dispatching to an agentic workflow; uses deprecated script pattern |
| `actions/weekly-review` | AI-SDLC Weekly Review | Monday 9am cron; collects PR diffs; calls Claude; files GitHub Issue | AGT-02 (partial) | Uses direct Anthropic API call instead of agentic workflow; does not use safe-outputs or cost budgets |
| `actions/setup-repo` | AI-SDLC Repo Setup | Creates standard labels via `workflow_dispatch` | CTX-01 (partial) | Label set incomplete relative to new taxonomy; no `apply-labels.mjs` script equivalent |

---

## 3. Helper Scripts

| File | Purpose | PRD Requirement | Gap |
|---|---|---|---|
| `scripts/collect-diffs.mjs` | Reads `merged_prs.json`, fetches PR diffs via `gh`, writes `pr_diffs.json` | SDL-05 (partial) | Not exposed as a composite action; no JSON schema conformance |
| `scripts/pr-review.mjs` | Calls Anthropic API for a single PR diff; writes `review_comment.md` | SDL-05 | **To be deprecated** once `workflows/pr-review.md` agentic workflow is live |
| `scripts/weekly-review.mjs` | Calls Anthropic API for weekly digest; writes `review_output.md` | SDL-05 | **To be deprecated** once `workflows/weekly-digest.md` agentic workflow is live |

---

## 4. Other Files

| File | Purpose |
|---|---|
| `new-project.sh` | Bootstrap script: creates project repo from template, sets secrets, enables branch protection |
| `README.md` | Overview of the shared-sdlc repository and usage instructions |

---

## 5. Missing Capabilities (by PRD Requirement)

### SDL layer gaps

| Requirement | Status | Action required |
|---|---|---|
| SDL-04 `dispatch-agentic` composite action | **Missing** | Create `actions/dispatch-agentic` |
| SDL-05 `collect-metrics` script + action | **Missing** | Create `scripts/collect-metrics.mjs` and `actions/collect-metrics` |
| SDL-05 `collect-diffs` as composite action | **Missing** | Create `actions/collect-diffs` wrapping existing script |
| SDL-06 JSON artifact schemas | **Missing** | Create `schemas/` directory with all schema files |
| SDL-07 Semver release workflow | **Missing** | Create `.github/workflows/release.yml` |
| SDL-08 Deprecation notices | **Missing** | Add notices to `pr-review.mjs` and `weekly-review.mjs`; create `DEPRECATIONS.md` |

### CTX layer gaps

| Requirement | Status | Action required |
|---|---|---|
| CTX-01 Label taxonomy | **Partial** | `setup-repo` action has labels; new taxonomy doc + `apply-labels.mjs` needed |
| CTX-02 PR comment marker | **Missing** | Create `docs/pr-comment-marker.md` + `scripts/upsert-summary-comment.mjs` |
| CTX-03 JSON artifact schemas | **Missing** | See SDL-06 above |
| CTX-04 Issue templates | **Missing** | Create `issue-templates/` directory |
| CTX-05 Context layer docs | **Missing** | Create `docs/context-layer.md` |

### AGT layer gaps (agentic workflows)

All agentic workflow Markdown files are missing. These belong in a separate `shared-agentic` repository per the PRD architecture. Because that repository does not yet exist, the workflow Markdown files are provisionally placed in `workflows/` within this repository and must be migrated once `shared-agentic` is bootstrapped.

| Requirement | Workflow file | Priority |
|---|---|---|
| AGT-01 Issue triage | `workflows/issue-triage.md` | Must |
| AGT-02 Weekly engineering digest | `workflows/weekly-digest.md` | Must |
| AGT-03 Documentation sync | `workflows/docs-sync.md` | Must |
| AGT-04 AI PR review | `workflows/pr-review.md` | Must |
| AGT-05 CI failure investigation | `workflows/ci-investigator.md` | Must |
| AGT-06 Release notes generation | `workflows/release-notes.md` | Should |
| AGT-07 Vulnerability triage | `workflows/vuln-triage.md` | Should |
| AGT-08 Tech debt scan | `workflows/tech-debt.md` | Could |
| AGT-09 Compliance audit report | `workflows/compliance-report.md` | Could |

---

## 6. Scripts Identified for Deprecation

The following scripts will be deprecated in Wave 2 once their agentic-workflow equivalents are live:

| Script | Replacement | Target removal |
|---|---|---|
| `scripts/pr-review.mjs` | `workflows/pr-review.md` agentic workflow | Q4 2026 |
| `scripts/weekly-review.mjs` | `workflows/weekly-digest.md` agentic workflow | Q4 2026 |

---

## 7. Acceptance Criteria Check

- [x] Report lists every action in the `actions/` directory
- [x] Report lists every script in the `scripts/` directory
- [x] Report identifies scripts to be deprecated in Wave 2
