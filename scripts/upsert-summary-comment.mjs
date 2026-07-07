// Creates or updates the consolidated AI-SDLC summary comment on a pull request.
// Uses the <!-- ai-sdlc-summary --> marker to locate an existing comment.
// Requires env: GH_TOKEN, GITHUB_REPOSITORY, PR_NUMBER, SECTION_NAME.
// Provide section content via SECTION_BODY (string) or SECTION_BODY_FILE (path).

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';

const repo = process.env.GITHUB_REPOSITORY;
const prNumber = process.env.PR_NUMBER;
const sectionName = process.env.SECTION_NAME;
const sectionBodyFile = process.env.SECTION_BODY_FILE;
const sectionBodyEnv = process.env.SECTION_BODY;

if (!repo || !prNumber || !sectionName) {
  console.error('Error: GITHUB_REPOSITORY, PR_NUMBER, and SECTION_NAME are required');
  process.exit(1);
}

const sectionBody = sectionBodyFile
  ? readFileSync(sectionBodyFile, 'utf8').trim()
  : (sectionBodyEnv ?? '').trim();

if (!sectionBody) {
  console.error('Error: provide section content via SECTION_BODY or SECTION_BODY_FILE');
  process.exit(1);
}

const MARKER = '<!-- ai-sdlc-summary -->';
const SECTION_START = `<!-- section:${sectionName} -->`;
const SECTION_END = `<!-- /section:${sectionName} -->`;

function gh(args) {
  return execSync(`gh ${args}`, { env: process.env, stdio: ['ignore', 'pipe', 'pipe'] })
    .toString()
    .trim();
}

// Fetch all issue comments on the PR
const comments = JSON.parse(
  gh(`api "repos/${repo}/issues/${prNumber}/comments" --jq '[.[] | {id, body}]'`),
);

const existing = comments.find((c) => c.body.startsWith(MARKER));

let fullBody;

if (existing) {
  // Replace or append the target section in the existing comment
  const body = existing.body;
  const sectionRegex = new RegExp(
    `${escapeRegex(SECTION_START)}[\\s\\S]*?${escapeRegex(SECTION_END)}`,
    'g',
  );

  const newSection = `${SECTION_START}\n${sectionBody}\n${SECTION_END}`;

  if (sectionRegex.test(body)) {
    fullBody = body.replace(sectionRegex, newSection);
  } else {
    // Append before the footer
    const footerRegex = /\n---\n_Last updated:.*$/s;
    if (footerRegex.test(body)) {
      fullBody = body.replace(footerRegex, `\n\n${newSection}$&`);
    } else {
      fullBody = `${body}\n\n${newSection}`;
    }
  }

  // Update timestamp in footer
  const timestamp = new Date().toISOString();
  const footerLine = `\n---\n_Last updated: ${timestamp} — [AI-SDLC](https://github.com/lhuasheng/shared-sdlc)_`;
  const footerRegex = /\n---\n_Last updated:.*$/s;
  fullBody = footerRegex.test(fullBody)
    ? fullBody.replace(footerRegex, footerLine)
    : `${fullBody}${footerLine}`;
} else {
  // Create a brand-new consolidated comment
  const timestamp = new Date().toISOString();
  fullBody = [
    MARKER,
    '## 🤖 AI-SDLC Summary',
    '',
    `${SECTION_START}`,
    sectionBody,
    `${SECTION_END}`,
    '',
    `---`,
    `_Last updated: ${timestamp} — [AI-SDLC](https://github.com/lhuasheng/shared-sdlc)_`,
  ].join('\n');
}

// Write to a temp file to avoid shell escaping issues
const tmpFile = '/tmp/ai-sdlc-comment-body.md';
writeFileSync(tmpFile, fullBody);

if (existing) {
  gh(`api --method PATCH "repos/${repo}/issues/comments/${existing.id}" -f body=@${tmpFile}`);
  console.log(`✅ Updated AI-SDLC summary comment (ID ${existing.id}) on PR #${prNumber}`);
} else {
  gh(`api --method POST "repos/${repo}/issues/${prNumber}/comments" -f body=@${tmpFile}`);
  console.log(`✅ Created AI-SDLC summary comment on PR #${prNumber}`);
}

try { unlinkSync(tmpFile); } catch { /* ignore */ }

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
