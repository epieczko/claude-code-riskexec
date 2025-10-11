---
command: /implement
description: Execute backlog tasks using the BMAD Developer.
argument-hint: '[feature-name] | --task "task-title"'
agent: bmad-developer
phase: implement
---

# /implement – Delivery Execution

Activate **@bmad/roles/bmad-developer.md** to implement the selected work for **$ARGUMENTS**.

1. Inspect `specs/$ARGUMENTS/tasks.md` and choose the highest priority task (override with `--task`).
2. Assemble referenced source files, tests, and tools required to ship the change.
3. Implement the solution following repo contribution guidelines (commit messages, linting, tests).
4. Document progress in `specs/$ARGUMENTS/implementation-notes.md`:
   - Task identifier and summary of changes
   - Files touched and validation performed
   - Follow-up questions or risks for QA/PM
5. Prepare artifacts for BMAD QA (test results, screenshots, demos) and note them in the implementation notes.

Return a status summary, links to changed files, and the implementation notes entry.
