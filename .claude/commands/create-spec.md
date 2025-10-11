---
skill: spec-kit.specify
model: claude-3.7-sonnet
maxTokens: 8000
strict: true
phase: specify
phaseLabel: "Specify (Analyze)"
---

# /create-spec — Agent OS Alias

`/create-spec` is the BuilderMethods Agent OS alias for the Spec Kit specification phase. Execute it exactly like `/specify` when Agent OS orchestration calls for a new or updated feature spec.

## Usage

```
/create-spec <feature-name> <brief>
```

- `feature-name`: folder under `specs/` that holds the feature artifacts.
- `brief` (optional): short context string or request summary passed in by Agent OS.

## Responsibilities

1. Activate the **BMAD Analyst** persona (with **BMAD PM** support) and load the feature brief plus prior spec/plan/tasks drafts.
2. Produce `specs/<feature-name>/spec.md` that complies with the Spec Kit constitution, including risks and approval checkpoints.
3. Ensure the CLI mirrors the file to `.agent-os/product/<feature-name>/specs/<feature-name>/spec.md` so the Agent OS UI displays the latest draft.
4. Reply with a synopsis of open questions or approvals needed before `/plan` begins.

Use `/specify` interchangeably when running the workflow manually—the alias exists so external Agent OS automation can trigger the same behavior.
