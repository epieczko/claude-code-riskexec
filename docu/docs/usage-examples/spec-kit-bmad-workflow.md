---
title: Spec Kit + BMAD Manual Workflow (Phase 1)
sidebar_position: 5
lastUpdated: 2025-10-11
tags:
  - spec-kit
  - workflow
  - bmad
---

# Spec Kit + BMAD Manual Workflow (Phase 1)

This example shows how to run the Spec Kit phased workflow in Claude Code RiskExec using the BMAD agent team. The Phase 1 setup focuses on a single feature folder and manual checkpoints.

## Prerequisites

- Install dependencies for this repo (`npm install`).
- Ensure `.claude/commands/` includes the Spec Kit command prompts and `.claude/agents/bmad-team/` contains the BMAD role definitions.
- Create a feature workspace under `specs/<feature-name>/` (the repository includes `Feature-A` as a starter).

## Step 1 — Specify (Analyze)

Run the `/specify` command to generate or refine `specs/<feature-name>/spec.md`.

```bash
/specify Feature-A "Improve analytics export experience"
```

The command activates the **bmad-analyst** agent (with PM support) to draft a structured specification that follows the constitution. Review the output, answer open questions, and save the final draft to `spec.md`.

## Step 2 — Plan (Design)

After approving the specification, invoke `/plan` to translate it into a technical plan.

```bash
/plan Feature-A
```

The **bmad-architect** agent documents architecture decisions, module responsibilities, and validation strategy inside `specs/Feature-A/plan.md`. Verify traceability to every requirement before proceeding.

## Step 3 — Tasks (Manage)

Use `/tasks` to break the plan into actionable work items.

```bash
/tasks Feature-A
```

The **bmad-pm** agent, assisted by **bmad-qa**, produces `specs/Feature-A/tasks.md` with checklists, milestone gates, and QA notes. Confirm that each task references the corresponding spec and plan entries.

## Step 4 — Implement (Build)

Execute tasks sequentially with `/implement`.

```bash
/implement Feature-A "Implement API pagination"
```

The **bmad-developer** agent collaborates with **bmad-qa** to implement code, run tests, and record evidence. Repeat for each task until the feature meets all acceptance criteria and QA signs off on implementation checkpoints.

## Step 5 — Verify (QA)

Close the loop with `/verify` once implementation evidence is complete.

```bash
/verify Feature-A
```

The **bmad-qa** agent reviews every deliverable, reruns `/test` or `/lint` if necessary, and produces a verification log that references the constitution checklists. Only ship changes after this phase produces a ✅ verdict.

## Review Gates

At each phase, use the checklist in `specs/constitution.md` to confirm readiness before moving forward. The constitution enforces traceability and quality without automation, forming a foundation for later phases of the rollout.

For an end-to-end automation example, see the Spec Kit workflow runner described in [`README.md`](../../README.md).
