// Reads merged_prs.json, fetches each PR's diff via gh, writes pr_diffs.json.
// Requires env: GH_TOKEN, GITHUB_REPOSITORY.

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const prs = JSON.parse(readFileSync('merged_prs.json', 'utf8'));
const repo = process.env.GITHUB_REPOSITORY;
const diffs = [];

for (const pr of prs) {
  try {
    const diff = execSync(
      `gh pr diff ${pr.number} --repo "${repo}" --patch | head -200`,
      { env: process.env, stdio: ['ignore', 'pipe', 'ignore'] },
    ).toString();
    diffs.push({ pr: pr.number, title: pr.title, author: pr.author.login, diff });
  } catch {
    // PR diff unavailable (deleted branch, force-push, etc.), skip
  }
}

writeFileSync('pr_diffs.json', JSON.stringify(diffs, null, 2));
console.log(`Collected diffs for ${diffs.length} PRs`);
