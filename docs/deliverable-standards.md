# Deliverable Standards

This document outlines the expectations for common RiskExec deliverables.

## API Specification (OpenAPI/AsyncAPI)
To be accepted, API specifications must:

1. **Reference the RiskExec API Guidelines** — Include a link to [`docs/standards/riskexec-api-guidelines.md`](./standards/riskexec-api-guidelines.md) and ensure the spec aligns with its REST and event-driven conventions (naming, versioning, pagination, error envelope, authentication, and lifecycle governance).
2. **Document versioning and lifecycle metadata** — Capture supported major versions, deprecation timelines, and SLAs inside the spec metadata.
3. **Describe authentication and authorization flows** — Detail OAuth scopes, token formats, and tenant isolation considerations.
4. **Provide pagination and filtering guidance** — Explain supported query parameters or cursor mechanics, plus deterministic sorting rules.
5. **Standardize error reporting** — Show example responses using the shared error envelope and note DLQ/error-topic handling for events.
6. **Supply examples and change history** — Include request/response samples, event payloads, and a changelog entry for the release.

Specifications that omit these checkpoints should be revised before submission.
