// Collects repository metrics and writes metrics.json conforming to
// schemas/metrics.schema.json.
// Requires env: GH_TOKEN, GITHUB_REPOSITORY.
// Optional env: OUTPUT_FILE, LOOKBACK_DAYS.

import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const repo = process.env.GITHUB_REPOSITORY;
const outputFile = process.env.OUTPUT_FILE || 'metrics.json';
const lookbackDays = parseInt(process.env.LOOKBACK_DAYS || '30', 10);
const since = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000).toISOString();

function gh(args) {
  try {
    return JSON.parse(
      execSync(`gh ${args}`, { env: process.env, stdio: ['ignore', 'pipe', 'pipe'] }).toString(),
    );
  } catch {
    return null;
  }
}

function ghRaw(args) {
  try {
    return execSync(`gh ${args}`, { env: process.env, stdio: ['ignore', 'pipe', 'pipe'] })
      .toString()
      .trim();
  } catch {
    return '';
  }
}

console.log(`Collecting metrics for ${repo} (last ${lookbackDays} days)…`);

// Open issues
const openIssues = gh(`issue list --repo "${repo}" --state open --json number --jq 'length'`) ?? 0;

// Merged PRs in window
const mergedPrs =
  gh(
    `pr list --repo "${repo}" --state merged --json number,mergedAt ` +
      `--jq '[.[] | select(.mergedAt > "${since}")] | length'`,
  ) ?? 0;

// Open PRs
const openPrs = gh(`pr list --repo "${repo}" --state open --json number --jq 'length'`) ?? 0;

// Commits in window — paginate all commits and sum counts per page
const commitCount = parseInt(
  ghRaw(
    `api "repos/${repo}/commits?since=${since}&per_page=100" --paginate --jq 'length' | awk '{sum += $1} END {print sum+0}'`,
  ) || '0',
  10,
);

// Contributors in window — unique commit author emails via paginated commit list
const contributorsRaw = ghRaw(
  `api "repos/${repo}/commits?since=${since}&per_page=100" --paginate --jq '.[].commit.author.email' | sort -u | wc -l | tr -d ' '`,
);
const contributors = parseInt(contributorsRaw || '0', 10);

// Workflow run success rate (last 100 runs)
const workflowRuns = gh(
  `api "repos/${repo}/actions/runs?per_page=100" --jq '[.workflow_runs[] | .conclusion] | {total: length, success: map(select(. == "success")) | length}'`,
) ?? { total: 0, success: 0 };
const successRate =
  workflowRuns.total > 0
    ? Math.round((workflowRuns.success / workflowRuns.total) * 100)
    : null;

const metrics = {
  collectedAt: new Date().toISOString(),
  repository: repo,
  lookbackDays,
  openIssues,
  mergedPrs,
  openPrs,
  commitCount,
  contributors,
  ciSuccessRatePct: successRate,
};

writeFileSync(outputFile, JSON.stringify(metrics, null, 2));
console.log(`Metrics written to ${outputFile}`);
console.log(JSON.stringify(metrics, null, 2));
