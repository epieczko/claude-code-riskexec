---
title: Developer Guide
lastUpdated: 2025-10-11
tags:
  - internals
  - onboarding
---

# Developer Guide

Welcome! This guide explains how the Claude Code RiskExec repository is organized and how to contribute effectively during the BMAD lifecycle.

## Repository Structure

- **`.claude/`** – Source of truth for the live Claude Code workspace. Agents, commands, hooks, and settings in this directory are what the CLI ships by default.
- **`cli-tool/components/`** – Template catalog consumed by `npx claude-code-riskexec`. Every agent/command here mirrors a `.claude` counterpart so it can be packaged for installation.
- **`specs/`** – Feature workspaces with Spec Kit artifacts (`spec.md`, `plan.md`, `tasks.md`, implementation notes) produced across the BMAD phases.
- **`docs/`** – Markdown documentation rendered on riskexec.com (Jekyll). Architecture references, standards, and internal guidelines live here.
- **`docu/`** – Docusaurus documentation source. Content mirrors `docs/` but is optimized for the interactive docs site.
- **`scripts/`** – Automation helpers (Spec Kit workflow runner, validators, analytics utilities).
- **`src/` & `tests/`** – Node.js CLI source code and supporting test suites.

## BMAD Phases in Practice

Each BMAD phase has matching agents and slash commands. When you add or modify a component:

1. **Specify** – Update `.claude/agents/bmad-team/analyst.md` (and CLI copy) when refining specification behavior.
2. **Plan** – Adjust the architect content and ensure `/plan` produces architecture decisions tied to the spec.
3. **Tasks** – Keep PM deliverables aligned with `specs/constitution.md`. Task templates should map every plan milestone.
4. **Implement** – Developer agent instructions should enforce testing, instrumentation, and evidence capture.
5. **Verify** – QA agents, `/verify`, `/test`, and `/lint` all represent quality gates before release.

For each change, confirm the matching entry in `cli-tool/components` is also updated so the packaged CLI stays in sync.

## Local Development Setup

1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Run the test suite**
   ```bash
   npm test
   ```
3. **Lint and type-check (optional)**
   ```bash
   npm run lint
   npm run build
   ```
4. **Preview docs**
   - Jekyll docs: `npm run docs:serve` (see `docs/README.md` for prerequisites).
   - Docusaurus site: `cd docu && npm install && npm run start`.

## Adding New Components

- **Agents & Commands** – Follow the templates in `cli-tool/components/` and include the `phase` metadata. Run `npm run generate:components` if you need to refresh the registry JSON files.
- **Docs** – Add new guides under `docs/architecture/`, `docs/usage/`, or `docs/internals/` and link them in [`docs/SUMMARY.md`](../SUMMARY.md).
- **Spec Kit Assets** – Store new feature folders under `specs/` with the constitution-compliant structure.

## Quality Checklist

- ✅ Every BMAD artifact references the constitution and upstream phase outputs.
- ✅ Commands document their phase alignment and include usage examples.
- ✅ Documentation has `lastUpdated` metadata and appears in the docs index.
- ✅ Tests and lint checks pass locally before opening a PR.

Happy building! Keeping these conventions in sync ensures the Spec Kit workflow stays deterministic for everyone using RiskExec.
