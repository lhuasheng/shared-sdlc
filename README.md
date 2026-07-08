# shared-sdlc

Reusable composite GitHub Actions, helper scripts, agentic workflow definitions,
and shared context contracts that implement the **AI-Enhanced Software
Development Lifecycle (AI-SDLC) Framework**.

Every project repo points its thin workflow files at the actions in this repo,
so all gate logic lives in one place. Reasoning-heavy tasks are handled by
[GitHub Agentic Workflows](https://github.github.com/gh-aw/) whose canonical
sources live in
[`lhuasheng/shared-agentic`](https://github.com/lhuasheng/shared-agentic);
`new-project.sh` **vendors** each workflow's `.md` source and compiled
`.lock.yml` into the project repo, so agentic runs happen locally with the
repo-scoped `GITHUB_TOKEN`. On-demand workflows (PR review, release notes)
are dispatched by composite actions here, always targeting the compiled
`*.lock.yml` filename.

> **This repo must be public** (or accessible via a GitHub App) so that
> project repos can reference `uses: org/shared-sdlc/...`.

---

## What's in here

```
actions/
  ci-gates/              ← Gate: lint, test, PR size, security, spec link; publishes ci-summary.json
  ai-pr-review/          ← Gate: /ai-review comment → dispatches pr-review agentic workflow
  weekly-review/         ← Legacy: Claude weekly digest (superseded by weekly-digest workflow)
  setup-repo/            ← Utility: creates standard labels (superseded by apply-labels.mjs)
  dispatch-agentic/      ← Routes commands/triggers to GitHub Agentic Workflows
  collect-diffs/         ← Fetches PR diffs as diffs.json artifact
  collect-metrics/       ← Collects repo health metrics as metrics.json artifact
  collect-audit-data/    ← Collects compliance data as audit-data.json artifact
  release-notes-router/  ← Dispatches release-notes workflow on semver tag push

scripts/
  collect-diffs.mjs         ← Fetches PR diffs (also called by collect-diffs action)
  collect-metrics.mjs       ← Collects repo health metrics
  apply-labels.mjs          ← Syncs label taxonomy into a target repository
  upsert-summary-comment.mjs ← Updates consolidated AI-SDLC PR comment
  onboard-repo.mjs          ← Automates new project repository onboarding
  pr-review.mjs             ← [DEPRECATED Q4 2026] Legacy Anthropic PR review script
  weekly-review.mjs         ← [DEPRECATED Q4 2026] Legacy Anthropic weekly review script

schemas/                   ← JSON Schema draft 2020-12 artifact definitions
  ci-summary.schema.json
  ai-review.schema.json
  security-report.schema.json
  weekly-digest.schema.json
  diffs.schema.json
  metrics.schema.json

templates/                 ← Ready-to-copy thin caller workflow files
  ci.yml                     ← CI gates on PR/push
  ai-pr-review.yml           ← /ai-review comment → dispatches local pr-review.lock.yml
  release.yml                ← semver tag push → dispatches local release-notes.lock.yml
  (issue-triage and weekly-digest need no callers: their vendored .lock.yml
   files trigger directly on issues:opened and cron)

new-project.sh             ← Bootstraps a new project repo: template + callers
                             + vendored agentic .md/.lock.yml files

docs/
  playbook.md             ← Complete AI-SDLC framework reference
  audit-report.md         ← Repository audit (Wave 0)
  environment-check.md    ← Environment readiness guide
  baseline-metrics.md     ← Metrics collection templates
  context-layer.md        ← Shared context contracts reference
  label-taxonomy.md       ← Standardized label definitions
  pr-comment-marker.md    ← Consolidated PR comment convention
  security-checklist.md   ← Security verification checklist for workflows

issue-templates/          ← Templates for agent-created GitHub Issues
  weekly-digest.md
  ci-investigation.md
  tech-debt.md
  compliance-report.md

dashboards/
  cost/                   ← Cost tracking dashboard configuration
  adoption/               ← Framework adoption dashboard configuration

monitoring/
  alerting.yml            ← Budget breach and failure alerting rules
```

---

## Integration patterns

| Pattern | When to use | Example |
|---|---|---|
| **1: Sequential** | Agentic runs only after gate passes | Architecture review after CI |
| **2: Parallel** | Both run simultaneously, share artifacts | CI investigator + CI |
| **3: Direct trigger** | Vendored agentic lock triggers on repo events | Issue triage on issues:opened; weekly digest on cron |
| **4: Dispatch** | shared-sdlc routes command to agentic workflow | /ai-review → pr-review.lock.yml |

See [`docs/playbook.md`](docs/playbook.md) for the full reference.

---

## Quick start: Create a new project repository

```bash
# Requires an authenticated gh CLI with repo-create rights
curl -fsSL https://raw.githubusercontent.com/lhuasheng/shared-sdlc/main/new-project.sh -o new-project.sh
bash new-project.sh project-X
```

This creates the repo from `project-template`, copies the thin caller
workflows from `templates/`, vendors the agentic `.md` + compiled `.lock.yml`
files from `shared-agentic` (no `gh aw compile` needed — locks are
precompiled; only recompile if you edit a vendored `.md`), and enables branch
protection.

To onboard an *existing* repository:

```bash
# Requires GH_TOKEN with admin access to the target repo
GH_TOKEN=<token> TARGET_REPO=your-org/project-repo node scripts/onboard-repo.mjs
```

Or copy a template manually:

```bash
# Copy thin caller workflows into your project repo
cp templates/ci.yml path/to/project/.github/workflows/ci.yml
cp templates/ai-pr-review.yml path/to/project/.github/workflows/ai-pr-review.yml
# Edit each file to set your stack's commands, then vendor the agentic
# .md/.lock.yml files the same way new-project.sh does
```

---

## How a project repo uses these

Project repos contain **thin caller workflows** (~15 lines each) that invoke
the composite actions. See `templates/` for working examples.

```yaml
# project/.github/workflows/ci.yml
- uses: lhuasheng/shared-sdlc/actions/ci-gates@v1
  with:
    node-version: '20'
    test-cmd: 'npm run test:coverage'
```

Change gate logic here once and every project picks it up on the next run.

---

## Required secrets in project repos

| Secret | Used by |
|---|---|
| `GITHUB_TOKEN` (auto-provided) | All actions — including agentic dispatch, since the compiled `.lock.yml` files are vendored into the project repo itself |
| `AGENTIC_DISPATCH_TOKEN` | **Only for cross-repo dispatch** (non-default): if you point `workflow-repo` / `agentic-workflow-repo` at a *different* repo, you need a fine-grained PAT with `actions:write` on it; `GITHUB_TOKEN` can't reach across repos |
| `ANTHROPIC_API_KEY` | **Legacy only** — `ai-pr-review` fallback, `weekly-review` |

> **Note:** `ANTHROPIC_API_KEY` is not required when `agentic-workflow-repo` is
> set in `ai-pr-review` (the preferred path). See `DEPRECATIONS.md`.

---

## Versioning

Pin project repos to a tag (e.g. `@v1.0.0`) once the gates stabilise.
See `CHANGELOG.md` for release history.

See `DEPRECATIONS.md` for scripts and actions scheduled for removal.

---

## Documentation

| Document | Description |
|---|---|
| [`docs/triggers.md`](docs/triggers.md) | **Start here** — every trigger, the chain it fires, and how to verify it |
| [`docs/playbook.md`](docs/playbook.md) | Complete framework reference |
| [`docs/context-layer.md`](docs/context-layer.md) | Shared context contracts |
| [`docs/label-taxonomy.md`](docs/label-taxonomy.md) | Label definitions |
| [`docs/security-checklist.md`](docs/security-checklist.md) | Security verification |
| [`CHANGELOG.md`](CHANGELOG.md) | Release history |
| [`DEPRECATIONS.md`](DEPRECATIONS.md) | Deprecation notices |
