---
name: tasks-start
description: Implement the first incomplete step from TASKS.md completely, including all backend/frontend/config changes, then commit with a descriptive message. Use this skill to begin or continue step-by-step implementation after tasks-create has generated the checklist.
---

Read TASKS.md and identify the first incomplete step (the first step that has any unchecked `- [ ]` tasks).

Then:
1. **Verify branch:** Check the current git branch. It should be a feature branch for this effort (created by `/tasks-create`). If not on the correct branch, create one named after the overall effort in kebab-case (e.g. `feature/v0.4.0-quality-of-life`), branching off `main` or current HEAD.
2. Implement every task in that step completely — backend, frontend, config changes, everything listed
3. Check off each task `[x]` in TASKS.md as it is completed
4. At the end, commit all changes with a descriptive commit message summarizing what was built

Do not move on to the next step. Stop after the first incomplete step is fully implemented and committed.
