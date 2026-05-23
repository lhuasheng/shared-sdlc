// Reads pr_diffs.json (array of {pr, title, author, diff}).
// Writes review_output.md.
// Requires env: ANTHROPIC_API_KEY.

import { readFileSync, writeFileSync } from 'node:fs';

const diffs = JSON.parse(readFileSync('pr_diffs.json', 'utf8'));

if (diffs.length === 0) {
  writeFileSync(
    'review_output.md',
    '# Weekly AI Code Review\n\nNo merged PRs found in the last 7 days.',
  );
  process.exit(0);
}

const diffSummary = diffs
  .map(
    (d) =>
      `### PR #${d.pr}: ${d.title} (by @${d.author})\n\`\`\`diff\n${d.diff.slice(0, 1500)}\n\`\`\``,
  )
  .join('\n\n');

const prompt = `You are a senior engineer reviewing a week of merged pull requests for a team using GitHub Copilot and AI code generation heavily. Your job is to spot PATTERNS, not nitpick individual lines.

Here are the diffs from the last week's merged PRs:

${diffSummary}

Produce a review report in this exact format:

## 🔴 Critical Patterns (must fix)
List any security issues, silent error swallowing, or patterns that will cause bugs in production. Be specific: which PR, what the pattern is, what to do instead.

## 🟡 Convention Drift (should fix)
List patterns inconsistent with good practice or that suggest the Copilot instructions aren't being followed. Be specific.

## 🟢 Good Patterns (reinforce)
Call out 1-2 things the team did well this week. Specific examples only.

## 📋 Recommended Actions
List 2-3 concrete actions: update copilot-instructions.md, add a lint rule, schedule a team discussion, etc.

Keep the whole report under 600 words. Be direct and specific — vague praise or vague criticism are both useless.`;

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

const week = new Date().toISOString().split('T')[0];
const output = `# Weekly AI Code Review — ${week}\n\n_Auto-generated. Covers ${diffs.length} merged PRs._\n\n${reviewText}`;
writeFileSync('review_output.md', output);
console.log('Review written to review_output.md');
