---
name: generate-state
description: Generate or update the repository-wide docs/STATE.md snapshot including what was built, file structure, database schema, API surface, tech stack, and deviations from prior assumptions. Use this at the end of implementation or whenever an accurate current state summary is needed.
---

Read the current implementation docs and the actual repo layout, then generate or update the destination `STATE.md`.

Preferred input sources:
- if `SPEC.md`, `TASKS.md`, or `DISCOVERY.md` still exist at the repo root, read them there
- if they have already been archived under `docs/<version>/`, read the archived copies instead
- always read `CLAUDE.md`
- explore the actual project structure, database schema, and API routes before writing

The generated `STATE.md` must summarize:

1. What currently exists in the repository
2. What was added or changed by the latest version/effort
3. Current project structure, matching the real filesystem at generation time
4. Current database schema, based on the actual models/migrations
5. Current API surface, based on the actual routes
6. Architectural decisions that changed during implementation
7. Current tech stack and key dependencies from the repo

Default behavior:
- write to `docs/STATE.md`
- treat it as a living repository state document, not a per-version archive artifact
- fold in the latest version's deltas while removing stale assumptions
- mention archived version folders under `docs/<version>/` where relevant

If the destination is a versioned path like `docs/<version>/STATE.md`, only do that when the caller explicitly asks for a version-scoped snapshot.
