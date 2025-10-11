---
skill: spec-kit.tasks
model: claude-3.7-sonnet
maxTokens: 8000
strict: true
---

# /tasks — Spec Kit Phase 3

Execute this command after `/plan` approval to break the plan into actionable work items using the **BMAD PM** agent (with optional QA input).

## Usage

```
/tasks <feature-name>
```

- `feature-name` (optional): target folder under `specs/` (defaults to `Feature-A`).

## Task

Generate or refine the task list located at `specs/<feature-name>/tasks.md`, linking each task to specification requirements and plan sections.

## Process

1. Activate **bmad-pm** as the primary persona and loop in **bmad-qa** when defining validation tasks.
2. Load `spec.md`, `plan.md`, and the constitution to maintain traceability and gated progression.
3. Decompose the plan into discrete, testable tasks with checkbox status indicators.
4. Tag each task with references to relevant spec requirements, plan decisions, and expected deliverables.
5. Group tasks into milestones with exit criteria aligned to acceptance tests.
6. Capture dependencies, risks, and QA collaboration notes.
7. Write the completed task list back to `specs/<feature-name>/tasks.md`.

## Output Checklist

- Comprehensive task breakdown with traceability annotations.
- Milestone definitions including readiness gates for `/implement`.
- Risk log and dependency callouts.
- QA partnership notes identifying validation ownership.

Only move to `/implement` once the task list has stakeholder approval.
