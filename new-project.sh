#!/usr/bin/env bash
# Usage: ./new-project.sh project-X
set -e

NAME=$1
if [ -z "$NAME" ]; then echo "Usage: $0 <project-name>"; exit 1; fi

echo "Creating $NAME from template..."
gh repo create "lhuasheng/$NAME" \
  --template lhuasheng/project-template \
  --private \
  --clone

cd "$NAME"

echo "Adding secrets..."
gh secret set ANTHROPIC_API_KEY --repo "lhuasheng/$NAME"

echo "Enabling branch protection..."
gh api "repos/lhuasheng/$NAME/branches/main/protection" \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["CI Gates"]}' \
  --field enforce_admins=false \
  --field required_pull_request_reviews='{"required_approving_review_count":1}' \
  --field restrictions=null

echo "Done. cd $NAME and start building."