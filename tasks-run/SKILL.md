---
name: tasks-run
description: Implement all remaining steps from TASKS.md sequentially by running tasks-step repeatedly until no incomplete steps remain. Commits after each step with no pauses between them. Use tasks-step instead if you want to stop and review after each step.
---

This skill runs tasks-step repeatedly until all steps in TASKS.md are complete.

Follow the full tasks-step process for each incomplete step — context loading, branch verification, parallel task handling, implementation, tests, verification, check-off, and commit — then immediately continue to the next incomplete step without pausing.

Stop when all steps are complete, then remind the user to run `/tasks-finish` to archive docs and open the pull request.
