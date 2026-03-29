---
name: generate-discovery
description: Capture architectural decisions, rejected alternatives, and knowledge discoveries from the conversation into DISCOVERY.md. Use this skill after significant implementation work or decision-making sessions to document the reasoning behind choices.
---

Review our conversation — focusing on the most recent exchanges not yet captured in DISCOVERY.md — and append a new dated section to `DISCOVERY.md` in the project root. Create the file if it does not exist.

Each invocation appends a section with today's date as a header. Do not rewrite or remove existing content.

The appended section should capture:

1. **What was decided** — significant architectural or implementation choices made since the last entry. Be specific about trade-offs considered.

2. **Rejected alternatives** — what was considered and discarded, and why. This is the most valuable part: it prevents future contributors from re-litigating decisions already thought through.

3. **Knowledge discoveries** — things learned mid-effort that changed direction or deepened understanding. Questions asked, research done, conclusions reached. Capture these as concise analysis sections.

4. **Open questions / future considerations** — anything intentionally deferred, known limitations, or recommended follow-up that came up.

Before appending, read the existing DISCOVERY.md (if it exists) so you do not duplicate content already captured in a prior invocation.

Write in clear, direct prose. Use headers and tables where they aid clarity. Focus on the _why_, not the _what_. The audience is a future contributor trying to understand the reasoning behind the code.

Do not include a "files changed" section. Do not recap the task list. Do not summarize what each function does.
