# GitHub Copilot Instructions

These instructions apply to every AI suggestion in this repository.
Copilot must follow them. Engineers must review every suggestion against them.

---

## Code Generation Rules

### What you MUST do
- Write functions that do ONE thing. If a function name needs "and", split it.
- Add a JSDoc/docstring to every exported function: purpose, params, return, one example.
- Write the happy path first, then handle errors explicitly — no silent catches.
- Keep functions under 40 lines. If longer, ask yourself what to extract.
- Name variables for what they contain, not how they're computed (`userList`, not `mappedArray`).

### What you MUST NOT do
- Do not generate `try { ... } catch(e) {}` with no error handling body.
- Do not hardcode secrets, API keys, connection strings, or environment-specific URLs.
- Do not generate console.log statements for production paths — use the project logger.
- Do not suggest `any` types in TypeScript without a comment explaining why.
- Do not generate code that modifies shared state without a comment about thread safety.

---

## PR Size Rules
- PRs must be under 400 lines changed (excluding lock files, generated files).
- If a feature requires more, break it into: (1) data/schema, (2) backend logic, (3) UI.

---

## Testing Rules
- Every new function needs at least one test covering its primary behaviour.
- Every bug fix needs a test that would have caught the bug.
- Tests must be in the same PR as the code they test — no "I'll add tests later".

---

## Commit Message Format
```
<type>(<scope>): <short summary>

[optional body — what changed and WHY, not what the diff shows]
[optional: closes #issue-number]
```
Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`
Example: `feat(export): add CSV download for dashboard data — closes #42`

---

## Architecture Decision Records
Any decision that affects more than one file or will be hard to reverse
must have an ADR in `/docs/adr/` before the code is written.
Use the template at `/docs/adr/TEMPLATE.md`.
