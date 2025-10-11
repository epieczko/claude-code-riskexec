---
skill: spec-kit.implement
model: claude-3.7-sonnet
maxTokens: 8000
strict: true
---

# /implement — Spec Kit Phase 4

Use this command to execute the approved tasks with the **BMAD Developer** as the lead persona and the **BMAD QA** agent as validation partner.

## Usage

```
/implement <feature-name> <task-id>
```

- `feature-name` (optional): folder under `specs/` (defaults to `Feature-A`).
- `task-id` (optional): reference to the checklist item currently being implemented.

## Task

Perform implementation work for the selected task while strictly adhering to the specification, plan, task list, and constitution.

## Process

1. Activate **bmad-developer** as the primary agent and keep **bmad-qa** available for validation.
2. Load `spec.md`, `plan.md`, `tasks.md`, and any relevant code files.
3. Restate the task goal, success criteria, and planned validation steps before editing code.
4. Execute the work incrementally, using Read/Write/Terminal tools to modify files and run tests.
5. Document commands executed, test evidence collected, and files touched.
6. Coordinate with **bmad-qa** to confirm acceptance criteria coverage or to design follow-up tests.
7. Summarize completion status, remaining follow-ups, and readiness for review.

## Output Checklist

- Implementation notes tied to the referenced task ID and spec requirements.
- List of files updated with rationale.
- Evidence of executed tests or manual verification steps.
- Next actions or QA follow-ups before closing the task.

Run this command iteratively for each task until the feature is complete and QA sign-off is achieved.
