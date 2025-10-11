# Repository Migration Guide

This document maps legacy component locations to the new BMAD phase structure introduced in Phase A.

| old_path | new_phase_path | purpose |
| --- | --- | --- |
| `cli-tool/components/agents/development-tools/command-expert.md` | `cli-tool/components/bmad/roles/bmad-developer.md` | Developer execution role used by the `/implement` command. |

## Phase Directory Overview

- **Analyst → Architect → PM → Developer → QA** roles now live under `cli-tool/components/bmad/roles/` with explicit phase metadata.
- Spec Kit commands (`/specify`, `/plan`, `/tasks`, `/implement`, `/verify`) are organized under `cli-tool/components/commands/spec-kit/` and write outputs to `specs/<feature>/`.
- `cli-tool/components/registry.json` provides a single discovery surface for agents, commands, and MCP integrations (currently GitHub).

## Phase A follow-ups

- Requirements documents were renamed from `requirements.md` to `spec.md` to align with the Spec Kit lexicon.
- Architecture outputs were renamed from `architecture.md` to `plan.md` to reflect actionable design guidance.
- The `/verify` command was added to connect the BMAD QA role with the workflow and registry, completing the Spec Kit phase coverage.
- BMAD role frontmatter now includes shared metadata (description, skill, tools, model) so downstream automation can rely on a consistent schema.
- `scripts/validateBmadComponents.js` enforces registry integrity and frontmatter requirements for BMAD roles and Spec Kit commands.

Use this guide when updating automations or documentation that referenced the legacy component layout.
