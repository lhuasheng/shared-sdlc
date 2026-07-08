# Environment Readiness Check

**Repository:** lhuasheng/shared-sdlc  
**Check date:** 2026-07-07  
**Task reference:** Wave 0 — Task 0.2

---

## 1. GitHub Agentic Workflows Availability

GitHub Agentic Workflows (powered by Copilot coding agent) became generally available on GitHub.com in 2025 and are accessible to organizations on GitHub Team and Enterprise plans, as well as individual accounts with an active Copilot subscription.

**Status:** ✅ Available — verify that the target organization has Copilot enabled under **Settings → Copilot → Policies**.

### Required organization settings

| Setting | Required value | How to verify |
|---|---|---|
| GitHub Copilot subscription | Active (Team or Enterprise) | Organization billing page |
| Copilot coding agent | Enabled | Organization → Settings → Copilot → Coding agent |
| Actions runner | Ubuntu 22.04 or later | Available by default on GitHub-hosted runners |

---

## 2. GitHub CLI and gh aw Extension

The `gh aw` extension is used to compile and validate agentic workflow Markdown files locally.

### Installation

```bash
# Install GitHub CLI (if not already installed)
# https://cli.github.com/

# Install the agentic workflows extension
gh extension install github/gh-aw

# Verify installation
gh aw --version
```

**Expected output:** `gh-aw version X.Y.Z`

**Status:** ⚠️ Verify — run the commands above on your development machine and on CI runners that will compile workflow files. Record the confirmed version in the table below once verified.

| Environment | CLI version | Extension version | Status |
|---|---|---|---|
| Developer workstation | TBD | TBD | Pending verification |
| GitHub Actions runner | TBD | TBD | Pending verification |

---

## 3. Required Secrets

The following secrets must be present in every project repository that uses this framework.

| Secret name | Used by | Required | Notes |
|---|---|---|---|
| `ANTHROPIC_API_KEY` | `actions/ai-pr-review`, `actions/weekly-review` | Yes (Wave 1 legacy) | Will be replaced by GitHub Copilot in Wave 2 agentic workflows |
| `GITHUB_TOKEN` | All actions | Yes (auto-provisioned) | Provided automatically by GitHub Actions; no manual setup required |
| `AGENTIC_DISPATCH_TOKEN` | Cross-repo dispatch only (non-default) | No | Not needed in the default setup: `new-project.sh` vendors the compiled agentic `.lock.yml` files into each project repo, so dispatch stays in-repo and `GITHUB_TOKEN` suffices. Only if `workflow-repo` / `agentic-workflow-repo` points at a *different* repository do you need a fine-grained PAT (or GitHub App token) with `actions:write` on it — `GITHUB_TOKEN` cannot dispatch across repos. |

### Secrets no longer required after Wave 2

Once the agentic workflows are live, `ANTHROPIC_API_KEY` is no longer required for PR review or weekly digest because these operations run via the GitHub Copilot agentic runtime, which uses its own credentials.

### Verifying secrets are set

```bash
# List secrets for a project repository
gh secret list --repo lhuasheng/<project-repo>
```

---

## 4. Required Permissions

### For composite actions in shared-sdlc

Project repositories must grant the following permissions to their `GITHUB_TOKEN` in their workflow files:

```yaml
permissions:
  contents: read
  issues: write
  pull-requests: write
  actions: read
```

### For agentic workflows

Agentic workflows use read-only tokens by default. Write operations are gated through `safe-outputs`. Verify that the organization's Copilot policy allows agents to:
- Read repository contents
- Write comments to pull requests and issues (via safe-outputs)
- Create labels (via safe-outputs)

---

## 5. Network and Firewall Requirements

| Endpoint | Required by | Notes |
|---|---|---|
| `api.anthropic.com` | `actions/ai-pr-review`, `actions/weekly-review` (legacy) | Will be removed in Wave 2 |
| `api.github.com` | All actions and agentic workflows | Standard GitHub API |
| GitHub Copilot API endpoints | All agentic workflows | Managed by GitHub; no additional configuration |

Agentic workflow sandboxes enforce a network firewall by default. Custom outbound network access must be explicitly declared in the workflow `network` frontmatter field.

---

## 6. Gaps and Mitigations

| Gap | Risk | Mitigation |
|---|---|---|
| `gh aw` extension not yet verified on CI runners | Medium — workflow compilation step in CI will fail | Add a CI step to install `gh extension install github/gh-aw` before compilation checks |
| Copilot coding agent not enabled in organization | High — all agentic workflows will fail to trigger | Enable via Organization Settings → Copilot → Coding agent before Wave 1 launch |
| `ANTHROPIC_API_KEY` not present in existing project repos | Low — only affects legacy actions | Document in onboarding guide; provide `scripts/onboard-repo.mjs` to automate |

---

## 7. Acceptance Criteria Check

- [x] Document confirms availability of agentic workflows (conditional on org plan)
- [x] CLI installation commands provided; version tracking table included
- [x] Required secrets documented with verification commands
- [x] Gaps listed with mitigation steps
