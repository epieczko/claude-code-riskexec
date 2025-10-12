# Spec Kit Workflow Guide

The RiskExec Spec Kit orchestrates software delivery through a structured BMAD (Build, Measure, Analyze, Decide) pipeline with five dedicated agent roles (mapped to Analyst, Architect, PM, Developer, and QA respectively). Each phase takes a well-defined input, prompts a specialized agent, and synchronizes the resulting artifact with Agent OS so product, engineering, and quality stakeholders share a single source of truth. This guide explains how to run the workflow end-to-end and where to find the generated outputs.

## Pipeline Overview

1. **Spec Kit CLI** collects the feature brief, dispatches the correct slash commands, and persists artifacts locally under `specs/{feature}`.
2. **BMAD agents** execute focused responsibilities (analysis, architecture, project management, development, and QA) to transform the inputs into progressively richer documentation and code.
3. **Agent OS** mirrors every artifact, enabling asynchronous review, approval, and follow-up actions across distributed teams.

The result is a repeatable flow that starts with a product idea and ends with verified implementation assets ready for deployment.

## Phase Breakdown

| Phase | Command | Inputs | Outputs | Role |
|--------|----------|---------|----------|------|
| Specify | `/specify` | feature brief | `spec.md` | Analyst |
| Plan | `/plan` | `spec.md` | `plan.md` | Architect |
| Tasks | `/tasks` | `spec.md` + `plan.md` | `tasks.md` | PM |
| Implement | `/implement` | `plan.md` + `tasks.md` | code / logs | Developer |
| Verify | `/verify` | all | QA report | QA |

Each command can be invoked independently, but the standard workflow runs them sequentially so downstream phases always receive the most up-to-date context.

## Running the Workflow via CLI

Use the workflow helper script to execute every phase in sequence:

```bash
npm run spec-workflow -- --feature="HelloWorld"
```

The script seeds the `feature` directory (for example, `specs/HelloWorld/`) with every phase output and leaves detailed logs under `.logs/` for auditing.

## Artifact Mirroring to Agent OS

Every phase writes to the local `specs/{feature}` directory and immediately mirrors its outputs to `.agent-os/product/{feature}`. Agent OS reads from this mirrored location to render real-time updates in its UI. If an artifact looks stale in Agent OS, check the matching files under `.agent-os/product/{feature}` to ensure mirroring completed successfully.

## Related Resources

- **Agent reference:** Review the agent responsibilities, prompts, and customization guidelines in the [Developer Guide](../internals/developer-guide.md#agents--commands).
- **Integration details:** Learn how the workflow synchronizes with Agent OS in the [Agent OS Integration Guide](../agentos-integration.md).

## Next Steps

- Dive into the [testing strategy](../testing.md) to understand how to validate changes locally and in automation.
- Review the [CI and deployment playbook](../../DEPLOYMENT.md) to keep the pipeline healthy after delivering new features.
