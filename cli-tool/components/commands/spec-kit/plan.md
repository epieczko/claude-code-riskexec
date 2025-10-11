---
command: /plan
description: Develop an architecture blueprint using the BMAD Architect.
argument-hint: '[feature-name]'
agent: bmad-architect
phase: plan
---

# /plan – Architecture Blueprint

Activate **@bmad/roles/bmad-architect.md** to produce the system plan for **$ARGUMENTS**.

1. Read the requirements from `specs/$ARGUMENTS/spec.md` and supporting artifacts.
2. Identify architectural drivers, constraints, and major decisions that guide the solution.
3. Author `specs/$ARGUMENTS/plan.md` including:
   - Component breakdown and interaction diagram (described textually if diagrams unavailable)
   - Data flow, API contracts, and integration points
   - Technology selections, build-vs-buy choices, and reuse of accelerators
   - Risks, mitigation strategies, and inputs needed from PM or QA
4. Provide a concise summary of the proposed architecture and open risks.

Return the plan document path and any questions that must be resolved before task planning.
