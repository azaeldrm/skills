---
name: spec-effort
description: Generate a Knowledge Base SPEC.md for a new feature or application through interactive requirements gathering. Use this skill whenever the user wants to plan, design, or spec out a new feature — including when they say "let's plan", "let's spec", "write a spec", "new feature", "I want to build", or "let's design". This skill handles ONLY the spec — use the plan-tasks command afterward to generate TASKS.md from the finished spec in the same Knowledge Base effort folder. Also use when capturing future feature specs (lighter-weight, marked as not-yet-active).
---

# Effort Speccer

Generate a SPEC.md through interactive conversation. This skill produces **only the spec** — it does not generate TASKS.md or update CLAUDE.md. Those are handled by the existing `plan-tasks` and `finalize-effort` commands.

## Where This Fits in the Workflow

```
  ┌─────────────────┐
  │ spec-effort      │ ← YOU ARE HERE
  │ (this skill)     │
  └────────┬────────┘
           ▼
  /plan-tasks         → generates TASKS.md from SPEC.md
           ▼
  /step-task          → implements one step at a time
           ▼
  /generate-discovery → captures decisions and learnings
           ▼
  /finalize-effort    → archives docs, updates CLAUDE.md, creates PR
           ▼
  /generate-state     → generates STATE.md for next cycle
           ▼
  Back to spec-effort for the next feature
```

**Do not** generate TASKS.md, update CLAUDE.md, or create STATE.md. Those are separate commands in the pipeline.

## Process

### Step 1: Gather Context

**First, check for a Story document in the Obsidian vault:**

1. Determine the project name: `basename $(git rev-parse --show-toplevel)`
2. Determine the current version from the branch name.
   - If the branch contains a semantic version token with an optional leading `v`, use that version without the leading `v`.
   - Otherwise, ask the user which version folder to use.
3. Read: `/srv/homelab/docker/syncthing/data/obsidian-vault/Knowledge Base/<project-name>/<version>/STORY.md`
4. If a story file is found, use it as the primary context source — it contains all scope, technical, and copy decisions already made. Skip most Q&A and go straight to writing the spec, asking only for gaps the story doesn't cover.

**If no story file exists in the vault**, stop and tell the user: a Knowledge Base story or explicit specifications are required before a spec can be written. Direct them to run `/explore-effort` first, confirm the correct Knowledge Base version folder, or provide the requirements directly in the conversation.

**Verification artifacts:** prove load-bearing claims rather than assuming them — resolver probes, import graphs, bundle assertions. Write any script, snapshot, or log to the project's gitignored workspace (commonly `.local/`; check `.gitignore` and any workspace README), never to the Knowledge Base, which holds markdown planning documents only. Revert anything a probe mutates and leave `git status` clean. Cite the artifact path in the spec so later phases re-run the work instead of redoing it.

### Step 2: Ask Questions

Run an interactive requirements conversation. Ask questions in batches of 1-4 using the **`AskUserQuestion` tool** so the user can answer via the TUI selection interface. This is faster and clearer than free-text back-and-forth.

**How to use AskUserQuestion:**

- Group related questions into a single `AskUserQuestion` call (up to 4 questions per call).
- Provide 2-4 concrete options per question. Put the recommended option first with `(Recommended)` in the label.
- Use short, descriptive `header` values (max 12 chars) like `"Prefetch"`, `"Cache size"`, `"Scope"`.
- Use `description` on each option to explain trade-offs — this is where rationale lives.
- Use `preview` on options when showing ASCII wireframes, code snippets, or schema comparisons.
- Use `multiSelect: true` when choices aren't mutually exclusive (e.g., "Which features to include?").
- The user always has an implicit "Other" option to type a custom answer — don't add one manually.
- Between batches, briefly summarize what you learned and explain the next area of questions.
- Continue asking batches until you can write the full spec without guessing.

**What to cover:**

1. **Core experience** — What does the user see and do? Walk through the interaction step by step.
2. **Data** — What's created, stored, queried? What tables, what columns?
3. **Integration** — What services does this touch? What APIs? Look up real endpoints via web search.
4. **Scope** — What's day-1 vs future? What's explicitly out of scope?
5. **Technical choices** — When the user isn't sure, research options and recommend one with rationale.
6. **Edge cases** — Failure modes, constraints, concurrency issues.

**Rules:**

- When the user mentions a service (e.g., "I have Kokoro running"), search the web for its actual API documentation. Spec against real endpoints, not assumptions.
- When there are bounded choices (e.g., "which navigation pattern?"), describe the options concretely and let the user pick via TUI options.
- When the user says "I'm not sure," make a recommendation and explain why.
- Don't ask questions you can answer by reading the existing codebase.
- Stop asking when you can write the full spec without guessing.

### Step 3: Write SPEC.md

Generate the spec file with this structure:

