# AI-SDLC Trigger Guide

Every automated behaviour in a project repository is started by one of seven
triggers. This guide explains, for each trigger: what fires, the exact chain
of workflows and actions that runs, what token and permissions it needs, how
to verify it worked, and what usually breaks.

For the reasoning-layer workflow sources themselves, see the companion guide
[`docs/agentic-workflows.md`](agentic-workflows.md).

---

## How the whole system fits together

Two repositories play distinct roles:

```
lhuasheng/shared-sdlc        ← THIS REPO: deterministic gates (composite actions), thin caller
                               templates, bootstrap scripts, org-wide docs (docs/org/), AND the
                               canonical agentic workflow sources (.github/workflows/*.md +
                               compiled .lock.yml). Merge-blocking logic lives here.
lhuasheng/project-X          ← a real project, created from lhuasheng/project-template. Contains
                               thin callers pointing at shared-sdlc actions, plus VENDORED
                               copies of the agentic .md + .lock.yml
```

(`project-template` is the seed repo `new-project.sh` instantiates; the
former `shared-agentic` and `.github` repos are retired — their contents now
live here under `.github/workflows/` and `docs/org/`.)

**Dogfooding.** Because the agentic sources sit in this repo's own
`.github/workflows/`, every workflow also runs *here*: shared-sdlc issues get
triaged, `/ai-review` works on shared-sdlc PRs, the weekly digest covers this
repo, and a `v*` tag drafts release notes. Trigger any of them in this repo
to test the logic for free before projects vendor it.

**The two layers.** Deterministic gates (lint, test, PR size, required status
checks) are composite actions in this repo — they block merges and are
authoritative. Reasoning-heavy tasks (triage, review, digests, release notes)
are [GitHub Agentic Workflows](https://github.github.com/gh-aw/): a Markdown
prompt with YAML frontmatter, compiled by `gh aw compile` into a hardened
`.lock.yml` that GitHub Actions executes. Agentic output is advisory — it
never blocks a merge, and every write goes through gh-aw `safe-outputs`.

**Local vendoring, not cross-repo dispatch.** `new-project.sh` copies both
the `.md` and the precompiled `.lock.yml` from this repo into each
project's `.github/workflows/`. The workflows therefore run *inside the
analyzed repo* with the auto-provided `GITHUB_TOKEN` — no PAT, no
`ANTHROPIC_API_KEY`, no cross-repo permissions. Consumers never run
`gh aw compile`; that's only needed if you *edit* a vendored `.md`.

**The one iron rule of dispatch.** GitHub Actions only registers `.yml` /
`.yaml` files as workflows. A dispatch must therefore always target the
compiled `*.lock.yml` filename, never the `.md` source. The
`dispatch-agentic` action enforces this and fails fast on a `.md` filename.

**Two ways an agentic workflow starts:**

| Style | Workflows | How |
|---|---|---|
| Direct trigger | issue-triage, weekly-digest | The vendored `.lock.yml` carries its own `on:` trigger (`issues: opened`, cron). No caller workflow exists. |
| Dispatched | pr-review, release-notes | A thin caller reacts to the human-facing event and a shared-sdlc action dispatches the local `.lock.yml` with a JSON payload matching its `workflow_dispatch` inputs. |

---

## Trigger 1: Pull request or push to `main` → CI Gates

**Deterministic, merge-blocking.**

| | |
|---|---|
| Fires on | `pull_request` / `push` targeting `main` |
| Caller | `.github/workflows/ci.yml` (from `templates/ci.yml`) |
| Runs | [`actions/ci-gates`](../actions/ci-gates/) — install, lint, typecheck, tests, PR-size check; publishes `ci-summary.json` artifact |
| Token | `GITHUB_TOKEN` with `contents: read`, `pull-requests: write` |
| Blocking | Yes — branch protection requires the status check **`CI Gates`** (the job name in `ci.yml`; don't rename it without updating protection) |

**Verify:** open any PR → the `CI Gates` check appears in the PR checks box
and must pass before merge.

**Common failures:** stack commands in `ci.yml` don't match the project
(`lint-cmd`, `test-cmd`, …) — edit the caller's inputs, not the action.

## Trigger 2: `/ai-review` comment on a PR → AI PR Review

**Dispatched agentic (Pattern 4).**

| | |
|---|---|
| Fires on | `issue_comment: created` where the issue is a PR and the body starts with `/ai-review` |
| Caller | `.github/workflows/ai-pr-review.yml` (from `templates/ai-pr-review.yml`) |
| Chain | caller → [`actions/ai-pr-review`](../actions/ai-pr-review/) (validates the PR exists) → [`actions/dispatch-agentic`](../actions/dispatch-agentic/) → dispatches local **`pr-review.lock.yml`** with `{pr_number, repository, triggered_by}` |
| Agentic run | Agent reviews the diff and posts a structured comment via `safe-outputs add-comment` |
| Token | `GITHUB_TOKEN`; caller needs `actions: write` (to dispatch), `pull-requests: write` |

**Verify:** comment `/ai-review` on an open PR. Two runs must appear in the
Actions tab within ~1 minute: “AI PR Review Caller” (green) **and** a
separate “AI PR Review” run. The review comment lands on the PR a few
minutes later. A green caller with **no** second run means the dispatch
silently failed — check the caller's `dispatch-status` output (expect `204`).

**Common failures:** `pr-review.lock.yml` missing/renamed in the repo (404 on
dispatch); payload keys not matching the lock's `workflow_dispatch` inputs
(422); Copilot agentic policy disabled (the second run starts, then its agent
job fails).

## Trigger 3: Issue opened → Issue Triage

**Direct-trigger agentic — no caller, no dispatch.**

| | |
|---|---|
| Fires on | `issues: opened` — the trigger is inside the vendored **`issue-triage.lock.yml`** itself |
| Runs | Agent fetches the issue, classifies it (bug / feature / question / duplicate), applies labels and a short triage comment via `safe-outputs` |
| Token | `GITHUB_TOKEN` (safe-outputs jobs carry the needed `issues: write`) |
| Manual run | Not possible — the lock has no `workflow_dispatch`. Open a test issue instead. |

**Verify:** open a throwaway issue → an “Issue Triage” run appears
immediately; labels (e.g. `bug`, `needs-triage`, a `P?` priority) and a
comment containing `<!-- ai-sdlc:triaged -->` land within ~30 s.

**Common failures:** label doesn't exist in the repo (run the **Setup — New
Repo Bootstrap** workflow once, Trigger 7); Copilot policy disabled.

## Trigger 4: Monday 09:00 UTC → Weekly Engineering Digest

**Direct-trigger agentic — no caller, no dispatch.**

| | |
|---|---|
| Fires on | `schedule: cron '0 9 * * 1'` inside the vendored **`weekly-digest.lock.yml`**, plus `workflow_dispatch` for manual runs |
| Runs | Agent lists PRs merged in the last 7 days, reads their diffs and repo health via its GitHub tools, and files one digest issue via `safe-outputs create-issue` |
| Token | `GITHUB_TOKEN` |
| Manual run | `gh workflow run weekly-digest.lock.yml --repo owner/project` (no inputs) |

**Verify:** trigger manually → a new issue titled
`[Weekly Digest] {YYYY-WXX} — Engineering Summary` with labels `automated`,
`code-review`.

**Note:** there is deliberately **no** `weekly-digest.yml` caller — the cron
lives in the lock. If you see one in an older project, delete it (it
double-fires and its dispatch payload doesn't match the lock's inputs).

## Trigger 5: Semver tag push → Release Notes

**Dispatched agentic (Pattern 4).**

| | |
|---|---|
| Fires on | `push` of a tag matching `v*` |
| Caller | `.github/workflows/release.yml` (from `templates/release.yml`) |
| Chain | caller → [`actions/release-notes-router`](../actions/release-notes-router/) (skips non-semver tags with a warning) → `dispatch-agentic` → dispatches local **`release-notes.lock.yml`** with `{tag, repository, base_tag, triggered_by}` |
| Agentic run | Agent drafts release notes and opens a PR via `safe-outputs create-pull-request` |
| Token | `GITHUB_TOKEN`; caller needs `actions: write`, `contents: write`, `pull-requests: write` |

**Verify:** `git tag v0.0.1 && git push origin v0.0.1` → “Release” run
(green) plus a separate “Release Notes” agentic run → a draft release-notes
PR appears.

**Common failures:** tag isn't semver (`v1.2` won't match — router skips
it); same dispatch failure modes as Trigger 2.

