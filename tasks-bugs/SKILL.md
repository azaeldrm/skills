---
name: tasks-bugs
description: Perform a thorough bug audit for the code written for the current effort, report findings back to the user, and append any newly confirmed bugs to BUGS.md without duplicating existing entries. Use this after implementation work, bug-fix passes, or whenever the user asks to audit the current effort.
---

Read `TASKS.md`, `BUGS.md`, the current git working tree, and the code/tests for the current effort.

Scope the review to the current effort:
- If the user names a specific effort, feature, or step, use that scope.
- Otherwise read `TASKS.md` and infer the effort from the first incomplete step, the most recently completed step, and the files currently changed in git.
- Always review the changed files, the code they touch, and the relevant tests.

Start with a dedicated review pass before editing anything. If the environment supports spawning a separate review agent, use one. Otherwise do a separate review-only pass yourself first.

Validate code, not claims. Do not trust comments, docs, task checkboxes, or `FIXED` labels unless the implementation and tests prove them.

Focus findings on:
- correctness bugs
- regressions
- security issues
- broken edge cases
- missing validation
- missing or misleading tests

Findings must be reported back to the user first, ordered by severity, with file references and a short explanation of why each issue is real.

After reporting, update `BUGS.md` in the current working directory.

`BUGS.md` should end this workflow in checklist format. If it still uses the older heading-based format, normalize the existing entries first:
- preserve categories, IDs, severity, details, and fixes
- convert fixed entries to `- [x]`
- convert open entries to `- [ ]`
- do not drop important detail just to shorten the file

Before adding a new bug, scan `BUGS.md` for the same root cause by route, symbol, file, and behavior. If it is already present, do not duplicate it. Otherwise assign the next sequential `BUG-0NN` ID and append it under the best matching category.

Use this format for open bugs:

```markdown
- [ ] BUG-0NN — Short title
  - Severity: Critical | High | Medium | Low
  - Where: `path/to/file.py` — endpoint, function, or symbol
  - Detail: Specific trigger, behavior, and impact.
  - Fix: Concrete remediation direction.
```

Use this format for fixed bugs:

```markdown
- [x] BUG-0NN — Short title
  - Fixed in: Step / effort / commit if known
  - Fix: What changed in code that closes it.
```

In the response, state whether `BUGS.md` was normalized, what new bugs were appended, and whether any existing entries were marked complete.

If no bugs are found, say that explicitly, mention residual risks or testing gaps, and still normalize `BUGS.md` if it is not yet in checklist format.
