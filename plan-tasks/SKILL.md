---
name: plan-tasks
description: Generate a detailed Knowledge Base TASKS.md implementation checklist from the active Knowledge Base SPEC.md with step-by-step tasks, milestones, and reference tables. Use this skill after completing spec-generation to create the actionable task list for implementation.
---

Read the active Knowledge Base `SPEC.md` and generate a `TASKS.md` implementation checklist next to it.

Determine the active effort folder first:

1. Determine the project name: `basename $(git rev-parse --show-toplevel)`
2. Determine the current version from the branch name.
   - If the branch contains a semantic version token with an optional leading `v`, use that version without the leading `v`.
   - Otherwise, ask the user which version folder to use.
3. Read:
   `/srv/homelab/docker/syncthing/data/obsidian-vault/Knowledge Base/<project-name>/<version>/SPEC.md`
4. Write:
   `/srv/homelab/docker/syncthing/data/obsidian-vault/Knowledge Base/<project-name>/<version>/TASKS.md`

Do not read or write root-level `SPEC.md` or `TASKS.md` unless the user explicitly asks for temporary working copies.

Before writing, read these sections of the spec if they exist:
- **Current Behavior Analysis** — what's broken today, why, and how the new design fixes it (only present for fix/replace efforts)
- **Acceptance Criteria** — what must be provably true when each slice is done
- **Test Scenarios** — the behavioral tests to write, grouped by unit/integration/regression
- **Risks / Regression Concerns** — what could break; prioritize regression coverage here
- **Notes for Task Generation** — recommended slicing, seams, and verification scope

Structure the tasks into logical implementation steps (Step 0, Step 1, etc.), where each step is a meaningful milestone. Within each step, create lettered sub-sections (0A, 0B, etc.) grouping related tasks.

Within a step, order tasks to make dependencies obvious. Example:

- Task 1: `[ ]` foundation task
- Task 2: `[ ] [P]` parallel task
- Task 3: `[ ] [P]` parallel task
- Task 4: `[ ]` integration/follow-up task

In that example, Tasks 2 and 3 may proceed in parallel after Task 1 is complete, and Task 4 should wait until both parallel tasks are done.

**Task format — every task must include:**

```
- [ ] Short description of what to implement
  - Tests: <behavioral test(s) to add/update — unit, integration, or regression>
  - Verify: `<command to run>`
  - Done when: <one-line completion condition that includes passing tests>
```

Parallelizable tasks should use this form instead:

```
- [ ] [P] Short description of what to implement
  - Tests: <behavioral test(s) to add/update — unit, integration, or regression>
  - Verify: `<command to run>`
  - Done when: <one-line completion condition that includes passing tests>
```

`[P]` means the task can be done in parallel with other `[P]` tasks in the same dependency window. A plain `[ ]` task is sequential and blocks later dependent work until it is complete.

For simple tasks where the implementation is self-evident and the test is trivial (e.g. "add a config field"), the Tests/Verify/Done block may be omitted. Use judgment — the bar is whether a test adds real confidence.

**Slicing rules:**
- If a slice has a pure logic seam (e.g. a domain function), add unit tests there before wiring it in
- If a slice touches an API endpoint or DB schema, add an integration test
- If the spec flags regression risk for a behavior, include a regression test in that task
- Prefer the smallest test that deterministically proves the requirement
- Avoid "write comprehensive tests" — be specific about what scenario is being proven
- Mark a task with `[P]` only when it can truly be implemented in parallel with sibling tasks without depending on their unfinished code or causing overlapping ownership ambiguity
- Use plain `[ ]` for tasks that establish shared foundations, unblock later work, or must happen after prior tasks are complete

**Other format requirements:**
- Each step has a **Milestone** line at the end describing what works when the step is complete
- Include a "Reference: New Files Checklist" table and a "Reference: Modified Files" table at the end
- Include a "Key Technical Notes" section for gotchas and architectural decisions

Before writing, check if there is existing completed work in Knowledge Base version folders for the project (e.g. `Knowledge Base/<project-name>/0.1.0/`, `Knowledge Base/<project-name>/0.2.0/`) and note it at the top of the file so the reader knows what's already done.

Write the result to `TASKS.md` in the same Knowledge Base effort folder as the active `SPEC.md`.

**Branching:** After generating `TASKS.md`, create a new git branch named after the overall effort in kebab-case (e.g. `feature/v0.4.0-quality-of-life` or `feature/multi-user-support`). Do not include step numbers in branch names — branches represent deployable efforts, not individual steps. The `/step-task` skill will implement on this branch using the Knowledge Base `TASKS.md`.
