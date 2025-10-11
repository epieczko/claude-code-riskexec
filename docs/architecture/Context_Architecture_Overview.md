# Context Architecture Overview

The Spec Kit workflow stores structured context between phases so later steps can
reuse important outputs without re-parsing markdown files. This document outlines
how context is generated, persisted, validated, and refreshed.

## Context Extraction

Each phase emits a markdown artifact (`spec.md`, `plan.md`, `tasks.md`).
Phase-specific extractors in `src/lib/contextStore.ts` derive structured data
from these artifacts:

- **Spec phase** → `SpecContext` captures the functional requirements list and
  any open questions identified during specification.
- **Plan phase** → `PlanContext` records architecture decisions and known risks
  from the implementation plan.
- **Tasks phase** → `TaskContext` tracks the detailed task checklist and
  aggregated progress metrics.

The extractors rely on predictable markdown headings (for example, “Functional
Requirements” or “Risks & Mitigations”). When a phase completes, the handler
saves the extracted context via `saveContext`, producing
`specs/<feature>/context/<phase>.json`.

## Persistence Envelope

Context files use a shared envelope that includes:

```json
{
  "feature": "Feature-A",
  "phase": "plan",
  "savedAt": "2024-01-01T00:00:00.000Z",
  "schemaVersion": 1,
  "data": { /* phase-specific context */ }
}
```

- `schemaVersion` tracks the structure of the saved payload. The current schema
  version is `1`; bump this when context shapes change. Loading code logs a
  warning if the stored version differs, making future migrations easier to
  detect.
- `saveContext` performs atomic writes and, when enabled, synchronizes the
  envelope with an external Memory MCP endpoint.

Context files are stored inside the feature directory so they persist across CLI
sessions and Git commits.

## Validation & Tooling

Run the TypeScript validator to ensure all stored contexts match the expected
shape:

```bash
npx ts-node scripts/validateContexts.ts
```

The script scans every `specs/*/context/*.json` file, verifies the envelope
metadata, enforces `schemaVersion` consistency, and validates each context
payload. Any discrepancies are reported with precise file and field locations.

## Memory MCP Integration

If the `SPEC_KIT_MEMORY_SYNC=1` environment variable is set, `saveContext`
invokes the configured Memory MCP endpoint (defaults to
`memory.saveContext`). The payload includes the full envelope, which allows
external services to archive, index, or augment long-term memory. Failures are
logged but do not interrupt the local workflow.

## Refreshing Context

Saved context reflects the markdown at the moment it was extracted. When the
underlying documents change manually, use the rebuild option to re-derive
context before downstream phases:

```bash
node -r ts-node/register src/workflowOrchestrator.ts --feature Feature-A --rebuild-context
```

Setting the environment variable `SPEC_KIT_REBUILD_CONTEXT=1` provides the same
behaviour. With rebuilding enabled, the orchestrator parses the latest
`spec.md`, `plan.md`, and `tasks.md` before each phase instead of trusting the
cached JSON.

## Regeneration Strategy

- Run the relevant phase again (e.g. re-run Specify) to refresh context
  automatically after significant edits.
- Use `--rebuild-context` when you need to reconcile manual markdown edits with
  downstream planning or implementation tasks without rerunning earlier phases.
- To start clean, delete the `context` directory for the feature; subsequent
  phase runs will regenerate context files.

Keeping context files validated and in sync helps every phase consume reliable
inputs while enabling optional long-term memory integrations.
