---
name: tasks-create
description: Generate a detailed TASKS.md implementation checklist from SPEC.md with step-by-step tasks, milestones, and reference tables. Use this skill after completing spec-generation to create the actionable task list for implementation.
---

Read SPEC.md and generate a TASKS.md implementation checklist from it.

Before writing, read these sections of the spec if they exist:
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

Before writing, check if there is existing completed work in docs/ subdirectories (e.g. docs/0.1.0/, docs/0.2.0/) and note it at the top of the file so the reader knows what's already done.

Write the result to TASKS.md in the current working directory.

**Branching:** After generating TASKS.md, create a new git branch named after the overall effort in kebab-case (e.g. `feature/v0.4.0-quality-of-life` or `feature/multi-user-support`). Do not include step numbers in branch names — branches represent deployable efforts, not individual steps. The `/tasks-start` skill will implement on this branch.
