---
name: implement-tasks
description: Implement all remaining steps from the active Knowledge Base TASKS.md sequentially by running step-task repeatedly until no incomplete steps remain. Commits after each step with no pauses between them. Use step-task instead if you want to stop and review after each step.
---

This skill runs step-task repeatedly until all steps in the active Knowledge Base `TASKS.md` are complete.

Follow the full step-task process for each incomplete step — Knowledge Base context loading, branch verification, parallel task handling, implementation, tests, verification, Knowledge Base checklist check-off, and commit — then immediately continue to the next incomplete step without pausing.

Stop when all steps are complete, then automatically run `/review-changes` to review all implementation changes. New bugs, regressions, or issues may surface during review that should be addressed before the effort is considered done. After the review is clean, remind the user to run `/finalize-effort` to archive docs and open the pull request.
