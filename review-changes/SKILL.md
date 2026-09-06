---
name: review-changes
description: Review code changes with a findings-first workflow. Use when the user asks to review a PR, review the current branch against its base, review a patch or diff, wants a code-review pass before merging, or after completing all implementation tasks (implement-tasks). By default, run 3 independent review sub-agents on the current branch diff unless the user specifies a different PR or review basis. Verify agent findings against the code, consolidate them into one report, and propose fixes after the review while waiting for explicit user confirmation before changing code.
---

# Review Changes

Review code changes and report bugs, regressions, risky assumptions, and missing tests.

## Default behavior

- Review the PR or diff represented by the current branch unless the user explicitly names a different PR, branch, or base.
- Run 3 independent review sub-agents by default.
- Verify every accepted finding yourself against the current workspace before presenting it.
- After presenting findings, propose a fix plan.
- Wait for explicit user confirmation before changing code.
- If the user accepts the proposed fixes, append them to `SPEC.md` and `TASKS.md` under a clearly labeled review addendum before implementing them.
- Fix directly in the main thread after confirmation unless the user explicitly asks for parallel fix agents.

## Workflow

### 1. Establish the exact review basis

- Prefer the exact current branch head when the user says to review the PR for the branch you are on.
- If the user names a specific PR number and fetching that exact ref is appropriate, use it.
- Record the current head commit, merge base, and diff range before reviewing.
- If the exact PR ref is unavailable, review a local diff such as `origin/<base>...HEAD` and state that assumption explicitly.
- Use `git diff --name-only`, `git diff --stat`, and targeted file reads. Do not review from memory or only from summaries.
- For large diffs, establish the full basis with `--name-only` and `--stat`, then use a focused manual diff that excludes generated, binary, and lockfile noise. Do not ignore excluded files entirely: review them separately for consistency with manifest/config changes.

### 2. Run 3 independent review sub-agents

- Spawn 3 independent review agents by default.
- Give each agent the same exact review basis.
- Ask each agent for findings only, ordered by severity, with concrete file and line references.
- Keep the prompts slightly different when useful, for example one general pass, one backend/API-focused pass, and one frontend/client-contract pass.
- Do not present raw agent output as the final review.

### 3. Verify agent outputs yourself

- Manually inspect every cited file and line in the current workspace before accepting a finding.
- Discard stale, incorrect, or already-fixed findings.
- Deduplicate overlapping findings across agents.
- Call out disagreements only if they materially affect the recommendation.
- If the user asks for fixes later, review the implemented fixes yourself before presenting them as resolved.

### 4. Present the review

- Put findings first, ordered by severity.
- Include concrete file and line references plus the practical consequence of each issue.
- Keep summaries brief.
- After findings, state assumptions about review basis and any residual risks or testing gaps.
- If no findings remain after verification, say so explicitly and mention the highest remaining risk areas.

### 5. Propose fixes, then wait

- After the review, propose the most sensible fix order and scope.
- Do not start editing code until the user explicitly asks to proceed.
- After confirmation, first capture the accepted fixes in `SPEC.md` and `TASKS.md`, then fix the issues directly unless the user explicitly asks for multiple fix agents or parallel implementation.

### 6. Capture accepted fixes in planning docs

- If the user explicitly approves the proposed fixes, append them to `SPEC.md` and `TASKS.md` before making code changes so the work is captured in the repo plan.
- Use the same concrete heading in both docs: `Review Follow-Up Addendum — <YYYY-MM-DD> (<review basis>)`.
- In `SPEC.md`, rewrite each accepted finding as a behavior requirement, constraint, or regression guard. Do not write it as a review transcript or diff summary.
- In `TASKS.md`, add matching actionable checklist items and verification tasks for each accepted fix, including regression coverage where appropriate.
- Make it explicit in both addenda that they were appended from accepted review findings for that review basis.
- If one or both files do not exist, say so briefly and continue with the fix work.

## Useful Commands

Establish a local review basis:

```bash
git branch --show-current
git rev-parse --short HEAD
git merge-base origin/main HEAD
git diff --name-only origin/main...HEAD
git diff --stat origin/main...HEAD
```

Fetch an exact GitHub PR ref when needed and approved:

```bash
git fetch origin pull/<pr-number>/head:pr-<pr-number>-review
git rev-parse --short pr-<pr-number>-review
git diff --name-only origin/main...pr-<pr-number>-review
```

Inspect targeted context:

```bash
rg -n "pattern" <paths>
sed -n '<start>,<end>p' <path>
nl -ba <path> | sed -n '<start>,<end>p'
```

Use a focused manual diff for large changes after recording the full basis:

```bash
git diff origin/main...HEAD -- . \
  ':(exclude,glob)**/*-lock.yaml' \
  ':(exclude,glob)**/*.png' \
  ':(exclude,glob)**/*.jpg' \
  ':(exclude,glob)**/*.jpeg' \
  ':(exclude,glob)**/*.webp' \
  ':(exclude,glob)**/*.ttf' \
  ':(exclude,glob)**/*.otf' \
  ':(exclude,glob)**/dist/**'
```

Sanity-check excluded files separately instead of loading them into the main context:

```bash
git diff --name-only origin/main...HEAD -- ':(glob)**/*-lock.yaml'
git diff --stat origin/main...HEAD -- ':(glob)**/*-lock.yaml'
```

Default manual-diff exclusions: lockfiles, binary assets, font files, and generated `dist/` output. Do not exclude manifests or build/native config files such as `package.json`, `app.config.*`, `eas.json`, `metro.config.*`, or native project config; those often explain lockfile and build behavior.

## Review Checklist

- Auth, visibility, or ownership regressions
- Partial-commit paths across DB, filesystem, and runtime state
- Backend, shared-types, SDK, and UI contract mismatches
- Provider and API-version compatibility issues
- Migration, reset, or data-loss hazards
- Frontend gesture, async state, and edge-case regressions
- Missing regression tests for newly introduced behavior

## Output Shape

Use this structure unless the user asks for something else:

1. Findings
2. Assumptions or review basis
3. Residual risks or testing gaps
4. Proposed fixes
