# Agent OS Integration Guide

This document explains how the Claude Code RiskExec workflow integrates with Agent OS and how artifacts flow between the two systems.

## Overview

Agent OS orchestrates the Spec Kit workflow by issuing commands that correspond to each phase. The integration ensures that command aliases, agents, instructions, and output artifacts remain synchronized between the CLI workflow and Agent OS.

```
┌────────────────────┐      ┌───────────────────────────────┐
│ Agent OS Workflow  │────▶ │ Claude Code Spec Kit Phases   │
│ (.agent-os/*.yml)  │      │ (specs/{feature}/...)         │
└────────────────────┘      └───────────────────────────────┘
           │                               │
           │                               ▼
           │                 Mirror artifacts to `.agent-os/product/{feature}`
           │                               │
           ▼                               ▼
  Agent OS UI consumes          Developers run CLI phases & scripts
  mirrored artifacts            (specify, plan, tasks, implement)
```

## Workflow Files

* `.agent-os/workflows/spec_kit.yml` defines the Agent OS orchestration. Each phase lists the agent to invoke, the command alias, the instruction file, inputs, and expected output path.
* `.agent-os/command-map.json` maps each phase to both the CLI command (e.g., `/specify`) and the Agent OS alias (e.g., `/create-spec`). The map is generated programmatically to ensure consistency.
* `.agent-os/instructions/core/*.mdc` contain prompt snippets used by Agent OS when triggering each phase.

## Command Synchronization

Run the generator any time the workflow or registry changes:

```bash
npm run agentos:command-map
```

This script rebuilds `.agent-os/command-map.json` by combining data from:

* `src/phases/registry.ts` (authoritative list of Spec Kit phases)
* `.agent-os/workflows/spec_kit.yml` (Agent OS configuration)
* `.claude/commands/*.md` (available CLI commands)

The resulting JSON includes each phase's agent, CLI command, Agent OS command alias, instruction path, inputs, and outputs. Keeping the file generated avoids manual drift.

## Integration Verification

Before shipping changes, validate that the Agent OS configuration is aligned with the CLI workflow:

```bash
npm run agentos:verify
```

`scripts/verifyAgentOSIntegration.ts` performs the following checks:

1. Every phase in `spec_kit.yml` exists in `phaseRegistry` and uses the same agent/output.
2. Required inputs declared in `phaseRegistry` are present in the Agent OS workflow.
3. Command aliases match the generated command map and resolve to an existing CLI command.
4. Instruction files referenced by each phase exist under `.agent-os/instructions`.
5. `.agent-os/command-map.json` is in sync with the generated structure (catching manual edits).

The script reports warnings for optional mismatches and fails the run if any errors are detected.

## Artifact Mirroring

Each Spec Kit phase writes its canonical output under `specs/{feature}` and immediately mirrors the same file(s) to `.agent-os/product/{feature}`. Agent OS reads from the mirrored directory to display results in its UI. The mirroring utilities reside in `src/lib/agentOs.ts` and are invoked by the phase handlers.

Key mirrored artifacts:

| Phase      | Primary Output                        | Mirrored Location                                |
|------------|----------------------------------------|--------------------------------------------------|
| Specify    | `specs/{feature}/spec.md`              | `.agent-os/product/{feature}/spec.md`            |
| Plan       | `specs/{feature}/plan.md` and `architecture/` | `.agent-os/product/{feature}/plan.md` and `.agent-os/product/{feature}/architecture/` |
| Tasks      | `specs/{feature}/tasks.md`             | `.agent-os/product/{feature}/tasks.md`           |
| Implement  | `specs/{feature}/implementation/` logs | `.agent-os/product/{feature}/implementation/`    |

## Status Tracking (Optional Extension)

The current integration mirrors Markdown artifacts. For richer dashboards, consider augmenting the mirroring step to write a status JSON (e.g., `.agent-os/product/{feature}/status.json`) summarizing the latest phase run, timestamps, and pass/fail state. This structure can be expanded without altering the verification scripts.

## Troubleshooting

* Run `npm run agentos:verify` after modifying `.agent-os/workflows` or the phase registry.
* If verification fails due to missing CLI commands, ensure a corresponding `.claude/commands/<phase>.md` file exists.
* When Agent OS fails to display updates, confirm the mirrored paths under `.agent-os/product/{feature}` reflect the latest spec/plan/tasks/implementation files.

Maintaining these scripts and conventions keeps the Spec Kit CLI and Agent OS aligned, preventing runtime surprises when the workflow executes in the Agent OS environment.
