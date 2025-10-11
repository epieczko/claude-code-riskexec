# Workflow Guide

This guide aggregates the primary resources for running the Claude Code RiskExec BMAD workflows end-to-end.

- Review [`docs/architecture/Agent%20OS%20Integration.md`](docs/architecture/Agent%20OS%20Integration.md) for a detailed walkthrough of how Agent OS orchestrates the Spec Kit workflow and where mirrored artifacts live.
- Follow [`scripts/runSpecKitWorkflow.js`](scripts/runSpecKitWorkflow.js) to execute the Specify → Plan → Tasks → Implement → Verify pipeline locally, optionally mirroring results for Agent OS consumption.
- Use [`docs/agentos-integration.md`](docs/agentos-integration.md) when you need to regenerate the Agent OS command map, validate configuration files, or diagnose synchronization issues.

For additional automation patterns, see [`CONTRIBUTING.md`](CONTRIBUTING.md#-bmad-phase-workflow) and the workflow helpers listed in [`README.md`](README.md#-spec-kit-phase-automation).
