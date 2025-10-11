---
skill: spec-kit.specify
model: claude-3.7-sonnet
maxTokens: 8000
strict: true
---

# /specify — Spec Kit Phase 1

Run this command to kick off the Spec Kit workflow for a feature. It partners the **BMAD Analyst** (primary) and **BMAD PM** (support) agents to author a review-ready specification.

## Usage

```
/specify <feature-name> <brief>
```

- `feature-name` (optional): folder under `specs/` to target (defaults to `Feature-A`).
- `brief` (optional): short description or goals to seed the specification.

## Task

Draft or refine the functional specification located at `specs/<feature-name>/spec.md` in alignment with `specs/constitution.md`.

## Process

1. Activate the **bmad-analyst** agent as the lead persona.
2. Before drafting, call the Read tool to load `specs/constitution.md` plus the feature's existing `spec.md`, `plan.md`, and `tasks.md` (if present) so the agent always works from persisted context even when the command is triggered by automation.
3. Collaborate with the **bmad-pm** agent to confirm user value framing and acceptance criteria coverage.
4. Identify missing information, assumptions, and risks; ask for clarification when necessary.
5. Produce a Markdown specification with the required sections and traceability cues.
6. Use the Write tool to overwrite `specs/<feature-name>/spec.md` with the latest draft (unless the user prefers manual copy) and ensure the file remains the single source of truth for downstream phases.
7. Summarize outstanding questions and highlight the readiness gate before advancing to `/plan`.

## Output Checklist

- Executive summary connected to product goals.
- User stories, functional requirements, and acceptance criteria aligned with the constitution.
- Explicit traceability notes referencing downstream planning needs.
- Open questions and approval checklist items.

Use this command only when you are ready to invest in a formal specification; the next phases depend on its quality.
