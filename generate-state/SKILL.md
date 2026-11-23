---
name: generate-state
description: Generate or update the repository-wide docs/STATE.md snapshot including what was built, file structure, database schema, API surface, tech stack, and deviations from prior assumptions. Use this at the end of implementation or whenever an accurate current state summary is needed.
---

Read the current implementation docs and the actual repo layout, then generate or update the destination `STATE.md`.

Preferred input sources:
- if `SPEC.md`, `TASKS.md`, or `DISCOVERY.md` still exist at the repo root, read them there
- if they have already been archived under `docs/<version>/`, read the archived copies instead
- always read `CLAUDE.md` — read it to know what is **already documented**, so `STATE.md`
  does not restate it. Treat it as a boundary, not as content to copy forward.
- explore the actual project structure, database schema, and API routes before writing

The generated `STATE.md` must summarize:

1. What currently exists in the repository
2. What was added or changed by the latest version/effort
3. Current project structure, matching the real filesystem at generation time
4. Current database schema, based on the actual models/migrations
5. Current API surface, based on the actual routes
6. Current tech stack and key dependencies from the repo

## Version deltas are capped, not accumulated

The version-delta section is a **cache of the most recent work**, not a changelog.
Git history and the Knowledge Base version folders are the changelog, and both are
queryable on demand.

- Keep deltas for the **current effort and the one immediately preceding it**. Nothing older.
- On each run, **delete** any delta older than that window rather than appending below it.
  Replace the removed tail with a single pointer to
  `Knowledge Base/<project-name>/<version>/` and the commit history.
- Summarize, do not transcribe: a delta should compress its effort's `SPEC.md`/`STORY.md`/
  `TASKS.md` into conclusions — root cause, what was rejected and why, verification
  outcomes, and known gaps carried forward — and link to the version folder for detail.
- This section grows every effort unless something removes from it. Removing is part of
  the job, not an optional cleanup.

## Boundary with `CLAUDE.md`

`STATE.md` is **descriptive**: what exists right now, derivable by inspecting the repo.
`CLAUDE.md` is **normative**: standing rules, architecture decisions, conventions, and
gotchas that constrain how future work is done.

- Do **not** generate "Architecture Decisions" or "Gotchas" sections in `STATE.md`.
  Those belong in `CLAUDE.md`, which is loaded in every session.
- If implementation established a new standing rule or changed an existing decision,
  that belongs in `CLAUDE.md` (`/finalize-effort` owns that update) — not here.
  `STATE.md` records the *delta narrative* for the effort (item 2), not the rule.
- If a fact is already stated in `CLAUDE.md` or a nested `CLAUDE.md`, omit it. Where the
  two would overlap, `CLAUDE.md` is authoritative.
- When updating an existing `STATE.md`, remove any decision/gotcha content that earlier
  runs copied in from `CLAUDE.md`, keeping only entries `CLAUDE.md` does not cover.

Default behavior:
- write to `docs/STATE.md`
- treat it as a living repository state document, not a per-version archive artifact
- fold in the latest version's deltas while removing stale assumptions
- mention archived version folders under `docs/<version>/` where relevant

If the destination is a versioned path like `docs/<version>/STATE.md`, only do that when the caller explicitly asks for a version-scoped snapshot.
