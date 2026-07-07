# Label Taxonomy

Standardized GitHub label set used by both the **shared-sdlc** deterministic
layer and the reasoning layer (GitHub Agentic Workflows hosted in
`lhuasheng/.github`). All project repositories
must use these labels so that automation can reliably filter, triage, and
report on issues and pull requests.

Run `scripts/apply-labels.mjs` to synchronize this taxonomy into a target
repository.

---

## AI-SDLC Workflow Labels

These labels are applied or removed by agentic workflows through `safe-outputs`.

| Label | Color | Applied by | Description |
|---|---|---|---|
| `ai-triaged` | `#0052cc` | `issue-triage` workflow | Issue has been classified by the AI triage workflow |
| `ai-reviewed` | `#0075ca` | `pr-review` workflow | PR has received an AI pre-screen review |
| `ci-passed` | `#0e8a16` | `ci-investigator` workflow | CI run passed all checks |
| `security-blocked` | `#ee0701` | `vuln-triage` workflow | PR or issue is blocked pending security review |
| `needs-human-review` | `#e4e669` | `architecture-review`, `vuln-triage` workflows | High-risk change flagged for mandatory human review |

---

## Gate Labels

| Label | Color | Applied by | Description |
|---|---|---|---|
| `gate-1-spec` | `#d4c5f9` | Manual / `setup-repo` | Waiting for spec approval (Gate 1) |
| `gate-5-deploy` | `#bfd4f2` | Manual / `setup-repo` | Ready for production promotion (Gate 5) |

---

## Work Type Labels

| Label | Color | Applied by | Description |
|---|---|---|---|
| `feature` | `#a2eeef` | Manual / `issue-triage` | New feature or enhancement |
| `bug` | `#d73a4a` | Manual / `issue-triage` | Something isn't working |
| `question` | `#d876e3` | Manual / `issue-triage` | Further information is requested |
| `refactor` | `#fef2c0` | Manual | Code change with no behaviour change |
| `docs` | `#0052cc` | Manual / `docs-sync` | Documentation only |
| `chore` | `#e4e669` | Manual | Dependency bumps, config changes |
| `security` | `#ee0701` | Manual / `vuln-triage` | Security vulnerability or hardening |
| `tech-debt` | `#c5def5` | `tech-debt` workflow | Identified technical debt |
| `needs-triage` | `#ededed` | Automatically on open | Newly opened, awaiting triage |

---

## Priority Labels

| Label | Color | Applied by | Description |
|---|---|---|---|
| `P1-critical` | `#b60205` | Manual / `issue-triage` | Drop everything |
| `P2-high` | `#e4312b` | Manual / `issue-triage` | Next sprint |
| `P3-normal` | `#fbca04` | Manual / `issue-triage` | Backlog |
| `P4-low` | `#c2e0c6` | Manual / `issue-triage` | Nice to have |

---

## Status Labels

| Label | Color | Applied by | Description |
|---|---|---|---|
| `needs-spec-review` | `#ededed` | Manual | Spec not yet approved by tech lead |
| `blocked` | `#b60205` | Manual | Blocked by another issue or external dep |
| `wont-fix` | `#ffffff` | Manual | Intentionally not addressing |
| `duplicate` | `#cfd3d7` | `issue-triage` | Duplicate of an existing issue |
| `in-progress` | `#fbca04` | Manual | Actively being worked on |

---

## Automation Labels

| Label | Color | Applied by | Description |
|---|---|---|---|
| `automated` | `#e4e669` | All agentic workflows | Created or modified by an automated workflow |
| `code-review` | `#0075ca` | `weekly-digest` workflow | Weekly AI code review activity |

---

## Usage

Synchronize labels into a project repository:

```bash
GH_TOKEN=<token> GITHUB_REPOSITORY=owner/repo node scripts/apply-labels.mjs
```

The script is idempotent: it creates missing labels and updates the color and
description of existing ones.
