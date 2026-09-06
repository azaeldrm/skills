---
name: explore-effort
description: Run an interactive research session to explore a new effort, gathering context from documentation, external sources, and user decisions to produce a comprehensive STORY.md. Use this before spec-effort when starting a new feature, platform, or major effort that requires upfront research and decision-making. Triggers on "let's research", "story", "let's explore", "new effort", "I want to plan a big feature", or when the user provides URLs and context to study before speccing.
---

# Effort Explorer

Run a deep interactive research session that produces a `STORY.md` — a comprehensive decision document capturing all constraints, technical choices, scope decisions, and context gathered through research and conversation. This document becomes the primary input for `spec-effort`.

## Where This Fits in the Workflow

```
  +-----------------+
  | explore-effort   | <- YOU ARE HERE
  | (this skill)     |
  +--------+---------+
           v
  spec-effort         -> reads STORY.md to produce SPEC.md (minimal additional Q&A)
           v
  /plan-tasks         -> generates TASKS.md from SPEC.md
           v
  /step-task          -> implements one step at a time
           v
  /finalize-effort    -> archives docs, creates PR
```

**Do not** generate SPEC.md, TASKS.md, or modify CLAUDE.md. Those are separate skills in the pipeline.

## When to Use This Skill

- Starting a new platform (e.g., adding mobile to a web app)
- Starting a major effort that spans multiple milestones
- When the user provides URLs, documentation, or external sources to study first
- When there are many unknowns that need interactive exploration before speccing
- When technical feasibility needs to be researched before committing to an approach

**Do not use** for small features or bug fixes — go directly to `spec-effort` for those.

## Process

### Phase 1: Gather Existing Context

Read the project's current state. Look for these files in order:

1. `docs/STATE.md` or root `STATE.md` — current codebase snapshot
2. `docs/CORE.md` or `PROJECT_CORE.md` — product vision and core model
3. `docs/ROADMAP.md` or `ROADMAP.md` — version scope and boundaries
4. `CLAUDE.md` — project conventions and architecture decisions

If none exist, ask the user to describe their project and what they have today.

Also locate the project's gitignored workspace for investigation artifacts — commonly `.local/` (check `.gitignore` and any workspace README). Being gitignored, it won't show up in `git ls-files` or most searches, so absence from results is not evidence it doesn't exist.

**Probes, scripts, snapshots, and logs go there — never in the Knowledge Base**, which holds markdown planning documents only. Fall back to the session scratchpad if the project has no such workspace. Any probe that mutates real config or source must revert it and leave `git status` clean. Record the artifact path in Context Sources Consulted; if a script proves durably useful, note in `STORY.md` that it should graduate to the project's committed scripts directory, since a gitignored script isn't reproducible for teammates or CI.

Summarize what you understand before proceeding. This grounds the conversation.

### Phase 2: Research External Sources

If the user provides URLs, documentation links, or technologies to research:

1. Fetch each URL using `WebFetch` to extract relevant technical information
2. Focus on: API surfaces, setup requirements, compatibility constraints, feature capabilities, and limitations
3. Cross-reference findings with the project's existing tech stack and architecture decisions
4. Note any conflicts or dependencies between new technology and existing choices

Run fetches in parallel where possible. Summarize key findings before moving to questions.

### Phase 3: Interactive Question Session

Run an iterative question session using **`AskUserQuestion`** exclusively (TUI-based). Never ask questions as plain text — always use the tool so the user can select answers via the interface.

**Question batches should cover these areas in order:**

#### 3a. Environment & Constraints
- Development machine / OS / toolchain availability
- Build and deployment infrastructure
- Test devices and testing capabilities
- Network topology (if relevant to dev workflow)

#### 3b. Scope & Goals
- What features are in scope vs deferred
- Feature parity expectations (if building for a new platform)
- Priority ordering of capabilities
- Success criteria

#### 3c. Technical Decisions
For each major technical choice:
- Present 2-4 concrete options with trade-offs in the `description` field
- Use `preview` for side-by-side comparisons (code snippets, architecture diagrams, feature matrices)
- When the user says "I'm not sure" or asks for more information, **provide a thorough comparison before re-asking** — don't just repeat the options
- When the user asks "why X over Y", explain with specifics relevant to their project
- Make a recommendation when you have enough context, but let the user decide

#### 3d. UX & Interaction Model
- How the product should look and feel
- Navigation patterns
- Interaction models (especially when adapting from one platform to another)
- Accessibility and special modes (e-ink, etc.)

#### 3e. Integration & Data Flow
- How new components connect to existing systems
- Shared code and packages
- Authentication and state management
- Offline/connectivity behavior
- Caching strategy

