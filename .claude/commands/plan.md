---
skill: spec-kit.plan
model: claude-3.7-sonnet
maxTokens: 8000
strict: true
---

# /plan — Spec Kit Phase 2

Leverage this command after `/specify` approval to transform the specification into a technical plan using the **BMAD Architect** agent.

## Usage

```
/plan <feature-name>
```

- `feature-name` (optional): target folder under `specs/` (defaults to `Feature-A`).

## Task

Create or update the technical plan at `specs/<feature-name>/plan.md`, ensuring traceability to the specification and constitution.

## Process

1. Activate **bmad-architect** as the lead persona (optionally collaborate with **bmad-analyst** for clarifications).
2. Immediately read `specs/constitution.md` and the feature's `spec.md`, `plan.md`, and `tasks.md` (where present) so the command remains deterministic when invoked by hooks or orchestration.
3. Document architecture decisions, module responsibilities, integration points, and sequencing.
4. Reference the relevant specification requirements for each plan component.
5. Define validation and observability strategy, including QA touchpoints.
6. Write the resulting plan back to `specs/<feature-name>/plan.md` and ensure it references the specification sections that each plan component satisfies.
7. Flag any blockers preventing `/tasks` from proceeding and list open decisions that require stakeholder input.

## Output Checklist

- Summary of solution concept and scope.
- Architecture decision records with rationale and implications.
- Implementation outline broken into modules or work streams.
- Risks, mitigations, and validation strategy aligned with the constitution.

Run this command only after the specification has been reviewed and signed off.
