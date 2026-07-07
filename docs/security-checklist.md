# Security Checklist for Agentic Workflows

Every agentic workflow in the AI-SDLC framework must pass all items on this
checklist before it is merged. The checklist enforces the governance
requirements defined in the PRD (GOV-01 through GOV-08).

---

## Checklist

For each workflow file in `workflows/`, verify the following:

### GOV-01: Per-run cost budget

- [ ] The workflow frontmatter contains `agent.cost-budget.per-run-usd`
- [ ] The budget value is appropriate for the workflow's scope (see table below)
- [ ] The workflow handles budget exhaustion gracefully (partial output with a note)

### GOV-02: Read-only agent permissions by default

- [ ] `permissions.contents` is set to `read` unless the workflow uses safe-outputs for `create-pull-request` (e.g. `docs-sync.md`, `release-notes.md`)
- [ ] Write permissions (`issues: write`, `pull-requests: write`) are only present when the workflow uses safe-outputs for writes
- [ ] Workflows that require `contents: write` (for `safe-outputs create-pull-request`) are explicitly listed as approved exceptions in this checklist
- [ ] No `admin` permission is requested

### GOV-03: Sandboxed execution with network firewall

- [ ] `network.egress: deny` is set in the workflow frontmatter
- [ ] Any required external network access is explicitly declared under `network.egress.allow`
- [ ] No API keys or credentials are hard-coded in the workflow

### GOV-04: Safe outputs gating for all writes

- [ ] Every write operation (comment, label, issue, PR) is listed in the `safe-outputs` frontmatter field
- [ ] The workflow does not use the GitHub API directly for write operations
- [ ] The `safe-outputs` list contains only the write operations actually needed

### GOV-05: Threat detection scan on proposed changes

- [ ] The PR that introduces this workflow has passed the TruffleHog secret scan in CI
- [ ] The workflow does not echo or log sensitive input values
- [ ] Any user-supplied input that is reflected in output is treated as untrusted

### GOV-08: Audit log

- [ ] The workflow title and description are clear and auditable
- [ ] The workflow's trigger is documented
- [ ] Safe-outputs operations include the `<!-- ai-sdlc: -->` marker for audit filtering

---

## Per-workflow budget reference

| Workflow | Max budget per run |
|---|---|
| `issue-triage.md` | $0.10 |
| `pr-review.md` | $0.20 |
| `coverage-suggester.md` | $0.20 |
| `ci-investigator.md` | $0.25 |
| `docs-sync.md` | $0.30 |
| `release-notes.md` | $0.30 |
| `vuln-triage.md` | $0.30 |
| `architecture-review.md` | $0.40 |
| `compliance-report.md` | $0.40 |
| `weekly-digest.md` | $0.50 |
| `tech-debt.md` | $0.50 |

---

## CI enforcement

A CI check validates that every workflow file in `workflows/` contains the
required frontmatter fields. The check fails if:

- `agent.cost-budget.per-run-usd` is missing
- `safe-outputs` is empty or missing
- `permissions.contents` is not `read`, **unless** the workflow uses `safe-outputs` for `create-pull-request` (approved exception for `docs-sync.md` and `release-notes.md`)
- `network.egress` is not `deny`

---

## Workflow-level security verification status

| Workflow | GOV-01 | GOV-02 | GOV-03 | GOV-04 | GOV-05 | Approved |
|---|---|---|---|---|---|---|
| `weekly-digest.md` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `issue-triage.md` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `docs-sync.md` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `pr-review.md` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `ci-investigator.md` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `release-notes.md` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `architecture-review.md` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `vuln-triage.md` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `tech-debt.md` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `compliance-report.md` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `coverage-suggester.md` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
