---
name: tasks-step
description: Implement the next incomplete step from TASKS.md completely, including all tests and verification, then commit. Stops after one step — the pause and review is implicit. Use tasks-run to run all remaining steps without stopping.
---

**Load context first** — if you have not already read these files in this conversation, read them now before doing anything else:
- `docs/STATE.md` — current project state, schema, and API surface
- `SPEC.md` — requirements and acceptance criteria for this effort
- `TASKS.md` — the full checklist; use this to identify the first incomplete step

The first incomplete step is the first step that has any unchecked `- [ ]` tasks.

**Parallel tasks:** Within a step, tasks marked `[P]` may be implemented in parallel with other `[P]` tasks in the same dependency window. Plain `[ ]` tasks are sequential — they either establish shared foundations that `[P]` tasks depend on, or must wait until prior work is complete. When you see a run of `[P]` tasks, implement them concurrently (e.g. via parallel subagents or interleaved work) before moving on to the next sequential task.

Then, for the first incomplete step:

1. **Verify branch:** Check the current git branch. It should be a feature branch for this effort (created by `/tasks-create`). If not on the correct branch, create one named after the overall effort in kebab-case (e.g. `feature/v0.4.0-quality-of-life`), branching off `main` or current HEAD.
2. Implement every task in that step completely — backend, frontend, config changes, everything listed — including all tests specified in each task's `Tests:` field
3. Run each task's `Verify:` command and confirm it passes before marking the task done
4. Check off each task `[x]` in TASKS.md as it is completed
5. Commit all changes for this step with a descriptive commit message summarizing what was built

Do not move on to the next step. Stop after the first incomplete step is fully implemented, tested, and committed.
