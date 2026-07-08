// Onboards a project repository to the AI-SDLC framework.
// - Copies thin caller workflow templates to the target repo
// - Applies the label taxonomy
// - Enables branch protection
// - Opens an onboarding PR
//
// Requires env: GH_TOKEN, TARGET_REPO (owner/repo).
// Optional env: AGENTIC_REPO (default: lhuasheng/shared-agentic),
//               AGENTIC_REF (default: main),
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
const agenticRef = process.env.AGENTIC_REF || 'main';
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

function fetchRepoFile(repo, path, ref) {
  const encoded = gh(`api "repos/${repo}/contents/${path}?ref=${ref}" --jq '.content'`);
  return Buffer.from(encoded, 'base64').toString('utf8');
}

function localizeCallerWorkflow(content) {
  return content
    .replace(/lhuasheng\/shared-sdlc/g, sharedSdlcRepo)
    .replace(/secrets\.AGENTIC_DISPATCH_TOKEN/g, 'secrets.GITHUB_TOKEN')
    .replace(/agentic-workflow-repo:\s*lhuasheng\/shared-agentic/g, 'agentic-workflow-repo: ${{ github.repository }}')
    .replace(/workflow-repo:\s*lhuasheng\/shared-agentic/g, 'workflow-repo: ${{ github.repository }}');
}

console.log(`\n🚀 Onboarding ${targetRepo} to the AI-SDLC framework\n`);

// ── Step 1: Apply labels ───────────────────────────────────────────────────
console.log('📌 Step 1: Applying label taxonomy…');
process.env.GITHUB_REPOSITORY = targetRepo;

// Fetch and run apply-labels.mjs
const labelsScriptContent = fetchRepoFile(sharedSdlcRepo, 'scripts/apply-labels.mjs', sharedSdlcRef);
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

// issue-triage and weekly-digest need no callers: their vendored .lock.yml
// files trigger directly on issues:opened and cron respectively.
const templates = [
  { file: 'ci.yml', description: 'CI Gates' },
  { file: 'ai-pr-review.yml', description: 'AI PR Review' },
  { file: 'release.yml', description: 'Release Notes' },
];

for (const { file, description } of templates) {
  try {
    const decoded = fetchRepoFile(sharedSdlcRepo, `templates/${file}`, sharedSdlcRef);
    const customized = localizeCallerWorkflow(decoded);
    writeFileSync(join(workflowsDir, file), customized);
    console.log(`  ✅ ${description} (${file})`);
  } catch (err) {
    console.warn(`  ⚠️  Could not copy ${file}: ${err.message}`);
  }
}

// ── Step 4: Vendor agentic workflow sources and lock files locally ────────
console.log('\n📌 Step 4: Vendoring agentic workflow sources and lock files…');
const localAgenticWorkflowIds = [
  'pr-review',
  'weekly-digest',
  'issue-triage',
  'release-notes',
];

for (const id of localAgenticWorkflowIds) {
  try {
    const sourceContent = fetchRepoFile(agenticRepo, `.github/workflows/${id}.md`, agenticRef);
    writeFileSync(join(workflowsDir, `${id}.md`), sourceContent);

    const lockContent = fetchRepoFile(agenticRepo, `.github/workflows/${id}.lock.yml`, agenticRef);
    writeFileSync(join(workflowsDir, `${id}.lock.yml`), lockContent);

    console.log(`  ✅ ${id}.md + ${id}.lock.yml`);
  } catch (err) {
    console.warn(`  ⚠️  Could not vendor ${id}: ${err.message}`);
  }
}

// gh-aw support files: maintenance workflow (cleans expiring safe-outputs),
// pinned actions manifest (for reproducible recompiles), and the
// .gitattributes marking lock files as generated.
const supportFiles = [
  { src: '.github/workflows/agentics-maintenance.yml', dest: join(workflowsDir, 'agentics-maintenance.yml') },
  { src: '.github/aw/actions-lock.json', dest: join(tmpDir, '.github', 'aw', 'actions-lock.json') },
  { src: '.gitattributes', dest: join(tmpDir, '.gitattributes') },
];
mkdirSync(join(tmpDir, '.github', 'aw'), { recursive: true });
for (const { src, dest } of supportFiles) {
  try {
    writeFileSync(dest, fetchRepoFile(agenticRepo, src, agenticRef));
    console.log(`  ✅ ${src}`);
  } catch (err) {
    console.warn(`  ⚠️  Could not vendor ${src}: ${err.message}`);
  }
}

// ── Step 5: Commit and push ────────────────────────────────────────────────
console.log('\n📌 Step 5: Committing and pushing…');
execSync(`git -C "${tmpDir}" add .github/ .gitattributes`, { stdio: 'inherit' });
execSync(
  `git -C "${tmpDir}" commit -m "feat: onboard to AI-SDLC framework" --author "AI-SDLC Bot <ai-sdlc@users.noreply.github.com>"`,
  { stdio: 'inherit' },
);
execSync(`git -C "${tmpDir}" push origin "${branch}"`, { env: process.env, stdio: 'inherit' });

// ── Step 6: Open onboarding PR ─────────────────────────────────────────────
console.log('\n📌 Step 6: Opening onboarding PR…');
const prBody = `## AI-SDLC Framework Onboarding

This PR adds the AI-SDLC framework thin caller workflows to this repository.

### Workflows added

| Workflow | File | Description |
|---|---|---|
| CI Gates | \`.github/workflows/ci.yml\` | Lint, test, PR size, security, spec link |
| AI PR Review | \`.github/workflows/ai-pr-review.yml\` | /ai-review command → agentic review |
| Release Notes | \`.github/workflows/release.yml\` | Draft release notes on semver tag |

Issue triage and the weekly digest have no caller workflows — their vendored
\`.lock.yml\` files below trigger directly on \`issues: opened\` and the
Monday 09:00 UTC cron.

### Agentic workflow sources and lock files vendored locally

- \`.github/workflows/pr-review.md\`
- \`.github/workflows/weekly-digest.md\`
- \`.github/workflows/issue-triage.md\`
- \`.github/workflows/release-notes.md\`

- \`.github/workflows/pr-review.lock.yml\`
- \`.github/workflows/weekly-digest.lock.yml\`
- \`.github/workflows/issue-triage.lock.yml\`
- \`.github/workflows/release-notes.lock.yml\`

These are sourced from \`${agenticRepo}\` and run in this repository context.
No cross-repo dispatch token is required for these flows.

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
