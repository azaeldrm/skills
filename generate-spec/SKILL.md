---
name: generate-spec
description: Generate a SPEC.md for a new feature or application through interactive requirements gathering. Use this skill whenever the user wants to plan, design, or spec out a new feature — including when they say "let's plan", "let's spec", "write a spec", "new feature", "I want to build", or "let's design". This skill handles ONLY the spec — use the tasks-create command afterward to generate TASKS.md from the finished spec. Also use when capturing future feature specs (lighter-weight, marked as not-yet-active).
---

# Spec Generator

Generate a SPEC.md through interactive conversation. This skill produces **only the spec** — it does not generate TASKS.md or update CLAUDE.md. Those are handled by the existing `tasks-create` and `tasks-finish` commands.

## Where This Fits in the Workflow

```
  ┌─────────────────┐
  │ generate-spec    │ ← YOU ARE HERE
  │ (this skill)     │
  └────────┬────────┘
           ▼
  /tasks-create       → generates TASKS.md from SPEC.md
           ▼
  /tasks-start        → implements one step at a time
           ▼
  /generate-discovery → captures decisions and learnings
           ▼
  /tasks-finish       → archives docs, updates CLAUDE.md, creates PR
           ▼
  /generate-state     → generates STATE.md for next cycle
           ▼
  Back to generate-spec for the next feature
```

**Do not** generate TASKS.md, update CLAUDE.md, or create STATE.md. Those are separate commands in the pipeline.

## Process

### Step 1: Gather Context

**If STATE.md exists in the repo root**, read it first. It contains the most accurate snapshot of the current codebase — tables, API surface, tech stack, architectural decisions. This is your starting point.

**If no STATE.md on root exists, look at the STATE.md in the latest version under docs/ **.

**If this is a new project**, ask the user to describe their idea and what infrastructure they already have running.

### Step 2: Ask Questions

Run an interactive requirements conversation. Ask questions in batches of 2-4. Prompt the user in the CLI with choices to answer.

**What to cover:**

1. **Core experience** — What does the user see and do? Walk through the interaction step by step.
2. **Data** — What's created, stored, queried? What tables, what columns?
3. **Integration** — What services does this touch? What APIs? Look up real endpoints via web search.
4. **Scope** — What's day-1 vs future? What's explicitly out of scope?
5. **Technical choices** — When the user isn't sure, research options and recommend one with rationale.
6. **Edge cases** — Failure modes, constraints, concurrency issues.

**Rules:**

- When the user mentions a service (e.g., "I have Kokoro running"), search the web for its actual API documentation. Spec against real endpoints, not assumptions.
- When there are bounded choices (e.g., "which navigation pattern?"), describe the options concretely and let the user pick.
- When the user says "I'm not sure," make a recommendation and explain why.
- Don't ask questions you can answer by reading the existing codebase.
- Stop asking when you can write the full spec without guessing.

### Step 3: Write SPEC.md

Generate the spec file with this structure:

```markdown
# {Project} — v{X} Spec: {Feature Name}

## 1. Feature Overview

What it does. Who it's for. The key experience in one paragraph.

## 2. Architecture

Updated system diagram (ASCII). Tech stack table (new additions only).
New dependencies with rationale.

## 3. Data Model Changes

New tables: full schema (column, type, description).
Modified tables: what changes and why.
Unchanged tables: list them so the reader knows they were considered.

## 4. Processing Pipeline

Step-by-step flow. Pseudocode for non-obvious algorithms.
Sequence of operations with error handling notes.

## 5. API Design

New endpoints: method, path, description, request/response JSON.
Modified endpoints: what changes.
Auth/middleware changes if applicable.

## 6. Frontend Design

Views, components, states, interactions.
ASCII wireframes for complex layouts.
Mobile/e-ink considerations if relevant.

## 7. Configuration

New settings with defaults. New environment variables.
Which existing config sections are extended.

## 8. Acceptance Criteria

Behavior-oriented, specific, testable statements of what must be true.
Each criterion should be falsifiable — an agent can write a test that proves it.

Examples of good criteria:

- Uploading an EPUB while one is already processing returns 409.
- Refresh token replay (reusing a revoked token) returns 401.
- Segment text hash is stable across identical text regardless of chapter position.

## 9. Test Scenarios

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

## 10. Risks / Regression Concerns

What existing behavior could break. What is load-sensitive or order-dependent.
Flag areas where a small change could have wide blast radius.

## 11. Development Tasks

High-level numbered list grouped by phase.
(The detailed checkbox version is generated separately by /tasks-create)

## 12. Key Technical Decisions

Why X over Y. Document rationale for non-obvious choices.

## 13. Notes for Task Generation

Help /tasks-create slice the work correctly:

- Which seams have pure logic that should be unit-tested first
- Which slices touch API contracts or DB schema (need integration tests)
- Whether a slice should be split (logic + wiring as separate tasks)
- Which regression scenarios are highest priority to cover

## 14. Future Considerations

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

Write the spec to the appropriate location:

**Active spec (building next):** Save to `SPEC.md` in the project root.

**Future spec (captured for later):** Save to `docs/future/SPEC-v{X}-{feature-slug}.md`. Mark it at the top:

```markdown
> **Status:** Spec captured. To become the active SPEC.md when v{current} is complete and archived.
```

After saving, remind the user: "Run `/tasks-create` to generate the implementation checklist from this spec."

## Versioning Convention

- Root `SPEC.md` is always the current, active spec
- When a version is fully implemented, `tasks-finish` archives it to `docs/{semver}/`
- Check existing `docs/` subdirectories to determine the current version number
- CLAUDE.md stays at root and is updated in-place (never archived)

## Anti-Patterns

- **Don't generate TASKS.md** — that's what `/tasks-create` is for
- **Don't update CLAUDE.md** — that's handled by `/tasks-finish`
- **Don't generate STATE.md** — that's `/generate-state`
- **Don't skip the conversation** — even detailed briefs have ambiguities
- **Don't assume tech choices** — ask or research
- **Don't spec unasked features** — put them in "Future Considerations"
- **Don't hardcode URLs or model names** — everything through config
