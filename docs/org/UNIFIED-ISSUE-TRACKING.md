# Unified Issue Tracking Across Repos

Cross-cutting features (e.g. "add CSV export" — which touches backend, frontend,
and mobile) need a single place to see the whole thing. GitHub Projects on the
org gives us that. This doc is the convention everyone follows.

## The pattern

```
.github repo                  Project board
└── Issue #42 "[EPIC] CSV export"  ──┐
                                     │
project-backend                      │
└── Issue #87 "Add /export endpoint" │
                                     ├──► all on one
project-frontend                     │   GitHub Project
└── Issue #54 "Wire up export btn"   │   "Q3 Roadmap"
                                     │
project-mobile                       │
└── Issue #31 "Share-sheet export"   │
                                     ┘
```

- **One parent EPIC issue** in `lhuasheng/shared-sdlc` (it's the neutral home).
- **One sub-issue per repo** that needs work. Each links to the EPIC with
  `Part of lhuasheng/shared-sdlc#42`.
- **All four issues** added to the same GitHub Project (Settings → Projects).

## Why the EPIC lives in `.github`

- It's not owned by any one product repo.
- The repo is read by all engineers (they already watch it for org defaults).
- It survives if any project repo is later renamed, archived, or split.

## What goes in the EPIC

- One-paragraph "what we're delivering and why" (links to PRD if there is one)
- Acceptance criteria for the **whole feature** (cross-repo, user-facing)
- Sub-issue checklist:
  ```
  - [ ] lhuasheng/project-backend#87  — API endpoint
  - [ ] lhuasheng/project-frontend#54 — UI button + flow
  - [ ] lhuasheng/project-mobile#31   — Native share sheet
  ```
- Owner field set to the engineering manager (one throat to choke)

## What goes in each sub-issue

- Normal feature-request template (acceptance criteria, technical approach…)
- Link to EPIC: `Part of lhuasheng/shared-sdlc#42`
- No other cross-references — keep sub-issues focused on their repo.

## Closing the EPIC

The EPIC closes when **every sub-issue is closed AND the feature is live in
production**. A sub-issue being merged is not enough — Gate 5 (deploy + soak)
must be done before the EPIC closes.

## When NOT to use this

- Single-repo work — just open a normal issue in that repo.
- Tech-debt that touches one repo — same.
- One-off scripts, RFC discussions — use Discussions instead.

The EPIC pattern is for **shipped, user-facing features that span repos**.
That's it.
