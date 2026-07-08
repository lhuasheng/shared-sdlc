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
| **Replacement** | `.github/workflows/pr-review.md` in this repo (GitHub Agentic Workflow, vendored into each project) |

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
       agentic-workflow-repo: ${{ github.repository }}
       agentic-workflow-ref: main
   ```

   With the default local-vendoring setup the compiled `pr-review.lock.yml`
   lives in your own repo, so `GITHUB_TOKEN` is sufficient. Only if you point
   `agentic-workflow-repo` at a *different* repository do you need a
   fine-grained PAT (or GitHub App token) with `actions:write` on it,
   because `GITHUB_TOKEN` cannot dispatch across repos.
2. Ensure `pr-review.md` and its compiled `pr-review.lock.yml` are vendored
   into your repo's `.github/workflows/` (`new-project.sh` does this; for an
   existing repo, copy both files from this repo’s `.github/workflows/`).
3. Remove the `ANTHROPIC_API_KEY` secret from your project repository once
   migrated.

---

### `scripts/weekly-review.mjs`

| Property | Value |
|---|---|
| **Status** | Deprecated |
| **Deprecated since** | 2026-07-07 |
| **Target removal** | Q4 2026 (v2.0.0) |
| **Replacement** | `.github/workflows/weekly-digest.md` in this repo (GitHub Agentic Workflow, vendored into each project) |

**Why deprecated:** Same reason as `pr-review.mjs` — direct Anthropic API
usage replaced by GitHub Copilot agentic runtime.

**Migration steps:**

1. Delete the `actions/weekly-review` caller workflow — no caller is needed.
2. Vendor `weekly-digest.md` and its compiled `weekly-digest.lock.yml` from
   this repo into `.github/workflows/` (`new-project.sh` does this for
   new repos). The lock file carries its own Monday 09:00 UTC cron trigger.
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
