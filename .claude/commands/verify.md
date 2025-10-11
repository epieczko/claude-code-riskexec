---
skill: spec-kit.verify
model: claude-3.7-sonnet
maxTokens: 6000
strict: true
phase: verify
phaseLabel: "Verify (QA)"
---

# /verify — Spec Kit QA Review

Run this command after implementation to perform a quality audit with the **BMAD QA** agent (supported by the **BMAD Developer** when clarifications are required).

## Usage

```
/verify <feature-name>
```

- `feature-name` (optional): folder under `specs/` (defaults to `Feature-A`).

## Task

Assess whether the delivered code satisfies the feature specification, plan, and task checklist. Produce a QA report highlighting verification evidence and any outstanding gaps.

## Process

1. Activate **bmad-qa** as the lead persona and invite **bmad-developer** for clarifications when inconsistencies are found.
2. Use the Read tool immediately to load `specs/constitution.md` plus the feature's `spec.md`, `plan.md`, `tasks.md`, and recent git diff so automation can rely on persisted context instead of conversational summaries.
3. Build a traceability matrix that maps specification requirements and acceptance criteria to the implemented code and tests.
4. Run or request relevant automated tests (unit, integration, lint) and capture outcomes. If a test command fails, log the failure and suggest fixes before sign-off.
5. Identify discrepancies, risks, or regressions and categorize them by severity with recommended follow-up actions.
6. Save the QA summary back to `specs/<feature-name>/qa.md` (create the file if it does not exist) so future runs can compare results.
7. Provide a go/no-go recommendation and list the criteria that must be satisfied before release.

## Output Checklist

- Verification summary referencing specification sections and tasks.
- Evidence of tests executed (commands, results, and logs where applicable).
- Categorized issues with owners and suggested remediation steps.
- Final recommendation block (Ready / Needs Follow-up) with rationale.

Use this command to close the loop after `/implement` or to perform regression sweeps when the feature changes.
