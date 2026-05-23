// Reads pr.diff and pr_meta.json from the working directory.
// Writes review_comment.md.
// Requires env: ANTHROPIC_API_KEY.

import { readFileSync, writeFileSync } from 'node:fs';

const diff = readFileSync('pr.diff', 'utf8').slice(0, 8000); // ~2k tokens
const meta = JSON.parse(readFileSync('pr_meta.json', 'utf8'));

const prompt = `You are a senior engineer doing a pre-screen review of this pull request before the tech lead reviews it. Your job is to catch issues so the tech lead's review is faster and higher quality.

PR Title: ${meta.title}
PR Description: ${meta.body || '(no description)'}
Author: @${meta.author.login}
Size: +${meta.additions} / -${meta.deletions} lines

Diff:
\`\`\`diff
${diff}
\`\`\`

Review this PR against these criteria:

1. **Correctness** — Will this code do what the PR description says? Spot logic errors, off-by-ones, missing null checks.
2. **Security** — Any hardcoded secrets, SQL injection vectors, missing input validation, exposed internals?
3. **Copilot conventions** — Does the code follow the rules in .github/copilot-instructions.md? (Functions under 40 lines, no silent catches, proper naming, tests present)
4. **Test coverage** — Are the tests meaningful? Do they test behaviour, not implementation?
5. **PR hygiene** — Is it linked to an issue? Is the PR description clear?

Format your response as:

## AI Pre-Screen Review 🤖

**Verdict:** [APPROVE / REQUEST CHANGES / NEEDS DISCUSSION]

### 🔴 Must Fix Before Merge
(Issues that will cause bugs, security problems, or violate hard rules. If none, say "None found.")

### 🟡 Should Address
(Convention violations, missing tests, unclear code. If none, say "None found.")

### 🟢 Looks Good
(1-2 specific things done well.)

### 💬 Questions for Author
(Things that aren't wrong but need clarification.)

---
_This is an automated pre-screen. A human reviewer will make the final call._`;

const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': process.env.ANTHROPIC_API_KEY,
    'anthropic-version': '2023-06-01',
  },
  body: JSON.stringify({
    model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-6',
    max_tokens: 1000,
    messages: [{ role: 'user', content: prompt }],
  }),
});

if (!response.ok) {
  console.error(`Anthropic API ${response.status}:`, await response.text());
  process.exit(1);
}

const data = await response.json();
const reviewText = data.content.find((b) => b.type === 'text')?.text || 'Review failed.';
writeFileSync('review_comment.md', reviewText);
console.log('Review written to review_comment.md');
