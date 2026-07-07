// Synchronizes the AI-SDLC label taxonomy into a target GitHub repository.
// Idempotent: creates missing labels, updates color/description of existing ones.
// Requires env: GH_TOKEN, GITHUB_REPOSITORY.

import { execSync } from 'node:child_process';

const repo = process.env.GITHUB_REPOSITORY;
if (!repo) {
  console.error('Error: GITHUB_REPOSITORY env var is required (owner/repo)');
  process.exit(1);
}

/** @type {Array<{name: string, color: string, description: string}>} */
const LABELS = [
  // AI-SDLC workflow labels
  { name: 'ai-triaged',          color: '0052cc', description: 'Issue classified by the AI triage workflow' },
  { name: 'ai-reviewed',         color: '0075ca', description: 'PR has received an AI pre-screen review' },
  { name: 'ci-passed',           color: '0e8a16', description: 'CI run passed all checks' },
  { name: 'security-blocked',    color: 'ee0701', description: 'Blocked pending security review' },
  { name: 'needs-human-review',  color: 'e4e669', description: 'High-risk change flagged for mandatory human review' },

  // Gate labels
  { name: 'gate-1-spec',         color: 'd4c5f9', description: 'Waiting for spec approval (Gate 1)' },
  { name: 'gate-5-deploy',       color: 'bfd4f2', description: 'Ready for production promotion (Gate 5)' },

  // Work type labels
  { name: 'feature',             color: 'a2eeef', description: 'New feature or enhancement' },
  { name: 'bug',                 color: 'd73a4a', description: "Something isn't working" },
  { name: 'question',            color: 'd876e3', description: 'Further information is requested' },
  { name: 'refactor',            color: 'fef2c0', description: 'Code change with no behaviour change' },
  { name: 'docs',                color: '0052cc', description: 'Documentation only' },
  { name: 'chore',               color: 'e4e669', description: 'Dependency bumps, config changes' },
  { name: 'security',            color: 'ee0701', description: 'Security vulnerability or hardening' },
  { name: 'tech-debt',           color: 'c5def5', description: 'Identified technical debt' },
  { name: 'needs-triage',        color: 'ededed', description: 'Newly opened, awaiting triage' },

  // Priority labels
  { name: 'P1-critical',         color: 'b60205', description: 'Drop everything' },
  { name: 'P2-high',             color: 'e4312b', description: 'Next sprint' },
  { name: 'P3-normal',           color: 'fbca04', description: 'Backlog' },
  { name: 'P4-low',              color: 'c2e0c6', description: 'Nice to have' },

  // Status labels
  { name: 'needs-spec-review',   color: 'ededed', description: 'Spec not yet approved by tech lead' },
  { name: 'blocked',             color: 'b60205', description: 'Blocked by another issue or external dep' },
  { name: 'wont-fix',            color: 'ffffff', description: 'Intentionally not addressing' },
  { name: 'duplicate',           color: 'cfd3d7', description: 'Duplicate of an existing issue' },
  { name: 'in-progress',         color: 'fbca04', description: 'Actively being worked on' },

  // Automation labels
  { name: 'automated',           color: 'e4e669', description: 'Created or modified by an automated workflow' },
  { name: 'code-review',         color: '0075ca', description: 'Weekly AI code review activity' },
];

function run(cmd) {
  try {
    return execSync(cmd, { env: process.env, stdio: ['ignore', 'pipe', 'pipe'] }).toString().trim();
  } catch (err) {
    return err.stderr?.toString().trim() ?? '';
  }
}

let created = 0;
let updated = 0;
let failed = 0;

for (const label of LABELS) {
  // Try to create first
  const createResult = run(
    `gh label create "${label.name}" --color "${label.color}" --description "${label.description}" --repo "${repo}"`,
  );

  if (createResult.includes('already exists')) {
    // Update color and description
    const editResult = run(
      `gh label edit "${label.name}" --color "${label.color}" --description "${label.description}" --repo "${repo}"`,
    );
    if (editResult.includes('error') || editResult.includes('Error')) {
      console.error(`❌ Failed to update: ${label.name} — ${editResult}`);
      failed++;
    } else {
      console.log(`🔄 Updated: ${label.name}`);
      updated++;
    }
  } else if (createResult.includes('error') || createResult.includes('Error')) {
    console.error(`❌ Failed to create: ${label.name} — ${createResult}`);
    failed++;
  } else {
    console.log(`✅ Created: ${label.name}`);
    created++;
  }
}

console.log(`\nDone. Created: ${created}, Updated: ${updated}, Failed: ${failed}`);
if (failed > 0) process.exit(1);
