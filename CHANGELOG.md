# Changelog

All notable changes to `shared-sdlc` are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added

**Wave 0 — Preparation**
- `docs/audit-report.md` — Repository audit listing all actions, scripts, and deprecation targets
- `docs/environment-check.md` — Environment readiness guide for GitHub Agentic Workflows
- `docs/baseline-metrics.md` — Baseline metrics collection methodology and templates

**Wave 1 — Foundation**
- `actions/dispatch-agentic/` — New composite action for dispatching agentic workflows (SDL-04, Pattern 4)
- `actions/collect-diffs/` — New composite action wrapping `scripts/collect-diffs.mjs` (SDL-05)
- `actions/collect-metrics/` — New composite action for collecting repository health metrics (SDL-05)
- `scripts/collect-metrics.mjs` — New script for repository health metric collection
- `scripts/apply-labels.mjs` — New script for idempotent label taxonomy synchronization (CTX-01)
- `scripts/upsert-summary-comment.mjs` — New script for consolidated PR comment management (CTX-02)
- `schemas/` — New directory with JSON Schema draft 2020-12 definitions for all shared artifacts (SDL-06, CTX-03)
  - `ci-summary.schema.json`
  - `ai-review.schema.json`
  - `security-report.schema.json`
  - `weekly-digest.schema.json`
  - `diffs.schema.json`
  - `metrics.schema.json`
- `docs/label-taxonomy.md` — Standardized label taxonomy documentation (CTX-01)
- `docs/pr-comment-marker.md` — PR comment marker convention documentation (CTX-02)
- `docs/context-layer.md` — Single reference for all context layer contracts (CTX-05)
- `issue-templates/` — Reusable issue templates for agent-created issues (CTX-04)
  - `weekly-digest.md`
  - `ci-investigation.md`
  - `tech-debt.md`
  - `compliance-report.md`
- `workflows/` — New directory for GitHub Agentic Workflow Markdown files
  - `workflows/weekly-digest.md` — Weekly engineering digest (AGT-02)
  - `workflows/issue-triage.md` — Issue triage and classification (AGT-01)
  - `workflows/docs-sync.md` — Documentation synchronization (AGT-03)

**Wave 2 — Developer Experience**
- `workflows/pr-review.md` — AI PR review agentic workflow (AGT-04)
- `workflows/ci-investigator.md` — CI failure investigation agentic workflow (AGT-05)
- `workflows/release-notes.md` — Release notes generation agentic workflow (AGT-06)
- `actions/release-notes-router/` — New composite action for routing release note dispatch (Pattern 4)

**Wave 3 — Advanced Coverage**
- `workflows/architecture-review.md` — Architecture review agentic workflow (Pattern 1)
- `workflows/vuln-triage.md` — Vulnerability triage agentic workflow (AGT-07)
- `workflows/tech-debt.md` — Tech debt scan agentic workflow (AGT-08)
- `workflows/compliance-report.md` — Compliance audit report agentic workflow (AGT-09)
- `workflows/coverage-suggester.md` — Coverage improvement suggestions agentic workflow
- `actions/collect-audit-data/` — New composite action for compliance data collection

**Wave 4 — Organization-Wide Adoption**
- `docs/playbook.md` — Complete AI-SDLC framework playbook (architecture, patterns, catalogue, adoption)
- `templates/` — Ready-to-copy thin caller workflow templates
  - `ci.yml`, `ai-pr-review.yml`, `weekly-digest.yml`, `issue-triage.yml`, `release.yml`
- `scripts/onboard-repo.mjs` — Automated repository onboarding script
- `dashboards/cost/README.md` — Cost dashboard configuration and instructions
- `dashboards/adoption/README.md` — Adoption dashboard configuration and instructions
- `monitoring/alerting.yml` — Alerting rules for budget breaches and workflow failures

**Cross-cutting**
- `docs/security-checklist.md` — Security verification checklist for all agentic workflows
- `DEPRECATIONS.md` — Deprecation notices for scripts to be removed in Q4 2026

### Changed

- **Agentic workflow host repository changed from `shared-agentic` to `.github`** — the PRD's original standalone `shared-agentic` repository was never bootstrapped; rather than create a fourth shared repo, agentic workflow Markdown files are now published to `.github/workflows/` in `lhuasheng/.github`, which every project repo already depends on for org defaults. All `dispatch-agentic` callers (`templates/*.yml`, `actions/ai-pr-review`, `actions/release-notes-router`) and docs now default to `lhuasheng/.github` instead of `lhuasheng/shared-agentic`.
- `actions/ai-pr-review/action.yml` — Now dispatches to `pr-review.md` agentic workflow via `dispatch-agentic`; legacy script fallback retained for backward compatibility
- `actions/ci-gates/action.yml` — Now publishes `ci-summary.json` and `security-report.json` artifacts on every run; individual check IDs added for structured output
- `scripts/collect-diffs.mjs` — Now supports `INPUT_FILE`, `OUTPUT_FILE`, `MAX_DIFF_LINES` env vars; backward-compatible alias `pr_diffs.json` retained

### Deprecated

- `scripts/pr-review.mjs` — See `DEPRECATIONS.md` for migration guide
- `scripts/weekly-review.mjs` — See `DEPRECATIONS.md` for migration guide

---

## [0.1.0] — 2026-01-01 (initial release, pre-framework)

Initial state of the repository with four composite actions and three helper
scripts. No versioned release existed; this entry documents the pre-framework
baseline.

### Added

- `actions/ci-gates/` — Lint, test, PR size, secret scan, spec link checks
- `actions/ai-pr-review/` — `/ai-review` comment → Claude review comment
- `actions/weekly-review/` — Monday 09:00 UTC → Claude pattern review issue
- `actions/setup-repo/` — Standard label creation
- `scripts/pr-review.mjs` — Claude API call for single PR review
- `scripts/weekly-review.mjs` — Claude API call for weekly digest
- `scripts/collect-diffs.mjs` — PR diff collection
- `new-project.sh` — Project repository bootstrap script
