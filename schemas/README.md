# JSON Artifact Schemas

This directory contains [JSON Schema draft 2020-12](https://json-schema.org/draft/2020-12/schema)
definitions for all structured artifacts exchanged between the deterministic
(**shared-sdlc**) and reasoning (**shared-agentic**) layers of the AI-SDLC
framework.

---

## Schema catalogue

| File | Produced by | Consumed by |
|---|---|---|
| [`ci-summary.schema.json`](ci-summary.schema.json) | `actions/ci-gates` | `workflows/ci-investigator.md`, `workflows/architecture-review.md` |
| [`ai-review.schema.json`](ai-review.schema.json) | `workflows/pr-review.md` | `scripts/upsert-summary-comment.mjs` |
| [`security-report.schema.json`](security-report.schema.json) | `actions/ci-gates` | `workflows/vuln-triage.md` |
| [`weekly-digest.schema.json`](weekly-digest.schema.json) | `workflows/weekly-digest.md` | Issue creation via safe-outputs |
| [`diffs.schema.json`](diffs.schema.json) | `actions/collect-diffs` | `workflows/weekly-digest.md`, `workflows/pr-review.md` |
| [`metrics.schema.json`](metrics.schema.json) | `actions/collect-metrics` | `workflows/tech-debt.md`, `workflows/weekly-digest.md` |

---

## Usage

### Validating an artifact locally

Install [`ajv-cli`](https://github.com/ajv-validator/ajv-cli):

```bash
npm install -g ajv-cli
ajv validate -s schemas/ci-summary.schema.json -d path/to/ci-summary.json --spec=draft2020
```

### Validating in CI

Add an artifact validation step to your workflow after the producing action:

```yaml
- name: Validate CI summary schema
  shell: bash
  run: |
    npx ajv-cli validate \
      -s "$(gh api repos/lhuasheng/shared-sdlc/contents/schemas/ci-summary.schema.json --jq .download_url | xargs curl -s)" \
      -d ci-summary.json \
      --spec=draft2020
```

---

## Adding a new schema

1. Create a new file named `<artifact-name>.schema.json` in this directory.
2. Set `$schema` to `https://json-schema.org/draft/2020-12/schema`.
3. Set `$id` to `https://github.com/lhuasheng/shared-sdlc/schemas/<artifact-name>.schema.json`.
4. Update the catalogue table above.
5. Update the `CTX-03` section in [`docs/context-layer.md`](../docs/context-layer.md).
