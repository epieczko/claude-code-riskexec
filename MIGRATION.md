# Repository Migration Guide

This document maps legacy component locations to the new BMAD phase structure introduced in Phase A.

| old_path | new_phase_path | purpose |
| --- | --- | --- |
| `cli-tool/components/agents/development-tools/command-expert.md` | `cli-tool/components/bmad/roles/bmad-developer.md` | Developer execution role used by the `/implement` command. |

## Phase Directory Overview

- **Analyst → Architect → PM → Developer → QA** roles now live under `cli-tool/components/bmad/roles/` with explicit phase metadata.
- Spec Kit commands (`/specify`, `/plan`, `/tasks`, `/implement`) are organized under `cli-tool/components/commands/spec-kit/` and write outputs to `specs/<Feature>/`.
- `cli-tool/components/registry.json` provides a single discovery surface for agents, commands, and MCP integrations (currently GitHub).

Use this guide when updating automations or documentation that referenced the legacy component layout.
