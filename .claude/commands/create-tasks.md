---
skill: spec-kit.tasks
model: claude-3.7-sonnet
maxTokens: 8000
strict: true
phase: tasks
phaseLabel: "Tasks (Manage)"
---

# /create-tasks — Agent OS Alias

Use `/create-tasks` when Agent OS automation instructs the workflow to transform the approved plan into a structured checklist. The behavior matches `/tasks` and uses the **BMAD PM** agent.

## Usage

```
/create-tasks <feature-name>
```

- `feature-name`: target feature folder under `specs/`.

## Responsibilities

1. Load the latest specification and plan to capture context before writing tasks.
2. Generate `specs/<feature-name>/tasks.md` with traceable checklist items, QA partners, and risk callouts.
3. Confirm mirroring to `.agent-os/product/<feature-name>/specs/<feature-name>/tasks.md` so Agent OS dashboards stay current.
4. Return a short summary covering total tasks, critical dependencies, and QA ownership notes.

Operators can still call `/tasks` manually; `/create-tasks` exists for compatibility with BuilderMethods Agent OS orchestration.
