---
name: step-task
description: Implement the next incomplete step from the active Knowledge Base TASKS.md completely, including all tests and verification, then commit. Stops after one step — the pause and review is implicit. Use implement-tasks to run all remaining steps without stopping.
---

**Load context first** — if you have not already read these files in this conversation, read them now before doing anything else:
- `docs/STATE.md` if it exists — current project state, schema, and API surface
- Active Knowledge Base `SPEC.md` — requirements and acceptance criteria for this effort
- Active Knowledge Base `TASKS.md` — the full checklist; use this to identify the first incomplete step

Determine the active effort folder first:

1. Determine the project name: `basename $(git rev-parse --show-toplevel)`
2. Determine the current version from the branch name.
   - If the branch contains a semantic version token with an optional leading `v`, use that version without the leading `v`.
   - Otherwise, ask the user which version folder to use.
3. Read:
   `/srv/homelab/docker/syncthing/data/obsidian-vault/Knowledge Base/<project-name>/<version>/SPEC.md`
4. Read and update:
   `/srv/homelab/docker/syncthing/data/obsidian-vault/Knowledge Base/<project-name>/<version>/TASKS.md`

Do not require root-level `SPEC.md` or `TASKS.md` unless the user explicitly asks for temporary working copies.

The first incomplete step is the first step that has any unchecked `- [ ]` tasks in the Knowledge Base `TASKS.md`.

**Parallel tasks:** Within a step, tasks marked `[P]` may be implemented in parallel with other `[P]` tasks in the same dependency window. Plain `[ ]` tasks are sequential — they either establish shared foundations that `[P]` tasks depend on, or must wait until prior work is complete. When you see a run of `[P]` tasks, implement them concurrently (e.g. via parallel subagents or interleaved work) before moving on to the next sequential task.

Then, for the first incomplete step:

1. **Verify branch:** Check the current git branch. It should be a feature branch for this effort (created by `/plan-tasks`). If not on the correct branch, create one named after the overall effort in kebab-case (e.g. `feature/v0.4.0-quality-of-life`), branching off `main` or current HEAD.
2. Implement every task in that step completely — backend, frontend, config changes, everything listed — including all tests specified in each task's `Tests:` field
3. Run each task's `Verify:` command and confirm it passes before marking the task done
4. Check off each task `[x]` in the Knowledge Base `TASKS.md` as it is completed
5. Commit all repo changes for this step with a descriptive commit message summarizing what was built; Knowledge Base checklist updates may be saved but are not necessarily committed if the vault is outside the repo

Do not move on to the next step. Stop after the first incomplete step is fully implemented, tested, and committed.
