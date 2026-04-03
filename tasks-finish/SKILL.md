---
name: tasks-finish
description: Wrap up implementation by updating docs, archiving versioned files under docs/<version>/, updating the repository-wide docs/STATE.md with the latest version deltas, and creating a pull request. Use this skill when all implementation is complete and ready for merge.
---

You are wrapping up the current implementation effort and creating a pull request. Follow these steps in order:

## 1. Establish the true implementation delta from the branch point

Before updating any planning docs, determine the branch this branch diverged from and compute the diff from that merge-base to `HEAD`. Do not assume the base branch is `main`; use the actual branch point where possible (for example: the PR base branch, the tracked upstream branch, or the best common ancestor you can determine from git history). Read that diff and use it as the source of truth for what was actually implemented in this effort.

## 2. Check off any completed tasks not yet marked in TASKS.md

Review the true implemented delta from Step 1 and compare it against TASKS.md. For any tasks that are clearly complete in code but not yet checked off, mark them `[x]` in TASKS.md. If there was meaningful work done that isn't captured in TASKS.md at all (e.g. polish, fixes, or additions made during the session), add a new step at the end with `[x]` tasks describing what was built. Keep descriptions concise and accurate.

## 3. Update SPEC.md

Review the true implemented delta from Step 1 and update SPEC.md so it reflects what was actually built, not just the original intent. Remove or correct anything that no longer matches reality. Do not add aspirational content.

## 4. Update CLAUDE.md

Review CLAUDE.md against the current state of the codebase. Update only what changed:
- Tech stack
- Project structure
- Architecture decisions
- Gotchas
- External services

Keep it short and current.

## 5. Determine the new version number

Look at the existing `docs/` subdirectories (for example `docs/0.1.0/`, `docs/0.2.0/`) to find the latest archived version. Increment the minor version for the new archive folder.

## 6. Archive versioned docs to `docs/<new-version>/`

Create `docs/<new-version>/` if needed, then move versioned planning/history files there.

Move these files with `git mv` when they are tracked:
- `SPEC.md` → `docs/<new-version>/SPEC.md`
- `TASKS.md` → `docs/<new-version>/TASKS.md`
- `DISCOVERY.md` → `docs/<new-version>/DISCOVERY.md` if it exists at the repo root

For bugs:
- if `BUGS.md` is version-specific, move it to `docs/<new-version>/BUGS.md`
- if the repo keeps a live root `BUGS.md` for open issues, create or update `docs/<new-version>/BUGS.md` with the effort's archived bug history

`STATE.md` is **not** version-archived. Do not write `docs/<new-version>/STATE.md` unless the user explicitly asks for a one-off snapshot.

## 7. Update `docs/STATE.md`

Run the `generate-state` skill to update the repository-wide `docs/STATE.md`.

`docs/STATE.md` is a living state document for the repository. It should:
- describe the current repo as a whole
- include the new version's deltas and current behavior
- reflect the actual filesystem after any archive moves
- mention the latest archived version folder and its contents where relevant
- replace stale assumptions from prior versions instead of creating a separate per-version state file

## 8. Commit everything

Stage and commit all changes with a message in the form:

```text
chore: wrap up <effort name> — archive docs to docs/<new-version>/
```

## 9. Create the pull request

Push the branch if needed, then create or update the PR against the actual base branch identified in Step 1.

Prefer the GitHub REST API for both creation and updates. Avoid relying on `gh pr create` / `gh pr edit`.

If no PR exists yet, create it through the REST API:

```bash
gh api repos/{owner}/{repo}/pulls -X POST \
  -f title="..." \
  -f head="{branch}" \
  -f base="{base-branch}" \
  -f body="..."
```

If a PR already exists for this branch, update it through the REST API:

```bash
gh api repos/{owner}/{repo}/pulls/{number} -X PATCH -f body="..."
```

PR body structure:
- `## Summary` — 3–5 bullet points covering what was built
- `## Test plan` — bulleted checklist of manual verification
- footer: `🤖 Generated with [Claude Code](https://claude.com/claude-code)`
