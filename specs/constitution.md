# Spec Kit Constitution (Phase 1)

This constitution encodes the minimum quality bar for the Spec Kit workflow in Claude Code RiskExec.

## Global Principles

1. **Gated Progression** — Do not advance to the next phase until the prior artifact is reviewed and approved.
2. **Single Source of Truth** — Specs, plans, and task lists must be stored under `specs/<feature>/` and treated as canonical references.
3. **Traceability** — Every plan element and task must map back to one or more specification requirements.

## Phase Requirements

### Specify
- Specification documents must include overview, user stories, functional requirements, acceptance criteria, and open questions.
- Capture unresolved items explicitly under "Open Questions".

### Plan
- Architecture decisions must cite the related specification requirements they satisfy.
- Document validation strategy describing how acceptance criteria will be verified.

### Tasks
- Each task entry must identify the spec or plan sections it covers.
- Tasks should be small enough to complete within a single development session.

### Implement
- Implementation work must reference the relevant task ID(s) in commit messages.
- All new or updated code must be exercised by manual or automated checks before sign-off.

## Review Checklist

- [ ] Specification approved by Analyst & PM roles.
- [ ] Plan validated by Architect against the specification.
- [ ] Task list covers all plan sections and acceptance criteria.
- [ ] Implementation notes reference executed tests and QA review results.
