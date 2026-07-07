// Reads merged_prs.json (or INPUT_FILE env), fetches each PR's diff via gh,
// writes diffs.json (or OUTPUT_FILE env) conforming to schemas/diffs.schema.json.
// Also writes pr_diffs.json for backward compatibility with weekly-review action.
// Requires env: GH_TOKEN, GITHUB_REPOSITORY.
// Optional env: INPUT_FILE, OUTPUT_FILE, MAX_DIFF_LINES.

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const inputFile = process.env.INPUT_FILE || 'merged_prs.json';
const outputFile = process.env.OUTPUT_FILE || 'diffs.json';
const maxLines = parseInt(process.env.MAX_DIFF_LINES || '200', 10);

const prs = JSON.parse(readFileSync(inputFile, 'utf8'));
const repo = process.env.GITHUB_REPOSITORY;
const diffs = [];

for (const pr of prs) {
  try {
    const diff = execSync(
      `gh pr diff ${pr.number} --repo "${repo}" --patch | head -${maxLines}`,
      { env: process.env, stdio: ['ignore', 'pipe', 'ignore'] },
    ).toString();
    diffs.push({
      pr: pr.number,
      title: pr.title,
      author: pr.author?.login ?? pr.author,
      mergedAt: pr.mergedAt ?? null,
      diff,
    });
  } catch {
    // PR diff unavailable (deleted branch, force-push, etc.), skip
  }
}

writeFileSync(outputFile, JSON.stringify(diffs, null, 2));
// Backward-compat alias used by weekly-review action
if (outputFile !== 'pr_diffs.json') {
  writeFileSync('pr_diffs.json', JSON.stringify(diffs, null, 2));
}
console.log(`Collected diffs for ${diffs.length} PRs → ${outputFile}`);
