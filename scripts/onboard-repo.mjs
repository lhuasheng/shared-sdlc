// Onboards a project repository to the AI-SDLC framework.
// - Copies thin caller workflow templates to the target repo
// - Applies the label taxonomy
// - Opens an onboarding PR
//
// Requires env: GH_TOKEN, TARGET_REPO (owner/repo).
// Optional env: AGENTIC_REPO (default: lhuasheng/shared-agentic),
//               SHARED_SDLC_REPO (default: lhuasheng/shared-sdlc),
//               SHARED_SDLC_REF (default: main).

import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const targetRepo = process.env.TARGET_REPO;
if (!targetRepo) {
  console.error('Error: TARGET_REPO env var is required (owner/repo)');
  process.exit(1);
}

const agenticRepo = process.env.AGENTIC_REPO || 'lhuasheng/shared-agentic';
const sharedSdlcRepo = process.env.SHARED_SDLC_REPO || 'lhuasheng/shared-sdlc';
const sharedSdlcRef = process.env.SHARED_SDLC_REF || 'main';
const branch = `onboarding/ai-sdlc-${Date.now()}`;

function gh(args) {
  return execSync(`gh ${args}`, { env: process.env, stdio: ['ignore', 'pipe', 'pipe'] })
    .toString()
    .trim();
}

function ghRaw(args) {
  execSync(`gh ${args}`, { env: process.env, stdio: 'inherit' });
}

console.log(`\n🚀 Onboarding ${targetRepo} to the AI-SDLC framework\n`);

// ── Step 1: Apply labels ───────────────────────────────────────────────────
console.log('📌 Step 1: Applying label taxonomy…');
process.env.GITHUB_REPOSITORY = targetRepo;

// Fetch and run apply-labels.mjs
const labelsScript = gh(
  `api "repos/${sharedSdlcRepo}/contents/scripts/apply-labels.mjs?ref=${sharedSdlcRef}" --jq '.content'`,
);
const labelsScriptContent = Buffer.from(labelsScript, 'base64').toString('utf8');
const tmpLabels = join(tmpdir(), 'apply-labels.mjs');
writeFileSync(tmpLabels, labelsScriptContent);
execSync(`node ${tmpLabels}`, { env: process.env, stdio: 'inherit' });
console.log('✅ Labels applied\n');

// ── Step 2: Clone target repo and create onboarding branch ────────────────
console.log('📌 Step 2: Preparing onboarding branch…');
const tmpDir = join(tmpdir(), `onboard-${Date.now()}`);
mkdirSync(tmpDir, { recursive: true });
execSync(`gh repo clone "${targetRepo}" "${tmpDir}"`, { env: process.env, stdio: 'inherit' });
execSync(`git -C "${tmpDir}" checkout -b "${branch}"`, { stdio: 'inherit' });

// ── Step 3: Copy workflow templates ───────────────────────────────────────
console.log('📌 Step 3: Copying workflow templates…');
const workflowsDir = join(tmpDir, '.github', 'workflows');
mkdirSync(workflowsDir, { recursive: true });

const templates = [
  { file: 'ci.yml', description: 'CI Gates' },
  { file: 'ai-pr-review.yml', description: 'AI PR Review' },
  { file: 'weekly-digest.yml', description: 'Weekly Digest' },
  { file: 'issue-triage.yml', description: 'Issue Triage' },
  { file: 'release.yml', description: 'Release Notes' },
];

for (const { file, description } of templates) {
  try {
    const content = gh(
      `api "repos/${sharedSdlcRepo}/contents/templates/${file}?ref=${sharedSdlcRef}" --jq '.content'`,
    );
    const decoded = Buffer.from(content, 'base64').toString('utf8');
    // Replace placeholder repo references
    const customized = decoded
      .replace(/lhuasheng\/shared-agentic/g, agenticRepo)
      .replace(/lhuasheng\/shared-sdlc/g, sharedSdlcRepo);
    writeFileSync(join(workflowsDir, file), customized);
    console.log(`  ✅ ${description} (${file})`);
  } catch (err) {
    console.warn(`  ⚠️  Could not copy ${file}: ${err.message}`);
  }
}

// ── Step 4: Commit and push ────────────────────────────────────────────────
console.log('\n📌 Step 4: Committing and pushing…');
execSync(`git -C "${tmpDir}" add .github/workflows/`, { stdio: 'inherit' });
execSync(
  `git -C "${tmpDir}" commit -m "feat: onboard to AI-SDLC framework" --author "AI-SDLC Bot <ai-sdlc@users.noreply.github.com>"`,
  { stdio: 'inherit' },
);
execSync(`git -C "${tmpDir}" push origin "${branch}"`, { env: process.env, stdio: 'inherit' });

// ── Step 5: Open onboarding PR ─────────────────────────────────────────────
console.log('\n📌 Step 5: Opening onboarding PR…');
const prBody = `## AI-SDLC Framework Onboarding

This PR adds the AI-SDLC framework thin caller workflows to this repository.

### Workflows added

| Workflow | File | Description |
|---|---|---|
| CI Gates | \`.github/workflows/ci.yml\` | Lint, test, PR size, security, spec link |
| AI PR Review | \`.github/workflows/ai-pr-review.yml\` | /ai-review command → agentic review |
| Weekly Digest | \`.github/workflows/weekly-digest.yml\` | Monday 09:00 UTC engineering digest |
| Issue Triage | \`.github/workflows/issue-triage.yml\` | Auto-classify new issues |
| Release Notes | \`.github/workflows/release.yml\` | Draft release notes on semver tag |

### Next steps

1. Review each workflow file and adjust inputs for your stack.
2. Ensure the Copilot coding agent is enabled in your organization settings.
3. Pin workflow references to a specific tag once stable (replace \`@main\` with \`@v1.0.0\`).
4. See the [AI-SDLC Playbook](https://github.com/${sharedSdlcRepo}/blob/main/docs/playbook.md) for full documentation.

---
_Opened by \`scripts/onboard-repo.mjs\` in [shared-sdlc](https://github.com/${sharedSdlcRepo})_`;

const prUrl = gh(
  `pr create --repo "${targetRepo}" --title "feat: onboard to AI-SDLC framework" --body "${prBody.replace(/"/g, '\\"')}" --base main --head "${branch}"`,
);

console.log(`\n✅ Onboarding complete!\n`);
console.log(`PR: ${prUrl}`);
console.log(`\nReview the PR, adjust inputs for your stack, then merge to activate the framework.`);
