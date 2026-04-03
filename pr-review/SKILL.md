---
name: pr-review
description: Perform pull request and branch diff reviews with a findings-first workflow. Use when the user asks to review a PR, review the current branch against its base, review a patch or diff, or wants a code-review pass before merging. By default, run 3 independent review passes on the current branch diff unless the user specifies a different PR or review basis. Verify agent findings against the code, consolidate them into one report, and propose fixes after the review while waiting for explicit user confirmation before changing code.
---

# PR Review

Review code changes and report bugs, regressions, risky assumptions, and missing tests.

## Default behavior

- Review the PR or diff represented by the current branch unless the user explicitly names a different PR, branch, or base.
- Run 3 independent review passes by default.
- Verify every accepted finding yourself against the current workspace before presenting it.
- After presenting findings, propose a fix plan.
- Wait for explicit user confirmation before changing code.
- Fix directly in the main thread after confirmation unless the user explicitly asks for parallel fix agents.

## Workflow

### 1. Establish the exact review basis

- Prefer the exact current branch head when the user says to review the PR for the branch you are on.
- If the user names a specific PR number and fetching that exact ref is appropriate, use it.
- Record the current head commit, merge base, and diff range before reviewing.
- If the exact PR ref is unavailable, review a local diff such as `origin/<base>...HEAD` and state that assumption explicitly.
- Use `git diff --name-only`, `git diff --stat`, and targeted file reads. Do not review from memory or only from summaries.

### 2. Run 3 independent review passes

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
- After confirmation, fix the issues directly unless the user explicitly asks for multiple fix agents or parallel implementation.

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
