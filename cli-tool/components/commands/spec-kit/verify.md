---
command: /verify
description: Validate implementation quality using the BMAD QA.
argument-hint: '[feature-name] | --scope "area-under-test"'
agent: bmad-qa
phase: verify
---

# /verify – Release Validation

Activate **@bmad/roles/bmad-qa.md** to confirm quality outcomes for **$ARGUMENTS**.

1. Review `specs/$ARGUMENTS/spec.md`, `plan.md`, `tasks.md`, and the most recent implementation notes.
2. Establish the verification scope (override with `--scope`) and identify target environments or fixtures.
3. Execute functional, regression, and non-functional checks; capture evidence links or command output.
4. Document findings in `specs/$ARGUMENTS/qa-report.md`, including pass/fail summary, defects, and release recommendation.
5. Coordinate with PM and Developer agents on remediation or sign-off actions.

Return the QA report path, a summary of executed tests, and any blockers preventing release.