```markdown
# {Project} — v{X} Spec: {Feature Name}

## 1. Feature Overview

What it does. Who it's for. The key experience in one paragraph.

## 2. Current Behavior Analysis

What's broken or insufficient today, why, and where. Each issue includes
the file/location, root cause, user-visible impact, and how the new design
addresses it. Only include when the effort fixes or replaces existing
behavior. Omit for greenfield features.

## 3. Architecture

Updated system diagram (ASCII). Tech stack table (new additions only).
New dependencies with rationale.

## 4. Data Model Changes

New tables: full schema (column, type, description).
Modified tables: what changes and why.
Unchanged tables: list them so the reader knows they were considered.

## 5. Processing Pipeline

Step-by-step flow. Pseudocode for non-obvious algorithms.
Sequence of operations with error handling notes.

## 6. API Design

New endpoints: method, path, description, request/response JSON.
Modified endpoints: what changes.
Auth/middleware changes if applicable.

## 7. Frontend Design

Views, components, states, interactions.
ASCII wireframes for complex layouts.
Mobile/e-ink considerations if relevant.

## 8. Configuration

New settings with defaults. New environment variables.
Which existing config sections are extended.

## 9. Acceptance Criteria

Behavior-oriented, specific, testable statements of what must be true.
Each criterion should be falsifiable — an agent can write a test that proves it.

Examples of good criteria:

- Uploading an EPUB while one is already processing returns 409.
- Refresh token replay (reusing a revoked token) returns 401.
- Segment text hash is stable across identical text regardless of chapter position.

## 10. Test Scenarios

Derived from acceptance criteria, invariants, and edge cases.
Written as behavior descriptions, not code. Grouped by test level.

### Unit

- e.g. overlap predicate returns true for partial date ranges
- e.g. SHA-256 hash is stable for identical input

### Integration

- e.g. POST /api/auth/login returns 401 for wrong password
- e.g. duplicate segment_audio (segment_id, voice, speed) is rejected by DB constraint

### Regression

- e.g. existing error response envelope shape is unchanged
- e.g. reading progress upsert does not clobber other users' data

## 11. Risks / Regression Concerns

What existing behavior could break. What is load-sensitive or order-dependent.
Flag areas where a small change could have wide blast radius.

## 12. Development Tasks

Numbered list of development phases, each described as a goal-oriented
scope area in 1-3 sentences. Describe WHAT each phase accomplishes and
what it encompasses — not HOW (no individual file names, no checkboxes).

The number of phases scales with effort size:
- Small effort (single feature): 4-6 phases
- Medium effort (multiple features): 6-10 phases
- Large effort (full app or platform): 12-20 phases

Each phase should be dense enough that /plan-tasks can expand it into
3-10 granular implementation checkboxes by cross-referencing sections 2-10.

Do NOT write the granular checkboxes — that is `/plan-tasks`' job.

## 13. Key Technical Decisions

Why X over Y. Document rationale for non-obvious choices.

## 14. Notes for Task Generation

Help `/plan-tasks` derive granular tasks from the full spec:

- State that section 12 provides phase ordering and sections 2-11
  provide the detail for expanding into granular checkboxes
- For large efforts, note the effort scale so `plan-tasks` calibrates
  the number of tasks per phase (more phases = more tasks total)
- Which seams have pure logic that should be unit-tested first
- Which slices touch API contracts or DB schema (need integration tests)
- Whether a slice should be split (logic + wiring as separate tasks)
- Which regression scenarios are highest priority to cover
- Phase dependency ordering (what must complete before what)

## 15. Future Considerations

What was explicitly deferred. Prevents scope creep during implementation.
```

**Writing guidelines:**

- Reference real API endpoints (e.g., `POST /dev/captioned_speech`, not "call the TTS API")
- Include actual JSON shapes for request/response
- Include SQL CREATE TABLE statements or schema tables
- Include pseudocode for non-trivial algorithms
- Note deviations from the project's existing patterns and explain why
- Cross-reference existing tables/endpoints from STATE.md to show integration points
- If a section isn't applicable, omit it (don't write empty sections)
- Test scenarios must be behavioral descriptions, never raw test code or framework-specific details

### Step 4: Review

After writing the spec:

1. Present it to the user
2. Ask for adjustments
3. Verify consistency: are service URLs, model names, port numbers, and table names correct throughout?
4. Check that the spec doesn't contradict existing architectural decisions from CLAUDE.md

### Step 5: Save

Write the spec to the appropriate Knowledge Base effort folder:

1. Determine the project name: `basename $(git rev-parse --show-toplevel)`
2. Determine the current version from the branch name.
   - If the branch contains a semantic version token with an optional leading `v`, use that version without the leading `v`.
   - Otherwise, ask the user which version folder to use.
3. Save the active spec to:
   `/srv/homelab/docker/syncthing/data/obsidian-vault/Knowledge Base/<project-name>/<version>/SPEC.md`

**Future spec (captured for later):** Save to:
`/srv/homelab/docker/syncthing/data/obsidian-vault/Knowledge Base/<project-name>/future/SPEC-v{X}-{feature-slug}.md`
Mark it at the top:

```markdown
> **Status:** Spec captured. To become the active SPEC.md when v{current} is complete and promoted.
```

After saving, remind the user: "Run `/plan-tasks` to generate the implementation checklist from this spec."

## Versioning Convention

- The canonical active spec lives in the Obsidian vault at `Knowledge Base/<project-name>/<version>/SPEC.md`
- Do not write `SPEC.md` to the repository root unless the user explicitly asks for a temporary working copy
- `plan-tasks`, `step-task`, and `implement-tasks` should use the same Knowledge Base version folder for `SPEC.md` and `TASKS.md`
- CLAUDE.md stays at root and is updated in-place only by completion/finalization skills (never by this skill)

## Anti-Patterns

- **Don't generate TASKS.md** — that's what `/plan-tasks` is for
- **Don't update CLAUDE.md** — that's handled by `/finalize-effort`
- **Don't generate STATE.md** — that's `/generate-state`
- **Don't skip the conversation** — even detailed briefs have ambiguities
- **Don't assume tech choices** — ask or research
- **Don't spec unasked features** — put them in "Future Considerations"
- **Don't hardcode URLs or model names** — everything through config
- **Don't write probe scripts or eval output to the Knowledge Base** — artifacts belong in the project's gitignored workspace or the scratchpad
