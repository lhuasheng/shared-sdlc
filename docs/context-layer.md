# Shared Context Layer

The **shared context layer** is the contract that allows the deterministic
**shared-sdlc** layer and the reasoning layer — GitHub Agentic Workflows
hosted in `lhuasheng/.github` — to exchange information reliably without
tight coupling.

This document is the single reference for all context contracts. Any change to
a contract in this document must also update the corresponding artefact.

---

## 1. Label Taxonomy (CTX-01)

All project repositories must use the standardized label set defined in
[`docs/label-taxonomy.md`](label-taxonomy.md).

Synchronize labels into a project repository with:

```bash
GH_TOKEN=<token> GITHUB_REPOSITORY=owner/repo node scripts/apply-labels.mjs
```

**Key AI-SDLC labels:**

| Label | Applied by | Meaning |
|---|---|---|
| `ai-triaged` | `issue-triage` workflow | Issue classified by AI |
| `ai-reviewed` | `pr-review` workflow | PR has AI pre-screen |
| `ci-passed` | `ci-investigator` workflow | CI run passed |
| `security-blocked` | `vuln-triage` workflow | Blocked for security |
| `needs-human-review` | `architecture-review`, `vuln-triage` | Mandatory human review |
| `needs-triage` | Automatically on open | Awaiting triage |
| `automated` | All agentic workflows | Machine-created |

See the full taxonomy in [`docs/label-taxonomy.md`](label-taxonomy.md).

---

## 2. PR Comment Marker Convention (CTX-02)

All agentic workflows post their output into a **single consolidated PR
comment** identified by the marker:

```
<!-- ai-sdlc-summary -->
```

This avoids comment noise and gives developers one place to look for all
AI-SDLC feedback on a PR.

Use `scripts/upsert-summary-comment.mjs` to update a section of this comment:

```bash
GH_TOKEN=<token> \
GITHUB_REPOSITORY=owner/repo \
PR_NUMBER=42 \
SECTION_NAME=ai-review \
SECTION_BODY_FILE=review_section.md \
node scripts/upsert-summary-comment.mjs
```

Named section delimiters:

```
<!-- section:ai-review -->
...content...
<!-- /section:ai-review -->
```

Registered section names: `ci-gates`, `ai-review`, `security`, `architecture`,
`coverage`.

See the full convention in [`docs/pr-comment-marker.md`](pr-comment-marker.md).

---

## 3. JSON Artifact Schemas (CTX-03)

Structured artefacts are exchanged between the two layers via GitHub Actions
artifacts. All artefacts must conform to their JSON Schema definitions.

| Artifact file | Schema | Produced by | Consumed by |
|---|---|---|---|
| `ci-summary.json` | [`schemas/ci-summary.schema.json`](../schemas/ci-summary.schema.json) | `actions/ci-gates` | `ci-investigator`, `architecture-review` workflows |
| `ai-review.json` | [`schemas/ai-review.schema.json`](../schemas/ai-review.schema.json) | `workflows/pr-review.md` | `upsert-summary-comment.mjs` |
| `security-report.json` | [`schemas/security-report.schema.json`](../schemas/security-report.schema.json) | `actions/ci-gates` | `vuln-triage` workflow |
| `diffs.json` | [`schemas/diffs.schema.json`](../schemas/diffs.schema.json) | `actions/collect-diffs` | `weekly-digest`, `pr-review` workflows |
| `metrics.json` | [`schemas/metrics.schema.json`](../schemas/metrics.schema.json) | `actions/collect-metrics` | `tech-debt`, `weekly-digest` workflows |
| `weekly-digest.json` | [`schemas/weekly-digest.schema.json`](../schemas/weekly-digest.schema.json) | `workflows/weekly-digest.md` | Issue creation |

Validate an artefact locally:

```bash
npx ajv-cli validate -s schemas/ci-summary.schema.json -d ci-summary.json --spec=draft2020
```

See [`schemas/README.md`](../schemas/README.md) for usage and how to add new schemas.

---

## 4. Issue Templates (CTX-04)

Agentic workflows that create GitHub Issues use the templates in
[`issue-templates/`](../issue-templates/).

| Template | Used by | Title prefix |
|---|---|---|
| [`weekly-digest.md`](../issue-templates/weekly-digest.md) | `weekly-digest` workflow | `[Weekly Digest]` |
| [`ci-investigation.md`](../issue-templates/ci-investigation.md) | `ci-investigator` workflow | `[CI Investigation]` |
| [`tech-debt.md`](../issue-templates/tech-debt.md) | `tech-debt` workflow | `[Tech Debt]` |
| [`compliance-report.md`](../issue-templates/compliance-report.md) | `compliance-report` workflow | `[Compliance]` |

Filter issues by type:

```bash
# All CI investigation issues
gh issue list --repo owner/repo --label "automated" --search "[CI Investigation]" --in title
```

Each template contains an `<!-- ai-sdlc:issue-type=<type> -->` marker for
machine filtering.

---

## 5. Updating a Contract

Any change to a context contract requires:

1. Updating this document.
2. Updating the referenced artefact (schema file, label taxonomy, comment
   marker doc, or issue template).
3. Updating any workflows or actions that produce or consume the changed
   contract.
4. Bumping the version in [`CHANGELOG.md`](../CHANGELOG.md).
5. If the change is breaking, adding a deprecation notice in
   [`DEPRECATIONS.md`](../DEPRECATIONS.md).
