---
command: /specify
description: Convert a feature idea into structured requirements using the BMAD Analyst.
argument-hint: '[feature-name]'
agent: bmad-analyst
phase: specify
---

# /specify – Requirements Intake

Activate **@bmad/roles/bmad-analyst.md** to capture the requirements for **$ARGUMENTS**.

1. Gather all referenced context (feature brief, user research, analytics) before drafting.
2. Conduct clarification Q&A to resolve gaps or hidden assumptions.
3. Write the requirements package to `specs/$ARGUMENTS/spec.md` using the template:
   - Executive summary & user persona
   - Functional requirements and constraints
   - Non-functional expectations (performance, compliance, observability)
   - Success metrics and validation checkpoints
   - Open questions & risks for architecture review
4. Summarize notable decisions and blockers at the end of the document.

Return a link to the generated spec file and highlight any follow-up needed for the Architect.
