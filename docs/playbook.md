# AI-SDLC Playbook

Complete reference for the AI-Enhanced Software Development Lifecycle
(AI-SDLC) Framework. This playbook covers architecture, integration patterns,
the full workflow catalogue, adoption steps, and troubleshooting.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Integration Patterns](#2-integration-patterns)
3. [Workflow Catalogue](#3-workflow-catalogue)
4. [Adoption Steps](#4-adoption-steps)
5. [Configuration Reference](#5-configuration-reference)
6. [Troubleshooting](#6-troubleshooting)
7. [Security and Governance](#7-security-and-governance)
8. [Cost Management](#8-cost-management)

---

## 1. Architecture Overview

The AI-SDLC framework has three components, all hosted in this repository
(plus `project-template`, the seed repo new projects are created from):

### Deterministic layer (`actions/`, `scripts/`, `templates/`)
Composite GitHub Actions and helper scripts that implement **deterministic**
gates. These are authoritative for merge and deployment decisions. No agent
has direct write access — all writes go through structured outputs.

### Agentic layer (`.github/workflows/`)
Canonical source of the Markdown-based agentic workflows (`.md` sources plus
compiled `.lock.yml` files) that perform reasoning-heavy tasks like issue
triage, weekly digest, documentation sync, and PR review. These workflows are
informational and advisory — they do not block merge. `new-project.sh`
vendors both files into each project, so the workflows run locally with the
repo-scoped `GITHUB_TOKEN` — and because they live in this repo's own
`.github/workflows/`, they also run here (dogfooding): a broken workflow
surfaces in shared-sdlc before any project vendors it.

### Shared context layer
The contract between the two systems: label taxonomy, PR comment marker
convention, JSON artifact schemas, and issue templates. Documented in
[`docs/context-layer.md`](context-layer.md).

---

## 2. Integration Patterns

### Pattern 1: Sequential handoff
The deterministic gate runs first. The agentic workflow runs only if the gate
passes.

**Used for:** Architecture review, CI-gated reviews  
**Example:** CI must pass before architecture-review runs

```yaml
steps:
  - uses: lhuasheng/shared-sdlc/actions/ci-gates@v1
  - uses: lhuasheng/shared-sdlc/actions/dispatch-agentic@v1
    with:
      workflow-file: architecture-review.lock.yml  # always the compiled lock, never the .md
```

### Pattern 2: Parallel with shared context
Both systems run simultaneously and exchange data through artifacts.

**Used for:** CI failure investigation, vulnerability triage, coverage suggestions  
**Example:** `ci-investigator.md` reads `ci-summary.json` artifact from CI

### Pattern 3: Direct trigger
The vendored agentic `.lock.yml` triggers directly on the project's own
events — no caller workflow is involved.

**Used for:** Issue triage (`issues: opened`), weekly digest (cron), tech debt scan, compliance report  
**Example:** `issue-triage.lock.yml` runs when an issue is opened and applies labels via safe-outputs

### Pattern 4: shared-sdlc dispatches agentic workflows
A composite action routes a human command or tag push to an agentic workflow,
dispatching the compiled `.lock.yml` in the same repository.

**Used for:** PR review (/ai-review command), release notes generation  
**Example:** `dispatch-agentic` sends `/ai-review` comment to `pr-review.lock.yml`

---

## 3. Workflow Catalogue

All workflow sources live in this repository under `.github/workflows/`,
each with its compiled `.lock.yml` alongside.

### Wave 1 (Foundation)

| Workflow | File | Pattern | Trigger | Priority |
|---|---|---|---|---|
| Weekly Engineering Digest | `weekly-digest.md` | 3 | Monday 09:00 UTC | Must |
| Issue Triage | `issue-triage.md` | 3 | `issues: opened` | Must |
| Documentation Sync | `docs-sync.md` | 3 | `push: main (src/**)` | Must |

### Wave 2 (Developer Experience)

| Workflow | File | Pattern | Trigger | Priority |
|---|---|---|---|---|
| AI PR Review | `pr-review.md` | 4 | `/ai-review` comment | Must |
| CI Failure Investigation | `ci-investigator.md` | 2 | CI run failure | Must |
| Release Notes Generation | `release-notes.md` | 4 | Semver tag push | Should |

### Wave 3 (Advanced Coverage)

| Workflow | File | Pattern | Trigger | Priority |
|---|---|---|---|---|
| Architecture Review | `architecture-review.md` | 1 | CI success | Must |
| Vulnerability Triage | `vuln-triage.md` | 2 | CI run | Should |
| Tech Debt Scan | `tech-debt.md` | 3 | Monthly (1st) | Could |
| Compliance Audit Report | `compliance-report.md` | 3 | Monthly (1st) | Could |
| Coverage Improvement Suggestions | `coverage-suggester.md` | 2 | CI run | Could |

---

## 4. Adoption Steps

### Step 1: Enable Copilot in your organization
Ensure GitHub Copilot is enabled for your organization under
**Settings → Copilot → Policies**.

### Step 2: Create the project repository
Run `new-project.sh` (see the README quick start). It creates the repo from
`project-template`, copies the thin caller workflows from `templates/`, and
vendors the agentic `.md` + precompiled `.lock.yml` files from this repo — no
`gh aw compile` needed unless you later edit a vendored `.md`. See `docs/environment-check.md` for prerequisites.

### Step 3: Onboard an existing project repository
Run the onboarding script against your project repository:

```bash
GH_TOKEN=<admin-token> \
TARGET_REPO=your-org/project-repo \
node scripts/onboard-repo.mjs
```

This script:
- Copies thin caller workflows from `templates/` to `.github/workflows/`
- Applies the label taxonomy via `apply-labels.mjs`
- Enables branch protection
- Opens an onboarding PR for review

### Step 4: Pin to a release tag
Once stable, update the caller workflows to reference a specific tag:

```yaml
uses: lhuasheng/shared-sdlc/actions/ci-gates@v1.0.0
```

### Step 5: Validate
Run each workflow manually to confirm it produces the expected outputs.
Document results in a validation report.

---

## 5. Configuration Reference

### Required secrets

| Secret | Required by | Description |
|---|---|---|
| `GITHUB_TOKEN` | All actions | Auto-provisioned by GitHub Actions |
| `AGENTIC_DISPATCH_TOKEN` | Cross-repo dispatch only (non-default) | Not needed in the default setup — the compiled `.lock.yml` files are vendored into each project, so dispatch stays in-repo and `GITHUB_TOKEN` suffices. Only needed if `workflow-repo` points at a *different* repo: a fine-grained PAT (or GitHub App token) with `actions:write` there, since `GITHUB_TOKEN` cannot dispatch across repos. |
| `ANTHROPIC_API_KEY` | Legacy `ai-pr-review`, `weekly-review` | Deprecated; not required for agentic path |

### Action inputs reference

See the README in each action directory:
- [`actions/ci-gates`](../actions/ci-gates/) — lint, test, PR size, security
- [`actions/ai-pr-review`](../actions/ai-pr-review/) — PR review dispatcher
- [`actions/dispatch-agentic`](../actions/dispatch-agentic/) — workflow dispatcher
- [`actions/collect-diffs`](../actions/collect-diffs/) — PR diff collector
- [`actions/collect-metrics`](../actions/collect-metrics/) — repo metrics
- [`actions/collect-audit-data`](../actions/collect-audit-data/) — compliance data
- [`actions/release-notes-router`](../actions/release-notes-router/) — release router

---

## 6. Troubleshooting

### Agentic workflow not triggering
1. Verify the Copilot coding agent is enabled in your organization.
2. Check that the `actions:write` permission is granted in the caller workflow.
3. Verify the `workflow-file` input is the exact compiled filename (e.g.
   `pr-review.lock.yml`) present in the target repo — dispatching the `.md`
   always fails because GitHub Actions only registers `.yml` files.
4. Check the dispatch status output: `steps.dispatch.outputs.dispatch-status` should be `204`.

### Consolidated PR comment not appearing
1. Ensure `PR_NUMBER` is set correctly in the `upsert-summary-comment.mjs` call.
2. Verify the `GITHUB_TOKEN` has `pull-requests:write` permission.
3. Check that the comment body starts with exactly `<!-- ai-sdlc-summary -->`.

### Label not applied after triage
1. Confirm the label exists in the repository (run `apply-labels.mjs` if not).
2. Check the `safe-outputs` configuration in the workflow — label names must
   match exactly.

### CI artifact schema validation failure
1. Run `npx ajv-cli validate -s schemas/ci-summary.schema.json -d ci-summary.json --spec=draft2020`.
2. Check for missing required fields (`runId`, `repository`, `ref`, `conclusion`).

---

## 7. Security and Governance

All agentic workflows follow these security rules:

| Rule | Implementation |
|---|---|
| Read-only agent permissions | `permissions: contents: read` in all workflows |
| All writes via safe-outputs | `safe-outputs` list in workflow frontmatter |
| Network firewall | `network: egress: deny` in all workflows |
| Per-run cost budget | `cost-budget: per-run-usd: X.XX` in all workflows |
| No hard-coded secrets | Secrets accessed via `${{ secrets.X }}` only |

See [`docs/security-checklist.md`](security-checklist.md) for the verification
checklist.

---

## 8. Cost Management

### Per-workflow cost budgets

| Workflow | Budget per run |
|---|---|
| `issue-triage.md` | $0.10 |
| `pr-review.md` | $0.20 |
| `coverage-suggester.md` | $0.20 |
| `docs-sync.md` | $0.30 |
| `release-notes.md` | $0.30 |
| `vuln-triage.md` | $0.30 |
| `ci-investigator.md` | $0.25 |
| `architecture-review.md` | $0.40 |
| `compliance-report.md` | $0.40 |
| `weekly-digest.md` | $0.50 |
| `tech-debt.md` | $0.50 |

### Monthly budget estimation

For a team of 5 with 20 PRs/week:
- Issue triage: 20 issues/week × 4 × $0.10 = $8/month
- PR review: 20 PRs/week × 4 × $0.20 = $16/month
- CI investigation: ~5 failures/week × 4 × $0.25 = $5/month
- Weekly digest: 4/month × $0.50 = $2/month
- Monthly scans: 2 × $0.50 = $1/month

**Estimated total: ~$35/month per repository**

Set hard caps in your GitHub Copilot billing settings to enforce limits.
