# Agentic Workflow Sources — authoring and trigger reference

How each agentic workflow in `.github/workflows/` starts, what it needs, what it
produces, and how to verify it. For the project-repo view of the same
triggers (callers, composite actions, tokens), see
[`docs/triggers.md`](triggers.md).

---

## The whole logic in one page

1. **Author** — each workflow is a Markdown file: YAML frontmatter (trigger,
   permissions, engine, safe-outputs) + a natural-language prompt body.
2. **Compile** — `gh aw compile` turns every `.md` into a hardened
   `<name>.lock.yml`. The lock file *is* the GitHub Actions workflow: pinned
   actions, sandboxed agent container, network firewall, and safe-outputs
   jobs. Both files are committed here; the lock header records a
   `frontmatter_hash`/`body_hash` so drift is detectable.
3. **Vendor** — projects never fetch at runtime.
   [`new-project.sh`](../new-project.sh)
   copies the `.md` + `.lock.yml` (plus `agentics-maintenance.yml`,
   `.github/aw/actions-lock.json`, `.gitattributes`) into each project's
   `.github/workflows/`. Consumers use the precompiled locks as-is — no
   `gh aw compile` needed unless they edit a vendored `.md`.
4. **Run** — once vendored, the `on:` trigger in the lock fires off the
   *project's own* events (issue opened, cron, `workflow_dispatch`), using
   the repo-scoped `GITHUB_TOKEN`. Dispatched workflows are started by
   shared-sdlc composite actions, which must always target the
   **`.lock.yml` filename** — GitHub Actions never registers `.md` files.
5. **Write** — the agent itself is read-only. Every write (labels, comments,
   issues, PRs) goes through the declared `safe-outputs`, executed by
   separate sanitizing jobs.
6. **Dogfood** — because these files live in this repo's own
   `.github/workflows/`, they run *here* too: issues in shared-sdlc get
   triaged, `/ai-review` works on shared-sdlc PRs (via the `ai-pr-review.yml`
   caller kept alongside), the weekly digest covers this repo, and a `v*` tag
   drafts release notes. A broken workflow therefore surfaces in this repo
   before any project vendors it.

Two start styles follow from the frontmatter:

- **Direct trigger** — the lock reacts to repo events by itself
  (`issues: opened`, cron, `push`, `workflow_run`). No caller workflow.
- **Dispatched** — the lock only has `workflow_dispatch` with typed inputs;
  a shared-sdlc action supplies the payload. The payload keys must match the
  declared inputs exactly, or the dispatch API returns 422.

---

## Vendored into every project by `new-project.sh`

### issue-triage — direct trigger

| | |
|---|---|
| Trigger | `issues: [opened]` |
| Safe-outputs | `add-labels`, `add-comment` |
| Manual run | Not possible (no `workflow_dispatch`) — open a test issue |

Classifies a new issue (bug / feature / question / duplicate), applies the
label taxonomy + priority, posts a short comment marked
`<!-- ai-sdlc:triaged -->`. **Verify:** open an issue; labels + comment
within ~30 s.

### weekly-digest — direct trigger (cron)

| | |
|---|---|
| Trigger | `schedule: '0 9 * * 1'` (Mon 09:00 UTC) + `workflow_dispatch` (no inputs) |
| Safe-outputs | `create-issue` |
| Manual run | `gh workflow run weekly-digest.lock.yml` |

Gathers the last 7 days of merged PRs, their diffs, and repo health via its
GitHub tools (no caller pre-steps, no artifacts), then files one
`[Weekly Digest] {YYYY-WXX} — Engineering Summary` issue.

### pr-review — dispatched

| | |
|---|---|
| Trigger | `workflow_dispatch` only |
| Inputs | `pr_number` (required), `repository` (required), `triggered_by` |
| Dispatched by | `shared-sdlc/actions/ai-pr-review` when someone comments `/ai-review` on a PR |
| Safe-outputs | `add-comment` |

Pre-screens the PR diff and posts a structured review comment. **Verify:**
comment `/ai-review` on a PR → separate “AI PR Review” run → comment.

### release-notes — dispatched

| | |
|---|---|
| Trigger | `workflow_dispatch` only |
| Inputs | `tag` (required), `repository` (required), `base_tag`, `triggered_by` |
| Dispatched by | `shared-sdlc/actions/release-notes-router` on a `v*` semver tag push |
| Safe-outputs | `create-pull-request` |

Drafts release notes comparing `base_tag..tag` and opens a PR for human
review. **Verify:** push a semver tag → agentic run → draft PR.

---

## Catalogue workflows (vendor on demand)

Copy the `.md` + `.lock.yml` pair into a project to activate. All are direct
triggers.

| Workflow | Trigger | Safe-outputs | Notes |
|---|---|---|---|
| `docs-sync` | `push` to `main` touching `src/**`, `lib/**`, `actions/**`, `scripts/**` | `create-pull-request` | Suggests doc updates for undocumented source changes |
| `ci-investigator` | `workflow_run` of **CI** completed | `add-comment`, `create-issue` | Root-causes CI failures from `ci-summary.json` |
| `architecture-review` | `workflow_run` of **CI** completed | `add-labels`, `add-comment` | Reviews architecture after CI passes |
| `vuln-triage` | `workflow_run` of **CI** completed | `add-comment`, `add-labels` | Ranks findings from security artifacts |
| `coverage-suggester` | `workflow_run` of **CI** completed | `add-comment` | Suggests tests from `coverage.json` |
| `tech-debt` | cron `0 9 1 * *` + manual | `create-issue` | Monthly debt scan |
| `compliance-report` | cron `0 9 1 * *` + manual | `create-issue` | Monthly compliance audit |

> The `workflow_run` triggers reference the workflow **name** `CI` — the
> project's `ci.yml` must keep `name: CI` or these will never fire.

---

## Maintenance workflow

`agentics-maintenance.yml` is generated by `gh aw compile` (do not edit).
Daily cron closes expired safe-output artifacts and cleans cache memories;
`workflow_dispatch` offers admin operations, most usefully:

```bash
gh workflow run agentics-maintenance.yml -f operation=validate        # lint all agentic workflows
gh workflow run agentics-maintenance.yml -f operation=create_labels
gh workflow run agentics-maintenance.yml -f operation=activity_report
```

---

## Editing rules

1. Edit the `.md`, never the `.lock.yml`.
2. Recompile and commit **both** files:
   ```bash
   gh extension install github/gh-aw   # once; this repo compiles with v0.81.6
   gh aw compile
   ```
3. If the workflow is one of the four vendored ones, re-vendor the updated
   pair into existing projects (new projects pick it up automatically).
4. Changing a dispatched workflow's `workflow_dispatch` inputs is a breaking
   change for the shared-sdlc action that dispatches it — update the payload
   there in the same change.

## Prerequisites

All workflows use `engine: copilot` with the `copilot-requests: write`
permission: the org must have GitHub Copilot with the agentic-workflows
policy enabled (**Settings → Copilot → Policies**). If a run starts but the
*agent* job fails immediately, that policy (or the
`GH_AW_GITHUB_TOKEN` → `GITHUB_TOKEN` fallback) is the first suspect.
