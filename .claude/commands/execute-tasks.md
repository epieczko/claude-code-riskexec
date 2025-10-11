---
skill: spec-kit.implement
model: claude-3.7-sonnet
maxTokens: 8000
strict: true
phase: implement
phaseLabel: "Implement (Build)"
---

# /execute-tasks — Agent OS Alias

`/execute-tasks` is the Agent OS trigger for the Spec Kit implementation phase. It mirrors `/implement` and activates the **BMAD Developer** with **BMAD QA** support to work through the task checklist.

## Usage

```
/execute-tasks <feature-name> <task-id>
```

- `feature-name`: feature folder under `specs/`.
- `task-id` (optional): task label to resume; omit to iterate sequentially.

## Responsibilities

1. Read the feature's spec, plan, and task list before editing code so context persists across automated runs.
2. Perform the work for the selected task, documenting changes, tests executed, and remaining follow-ups.
3. Write implementation notes to `specs/<feature-name>/implementation/` and ensure they mirror to `.agent-os/product/<feature-name>/specs/<feature-name>/implementation/`.
4. Report completion status (including validation evidence) back to Agent OS so QA or verification agents can proceed.

You can continue to use `/implement` manually; `/execute-tasks` keeps BuilderMethods Agent OS orchestration consistent with the Spec Kit CLI.
