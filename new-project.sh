#!/usr/bin/env bash
# Usage: ./new-project.sh project-X
#
# Bootstraps a new project repository and vendors required agentic workflow
# sources and lock files locally so dispatching and safe outputs run in the
# analyzed repo.
set -euo pipefail

NAME=${1:-}
if [ -z "$NAME" ]; then
  echo "Usage: $0 <project-name>"
  exit 1
fi

OWNER=${OWNER:-lhuasheng}
TEMPLATE_REPO=${TEMPLATE_REPO:-lhuasheng/project-template}
SHARED_SDLC_REPO=${SHARED_SDLC_REPO:-lhuasheng/shared-sdlc}
SHARED_SDLC_REF=${SHARED_SDLC_REF:-main}
AGENTIC_REPO=${AGENTIC_REPO:-lhuasheng/shared-agentic}
AGENTIC_REF=${AGENTIC_REF:-main}
REPO="${OWNER}/${NAME}"

fetch_repo_file() {
  local repo=$1
  local path=$2
  local ref=$3
  local output=$4

  gh api "repos/${repo}/contents/${path}?ref=${ref}" --jq '.content' | base64 -d > "$output"
}

echo "Creating ${REPO} from template ${TEMPLATE_REPO}..."
gh repo create "$REPO" \
  --template "$TEMPLATE_REPO" \
  --private \
  --clone

cd "$NAME"

echo "Syncing shared-sdlc caller workflows into ${REPO}..."
mkdir -p .github/workflows

CALLER_WORKFLOWS=(
  "ci.yml"
  "ai-pr-review.yml"
  "weekly-digest.yml"
  "issue-triage.yml"
  "release.yml"
)

for wf in "${CALLER_WORKFLOWS[@]}"; do
  fetch_repo_file "$SHARED_SDLC_REPO" "templates/${wf}" "$SHARED_SDLC_REF" ".github/workflows/${wf}"

  # Keep shared-sdlc action references configurable.
  sed -i "s|lhuasheng/shared-sdlc|${SHARED_SDLC_REPO}|g" ".github/workflows/${wf}"

  # Local dispatch: use repo-scoped token and target this repository's workflows.
  sed -i 's|secrets.AGENTIC_DISPATCH_TOKEN|secrets.GITHUB_TOKEN|g' ".github/workflows/${wf}"
  sed -i 's|agentic-workflow-repo: lhuasheng/shared-agentic|agentic-workflow-repo: ${{ github.repository }}|g' ".github/workflows/${wf}"
  sed -i 's|workflow-repo: lhuasheng/shared-agentic|workflow-repo: ${{ github.repository }}|g' ".github/workflows/${wf}"
done

echo "Vendoring compiled agentic workflows and sources from ${AGENTIC_REPO}@${AGENTIC_REF}..."
LOCAL_AGENTIC_WORKFLOW_IDS=(
  "pr-review"
  "weekly-digest"
  "issue-triage"
  "release-notes"
)

for wf in "${LOCAL_AGENTIC_WORKFLOW_IDS[@]}"; do
  fetch_repo_file "$AGENTIC_REPO" ".github/workflows/${wf}.md" "$AGENTIC_REF" ".github/workflows/${wf}.md"
  fetch_repo_file "$AGENTIC_REPO" ".github/workflows/${wf}.lock.yml" "$AGENTIC_REF" ".github/workflows/${wf}.lock.yml"
done

if ! git diff --quiet -- .github/workflows; then
  git add .github/workflows
  git commit -m "chore: bootstrap local AI-SDLC workflows"
  git push origin main
  echo "Pushed workflow bootstrap commit to ${REPO}@main"
else
  echo "No workflow changes detected; nothing to commit."
fi

echo "Enabling branch protection..."
gh api "repos/${REPO}/branches/main/protection" \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["CI Gates"]}' \
  --field enforce_admins=false \
  --field required_pull_request_reviews='{"required_approving_review_count":1}' \
  --field restrictions=null

echo "Done. ${REPO} now runs shared-sdlc actions with local compiled agentic workflow sources and lock files."