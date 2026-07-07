# Deprecations

Scripts and actions that are deprecated and scheduled for removal. Consumers
should migrate to the listed replacement before the target removal date.

---

## Active Deprecations

### `scripts/pr-review.mjs`

| Property | Value |
|---|---|
| **Status** | Deprecated |
| **Deprecated since** | 2026-07-07 |
| **Target removal** | Q4 2026 (v2.0.0) |
| **Replacement** | `workflows/pr-review.md` (GitHub Agentic Workflow) |

**Why deprecated:** The script makes direct Anthropic API calls which require
storing `ANTHROPIC_API_KEY` as a secret. The agentic workflow replacement uses
GitHub Copilot's built-in runtime, eliminating the need for this secret and
providing safe-outputs gating.

**Migration steps:**

1. Set `agentic-workflow-repo` in your `actions/ai-pr-review` caller:

   ```yaml
   # Before (deprecated)
   - uses: lhuasheng/shared-sdlc/actions/ai-pr-review@v1
     with:
       anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}
       github-token: ${{ secrets.GITHUB_TOKEN }}
       shared-sdlc-repo: lhuasheng/shared-sdlc

   # After (current)
   - uses: lhuasheng/shared-sdlc/actions/ai-pr-review@v1
     with:
       github-token: ${{ secrets.GITHUB_TOKEN }}
       agentic-workflow-repo: lhuasheng/.github
       agentic-workflow-ref: v1.0.0
   ```

2. Ensure the `pr-review.md` file is available at `.github/workflows/` in
   `lhuasheng/.github`.
3. Remove the `ANTHROPIC_API_KEY` secret from your project repository once
   migrated.

---

### `scripts/weekly-review.mjs`

| Property | Value |
|---|---|
| **Status** | Deprecated |
| **Deprecated since** | 2026-07-07 |
| **Target removal** | Q4 2026 (v2.0.0) |
| **Replacement** | `workflows/weekly-digest.md` (GitHub Agentic Workflow) |

**Why deprecated:** Same reason as `pr-review.mjs` — direct Anthropic API
usage replaced by GitHub Copilot agentic runtime.

**Migration steps:**

1. Replace the `actions/weekly-review` caller with the new template:

   ```yaml
   # See templates/weekly-digest.yml for the complete replacement workflow
   ```

2. Update caller workflows to use `dispatch-agentic` pointing to
   `workflows/weekly-digest.md`.
3. Remove the `ANTHROPIC_API_KEY` secret once migrated.

---

## Completed Removals

_None yet._

---

## Deprecation Policy

1. A script or action enters the deprecation list with a minimum 2-quarter
   (6-month) notice period.
2. A deprecation notice comment is added at the top of the deprecated file.
3. The deprecated item is listed in `CHANGELOG.md` under the relevant release.
4. On the removal date, the item is deleted and the removal is documented here
   under "Completed Removals".
5. A major semver bump accompanies any breaking removal.