## Trigger 6: Daily 00:37 UTC or manual → Agentic Maintenance

**gh-aw housekeeping (generated by `gh aw compile`, vendored by `new-project.sh`).**

| | |
|---|---|
| Fires on | daily cron inside `agentics-maintenance.yml`, plus `workflow_dispatch` with an `operation` input |
| Runs | Scheduled: closes expired safe-output issues/PRs/discussions, cleans cache memories. On demand: `validate` (lint all agentic workflows), `create_labels`, `activity_report`, `safe_outputs` replay, `update`/`upgrade`, `forecast`, … |
| Token | `GITHUB_TOKEN`; manual operations require the actor to be an admin/maintainer |

**Verify / useful commands:**

```bash
gh workflow run agentics-maintenance.yml -f operation=validate   # lint all vendored agentic workflows
gh workflow run agentics-maintenance.yml -f operation=activity_report
```

## Trigger 7: Manual → Setup — New Repo Bootstrap

| | |
|---|---|
| Fires on | `workflow_dispatch` only (`.github/workflows/setup-repo.yml`, shipped by `project-template`) |
| Runs | [`actions/setup-repo`](../actions/setup-repo/) — creates the standard label taxonomy |
| When | Once, right after creating a repo. Safe to re-run (idempotent). |

---

## Catalogue triggers (not vendored by default)

This repo also ships workflows a project can vendor when needed; their
triggers activate as soon as both `.md` + `.lock.yml` are copied in:

| Workflow | Trigger |
|---|---|
| `docs-sync` | `push` to `main` touching `src/**`, `lib/**`, `actions/**`, `scripts/**` |
| `ci-investigator` | `workflow_run` of **CI** completing (investigates failures) |
| `architecture-review` | `workflow_run` of **CI** completing (reviews after success) |
| `vuln-triage` | `workflow_run` of **CI** completing (reads security artifacts) |
| `coverage-suggester` | `workflow_run` of **CI** completing (reads coverage artifact) |
| `tech-debt` | cron, 1st of the month 09:00 UTC + manual |
| `compliance-report` | cron, 1st of the month 09:00 UTC + manual |

> `workflow_run` workflows key off the workflow **name** `CI` — the caller
> `ci.yml` must keep `name: CI` for them to fire.

---

## Quick health check for a project repo

```bash
gh workflow list --repo owner/project          # locks registered as workflows?
gh workflow run weekly-digest.lock.yml --repo owner/project
gh aw status                                   # per-workflow health (needs gh-aw extension)
gh aw logs                                     # agent transcripts
gh aw compile && git diff --exit-code          # committed locks match the .md sources?
```

If an agentic run starts but its **agent** job fails immediately, check the
org's Copilot agentic-workflow policy and the token fallback chain
(`GH_AW_GITHUB_TOKEN` → `GITHUB_TOKEN`) before debugging the prompt.
