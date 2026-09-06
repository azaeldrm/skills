---
name: generate-discovery
description: Capture architectural decisions, rejected alternatives, and knowledge discoveries from the conversation into DISCOVERY.md. Use this skill after significant implementation work or decision-making sessions to document the reasoning behind choices.
---

Determine the project name (base name of the git repo root) and current branch using:
- `basename $(git rev-parse --show-toplevel)`
- `git rev-parse --abbrev-ref HEAD`

Infer the version folder from the branch:

1. If the branch contains a semantic version token with an optional leading `v`, use that version without the leading `v`.
   - `feature/v0.4.0-backend-cleanup` → `0.4.0`
   - `release/0.5.0` → `0.5.0`
   - `bugfix/v1.2.3-reader-cache` → `1.2.3`
2. Otherwise, ask the user which version folder to use.

Then derive the target file path:
```
/srv/homelab/docker/syncthing/data/obsidian-vault/Knowledge Base/<project-name>/<version>/DISCOVERY.md
```

Create the directory if it does not exist:
```
mkdir -p "/srv/homelab/docker/syncthing/data/obsidian-vault/Knowledge Base/<project-name>/<version>"
```

Review our conversation — focusing on the most recent exchanges not yet captured in the file — and append a new dated section to that file. Create the file if it does not exist.

Each invocation appends a section with today's date as a header. Do not rewrite or remove existing content.

The appended section should capture:

1. **What was decided** — significant architectural or implementation choices made since the last entry. Be specific about trade-offs considered.

2. **Rejected alternatives** — what was considered and discarded, and why. This is the most valuable part: it prevents future contributors from re-litigating decisions already thought through.

3. **Knowledge discoveries** — things learned mid-effort that changed direction or deepened understanding. Questions asked, research done, conclusions reached. Capture these as concise analysis sections.

4. **Open questions / future considerations** — anything intentionally deferred, known limitations, or recommended follow-up that came up.

Before appending, read the existing file (if it exists) so you do not duplicate content already captured in a prior invocation.

Write in clear, direct prose. Use headers and tables where they aid clarity. Focus on the _why_, not the _what_. The audience is a future contributor trying to understand the reasoning behind the code.

Do not include a "files changed" section. Do not recap the task list. Do not summarize what each function does.
