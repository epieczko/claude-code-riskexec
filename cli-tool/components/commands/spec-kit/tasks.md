---
command: /tasks
description: Generate a delivery backlog using the BMAD Product Manager.
argument-hint: [feature-name]
agent: bmad-pm
allowed-tools: Read, Write, Edit
model: claude-3.7-sonnet
---

# /tasks – Backlog Generation

Activate **@bmad/roles/bmad-pm.md** to create the delivery backlog for **$ARGUMENTS**.

1. Consume `specs/$ARGUMENTS/architecture.md` and the upstream requirements.
2. Break the initiative into milestones, epics, and granular tasks with acceptance criteria.
3. Write the backlog to `specs/$ARGUMENTS/tasks.md` including:
   - Milestones with objectives, entry/exit criteria, and owners
   - Task list with acceptance criteria, dependencies, and suggested estimates
   - Cross-functional considerations (design, analytics, enablement)
   - QA readiness checklist and release gating requirements
4. Capture priority ordering and call out any unresolved dependencies.

Return the backlog path and a summary of critical path work.