#### 3f. Open Questions & Risks
- Identify areas where a decision can't be made yet
- Propose how to resolve them (spikes, prototypes, worktree experiments)
- Flag technical risks discovered during research

**Rules for the question session:**

- Use `AskUserQuestion` for ALL questions — never ask in plain text
- 1-4 questions per batch, grouped by topic
- Use short `header` values (max 12 chars): `"Dev Machine"`, `"Scope"`, `"Audio API"`, `"State Mgmt"`
- Put the recommended option first with rationale in its `description`
- Use `preview` when comparing code patterns, architecture choices, or UI layouts
- Use `multiSelect: true` when choices aren't mutually exclusive
- Between batches, briefly summarize what was decided and what area comes next
- When the user provides free-text answers (via "Other"), incorporate their response and adapt follow-up questions
- When the user wants to discuss an option further, provide detailed analysis before re-asking
- Continue until you can write the full story document without guessing

### Phase 4: Write STORY.md

Generate the story document with this structure:

```markdown
# {Project} {Effort} — Story

> Research session output. This document captures all decisions, constraints,
> and technical context gathered through interactive research. It is the
> primary input for `spec-effort` when producing the implementation spec.

## Effort Summary

One paragraph: what is being built, for whom, and the key constraints.

## Development Environment

Table of environment decisions: machines, build approach, test devices,
network, platform priority. Include the development loop (step-by-step
workflow for daily iteration).

## Technical Stack Decisions

Table of every technology choice with rationale. Include key technical
notes that explain non-obvious interactions between choices.

## Scope

What's in, what's out. If targeting feature parity with an existing
system, include a screen-by-screen mapping and a feature adaptation matrix.

## UI / UX Decisions

Table of interaction model decisions. How should it look, feel, and behave.

## [Domain-Specific Sections]

Add sections relevant to the specific effort. Examples:
- Offline / Connectivity (for mobile apps)
- Data Migration (for platform moves)
- Performance Constraints (for real-time systems)
- Security Model (for auth-heavy features)

## Open Questions

Items that can't be decided yet, with a plan for how to resolve each
(spike, prototype, worktree experiment, research).

## Architecture Notes

Technical architecture details: package consumption, store design,
API integration patterns, screen structure. Enough detail that
spec-effort can produce schemas and API designs from this.

## Context Sources Consulted

Table of every source read (project docs, external URLs, codebase
exploration) and what was learned from each.

## Relationship to Workflow Pipeline

Show where STORY.md fits and how it feeds into spec-effort.
```

**Writing guidelines:**

- Every decision must have a rationale — no unexplained choices
- Include the actual technology names, versions, and API methods discovered during research
- Reference specific project files and patterns when showing how new work integrates
- Open questions must have a resolution plan, not just "TBD"
- Tables are preferred over prose for decision matrices
- Include the development workflow (daily iteration loop) — this is critical for reproducibility

### Phase 5: Review & Save

1. Present the completed document to the user
2. Ask for corrections or additions via `AskUserQuestion`
3. Determine the save path:
   - Project name: `basename $(git rev-parse --show-toplevel)`
   - Version: infer from the active branch name (e.g. `feature/0.1.1-foo` → `0.1.1`). If the branch name contains no version, ask the user.
   - Vault path: `/srv/homelab/docker/syncthing/data/obsidian-vault/Knowledge Base/<project-name>/<version>/STORY.md`
4. Create the directory if needed:
   ```bash
   mkdir -p "/srv/homelab/docker/syncthing/data/obsidian-vault/Knowledge Base/<project-name>/<version>"
   ```
5. Write the story document to the vault path above.

After saving, remind the user: "Run `/spec-effort` to produce the implementation spec from this story. The spec skill will read the story from the vault and require minimal additional Q&A."

## Versioning Convention

- The canonical story lives in the Obsidian vault at `Knowledge Base/<project-name>/<version>/STORY.md`
- Each effort gets its own version folder, and the story file is always named `STORY.md`
- If a story exists from a previous effort, read it for context but don't modify it — write a new file for the new version

## Anti-Patterns

- **Don't skip the research phase** — if the user provides URLs, fetch and study them before asking questions
- **Don't ask questions as plain text** — always use `AskUserQuestion` for the TUI interface
- **Don't generate SPEC.md** — that's what `spec-effort` is for
- **Don't make decisions without presenting options** — even when you have a strong recommendation, present alternatives
- **Don't rush the question session** — thorough research now saves rework during implementation
- **Don't repeat options without new information** — when the user asks for clarification, provide a deeper analysis before re-asking
- **Don't ignore the user's environment constraints** — development workflow must be realistic for their actual setup
- **Don't write probe scripts or eval output to the Knowledge Base** — it's a synced note vault for planning docs; artifacts belong in the project's gitignored workspace or the scratchpad
