# PR Comment Marker Convention

All agentic workflows and composite actions in the AI-SDLC framework update a
**single consolidated PR comment** rather than posting multiple separate
comments. This prevents comment noise and provides a unified developer
experience.

---

## Marker format

The consolidated comment is identified by an HTML comment marker embedded at
the top of the comment body:

```
<!-- ai-sdlc-summary -->
```

This marker is invisible to readers but is used by `scripts/upsert-summary-comment.mjs`
to locate and update the comment.

**Rules:**

1. The marker must be the very first line of the comment body.
2. The marker string is exactly `<!-- ai-sdlc-summary -->` — no variations.
3. Only one such comment should exist per PR at any time. The upsert script
   enforces this by updating the existing comment rather than creating a new one.

---

## Comment structure

The consolidated comment contains named sections separated by HTML comment
delimiters:

```markdown
<!-- ai-sdlc-summary -->
## 🤖 AI-SDLC Summary

<!-- section:ci-gates -->
### ✅ CI Gates
All checks passed.
<!-- /section:ci-gates -->

<!-- section:ai-review -->
### 🔍 AI Pre-Screen Review
**Verdict:** APPROVE
...
<!-- /section:ai-review -->

<!-- section:security -->
### 🛡️ Security Scan
No issues found.
<!-- /section:security -->

---
_Last updated: 2026-07-07T09:15:00Z — [AI-SDLC](https://github.com/lhuasheng/shared-sdlc)_
```

Each section is wrapped in `<!-- section:<name> -->` / `<!-- /section:<name> -->`
delimiters so that individual sections can be updated independently without
affecting other sections.

---

## Section names

| Section name | Updated by | Description |
|---|---|---|
| `ci-gates` | `actions/ci-gates` | CI check results |
| `ai-review` | `workflows/pr-review.md` | AI pre-screen review |
| `security` | `actions/ci-gates` | Security scan results |
| `architecture` | `workflows/architecture-review.md` | Architecture review |
| `coverage` | `workflows/coverage-suggester.md` | Coverage improvement suggestions |

---

## Usage

Use `scripts/upsert-summary-comment.mjs` to update a section:

```bash
GH_TOKEN=<token> \
GITHUB_REPOSITORY=owner/repo \
PR_NUMBER=42 \
SECTION_NAME=ai-review \
SECTION_BODY="### 🔍 AI Pre-Screen Review\n**Verdict:** APPROVE\n\nAll checks passed." \
node scripts/upsert-summary-comment.mjs
```

Or pass the section body via a file:

```bash
SECTION_BODY_FILE=review_section.md node scripts/upsert-summary-comment.mjs
```
