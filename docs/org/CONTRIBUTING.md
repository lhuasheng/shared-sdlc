# Contributing to This Project

**Read this before writing your first line of code.**
This is not optional. The gates described here are enforced automatically.

---

## The 5 Gates

Every piece of work passes through 5 gates. Skipping a gate blocks the next one.

```
Gate 1: Intent     → Is the spec approved before you branch?
Gate 2: Generation → Are you owning what Copilot generates?
Gate 3: PR Review  → Has the PR been pre-screened by AI + peer?
Gate 4: CI         → Do all automated checks pass?
Gate 5: Deploy     → Has it been staged and monitored?
```

---

## Gate 1 — Intent (Before You Write Code)

1. **Find or create a GitHub Issue** using the Feature Request, Bug Report, or Incident template.
2. **Fill in every field.** Acceptance criteria must be specific enough that "done" is unambiguous.
3. **Wait for spec approval.** The tech lead comments "approved" (and may apply the `gate-1-spec` label). No branch before approval. (Incidents skip this — see Gate 5.)
4. **Create your branch** from `main`:
   ```
   git checkout main && git pull
   git checkout -b feat/issue-42-csv-export
   ```
   Branch naming: `feat/`, `fix/`, `refactor/`, `docs/` + issue number + short description.

> **Automated triage**: each project repo vendors the `issue-triage` agentic workflow (sourced from [`lhuasheng/shared-sdlc`](https://github.com/lhuasheng/shared-sdlc), compiled `.lock.yml` included), which auto-classifies and labels new issues within ~30 seconds of opening. It requires GitHub Copilot's agentic workflow feature to be enabled for this org (Settings → Copilot → Policies) — until that's confirmed on, treat triage as manual.

> Why: AI generates the wrong thing perfectly if the spec is vague.
> Catching ambiguity at Gate 1 costs 10 minutes. Catching it at Gate 3 costs 2 hours.

---

## Gate 2 — Generation (While You Code)

### Using GitHub Copilot
- **You own every line Copilot writes.** "Copilot wrote it" is not an excuse for a bug.
- **Write the function signature yourself**, then let Copilot suggest the body.
- **Read every suggestion before accepting.** No "accept all" without reading.
- **Commit in small, logical chunks.** Never one giant "implement feature" commit.
- AI-generated code must pass the same standards as hand-written code.

### Commit discipline
```
feat(export): add CSV serialisation for dashboard data

Closes #42

Used streams to avoid loading entire dataset into memory.
Handles empty data set by returning 204 rather than empty CSV.
```

Commits must explain WHY, not just WHAT (the diff already shows what).

---

## Gate 3 — PR Review

### Opening a PR
- PR description must include `Closes #NNN` (links the spec, required by CI).
- PR must be under **400 lines changed** (excludes lock files, snapshots, generated files).
  If your feature is larger, split into: schema → logic → UI.
- Fill in the PR template fully.

### Getting an AI pre-screen
Comment `/ai-review` on your own PR. Claude will post a review within ~2 minutes.
Fix any 🔴 issues before requesting human review. This is mandatory.

### Human review
- Assign the tech lead (and a peer if the team is > 6 people).
- Address all comments, or explicitly explain why you're not.
- Do not merge your own PR.

---

## Gate 4 — CI (Automated, Blocks Merge)

These checks run automatically and **block merge if they fail**:

| Check | What it catches |
|---|---|
| ESLint | Style violations, obvious errors |
| TypeScript | Type errors |
| Tests + Coverage | Broken behaviour (coverage threshold is set by your own `test:coverage` config) |
| PR size | PRs over 400 lines |
| Security scan | Known vulnerabilities, hardcoded secrets |
| Issue link | PRs not linked to a spec |

If CI fails: fix it. Do not ask for exceptions. Do not disable the check.

---

## Gate 5 — Deploy

### Standard flow
1. **Merge to `main`** via a reviewed PR (Gates 1-4 above). `ci-gates` blocks the merge until lint, tests, PR size, security scan, and the spec-link check all pass.
2. **Cut a release** by pushing a semver tag once you're ready to ship:
   ```
   git tag v1.4.0 && git push origin v1.4.0
   ```
3. **Release notes are drafted for you** — the tag push triggers `release-notes-router`, which dispatches the vendored `release-notes.lock.yml` agentic workflow in the same repo to open a PR with generated notes (requires Copilot's agentic workflow feature enabled for this org; write them by hand until then).
4. **Deploy the tagged commit** using this project's own pipeline. `shared-sdlc` enforces the gates before a release; it doesn't prescribe where the release goes.
5. **Monitor after deploy** — watch error rates / Sentry for your team's normal soak window.

### Incidents
Use the Incident template (labelled `bug` + `P1-critical`). Assign an engineer immediately — don't wait for Gate 1 spec approval. Fix forward through Gates 2-4, merge to `main`, then leave a short root-cause comment on the issue before closing it. There's no automated RCA capture today, so that write-up is on you.

---

## ADR — Architecture Decision Records

Any decision that:
- affects more than one file, **or**
- will be hard to reverse

...needs an ADR in `/docs/adr/` **before the code is written**.
Use the template at `/docs/adr/TEMPLATE.md`.

---

## Day 1 Checklist for New Engineers

- [ ] Read this file completely
- [ ] Clone the repo, run `npm install`, run `npm test` — everything green?
- [ ] Read `.github/copilot-instructions.md`
- [ ] Read the most recent ADR in `/docs/adr/`
- [ ] Pair with a teammate on your first PR (even if small)
- [ ] Ask questions in the team channel, not in PRs

---

## What happens if you skip a gate?

- **Gate 1**: PR will be closed and you'll be asked to write the spec first.
- **Gate 2**: Bugs traced back to unread Copilot output are a learning moment, documented.
- **Gate 3**: PRs without `/ai-review` and without 🔴 items addressed will not be approved.
- **Gate 4**: CI blocks the merge. Period.
- **Gate 5**: Deploying an untagged commit (skipping the release step) is a team norm violation.

This isn't bureaucracy — it's how we ship reliably with a team that uses AI heavily.
