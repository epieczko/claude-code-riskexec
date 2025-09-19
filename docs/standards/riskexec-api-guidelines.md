# RiskExec API Guidelines

RiskExec standardizes REST and event-driven interfaces through the conventions captured in this guideline. It exists as the authoritative playbook for API-first delivery, interface review, implementation, and ongoing operations. Each section establishes the requirements teams must follow when designing, building, and evolving APIs for the RiskExec platform.

## How to Use This Guide
- **Read as a contract.** Each section below captures the required MUST/SHOULD/MAY expectations while clarifying RiskExec adaptations.
- **Annotate specifications.** OpenAPI and AsyncAPI documents must reference the relevant checkpoints here and document any conscious deviations.
- **Governance-ready.** The RiskExec API Architecture Review Board (ARB) enforces these expectations during design reviews, release approvals, and operational audits.
- **Lifecycle aware.** Deprecation, compatibility, testing, and documentation duties remain in effect for every shipped interface, internal or external.

---

## 1. Introduction
- Build independently deployable microservices that expose functionality through HTTP/REST and JSON payloads.
- Recognize APIs as core business assets that require long-lived quality, stability, and consumer trust.
- Maintain platform thinking: services must be reusable and composable by multiple product teams.

## 2. API Design Principles
- Prefer RESTful APIs with JSON payloads; embrace hypermedia selectively (e.g., pagination links) when it adds clarity.
- Apply Postel’s Law: accept tolerant inputs while emitting conservative, well-defined outputs.
- Treat APIs as products: empathize with consumers, optimize usability, measure success with adoption metrics, and iterate with feedback loops.
- Practice API First: design in OpenAPI/AsyncAPI before coding, solicit peer reviews early, and separate “what” from “how.”
- Favor evolutionary design: iterate with learning cycles, run contract tests, and codify patterns in reusable toolchains.
- Promote autonomy with alignment: teams may choose implementation stacks but must converge on shared interface patterns, guidelines, and reusable components.

## 3. General Delivery Guidelines
- **API First workflow**: capture contracts in version-controlled specs, run collaborative reviews, and provide self-service discovery catalogs.
- **Design for long-term compatibility**: minimize breaking changes, prefer additive evolution, and version intentionally.
- **Documentation discipline**: maintain changelogs, migration guides, and integration playbooks alongside specs.
- **Workload separation**: isolate read and write concerns when beneficial, provide asynchronous alternatives, and avoid leaking internal architecture into API design.
- **Consistency**: align naming, pagination, filtering, error handling, and security semantics across teams.
- **Extensibility**: use vendor extensions (`x-` fields) to encode RiskExec-specific metadata without breaking broader compatibility.

## 4. Meta Information & Governance
- Populate specification `info` blocks fully (title, version, description, terms of service, contact, license).
- Provide owner metadata (domain group, squad, on-call rotations) and risk classifications.
- Document SLAs (availability, latency, throughput) and support hours inside `x-riskexec` extensions.
- Publish service dependencies, data retention, and privacy annotations; include data classification labels.
- Ensure discoverability through central catalogs (e.g., Backstage) with synchronized metadata.

## 5. Security
- Enforce HTTPS everywhere; disable insecure protocols and weak cipher suites.
- Adopt OAuth 2.0 with JWT access tokens as baseline; describe scopes, token lifetimes, and refresh flows.
- Support least-privilege by defining granular scopes (`riskexec.<domain>.<permission>`), reinforce mutual TLS for service-to-service calls when required, and document certificate rotation procedures.
- Avoid exposing sensitive data unintentionally; mask secrets in logs and responses, and mark fields requiring encryption at rest or in transit.
- Implement rate limiting, throttling, and abuse prevention; document quotas and error semantics.
- Comply with auditability requirements: propagate correlation IDs, log security events, and integrate with RiskExec SIEM pipelines.

## 6. Data Formats
- Use UTF-8 encoded JSON as the default payload representation.
- Where alternate formats (CSV, XML, Avro, Protobuf) are required, negotiate via `Accept`/`Content-Type` headers and document the schema.
- Represent dates with ISO 8601 / RFC 3339 timestamps, durations with ISO 8601, identifiers with UUIDs or well-defined opaque tokens.
- Provide localization guidance for numbers, currencies, and percentages; avoid locale-specific formatting in APIs.
- Treat binary data via base64 or signed URLs rather than embedding raw bytes in JSON.
- Reference shared schemas for enums, money, addresses, and pagination envelopes to maximize reuse.

## 7. URL and Resource Modelling
- Use lowercase kebab-case for path segments; reserve plural nouns for collections and singular identifiers for instances.
- Keep paths stable and hierarchical; avoid verbs except for RPC-style fallbacks under `/commands` or `/actions`.
- Encode identifiers without business semantics; avoid exposing internal surrogate keys that may leak logic.
- Provide canonical base URLs per deployment stage (prod, staging) and ensure trailing slash behavior is consistent (no trailing slash for resource endpoints by default).
- Keep query parameters for filtering, pagination, and sparse fieldsets; prefer matrix parameters only when justified by the specification.
- Avoid path versioning beyond major segments (e.g., `/v1/`); rely on content negotiation sparingly.

## 8. JSON Representation Guidelines
- Use camelCase for property names, snake_case only when interoperating with legacy systems.
- Expose consistent envelope structures (`data`, `items`, `links`, `meta`) for collections and responses requiring metadata.
- Explicitly type fields; avoid ambiguous null vs. missing semantics—document defaults and optionality.
- Keep boolean fields positive (e.g., `isActive` instead of `notActive`).
- Represent amounts as objects when multiple dimensions are present (e.g., `{ "amount": "10.00", "currency": "USD" }`).
- Prevent unpredictable ordering—clients must not rely on JSON object ordering.
- Provide examples and JSON Schema definitions for reuse and validation.

## 9. HTTP Requests & Methods
- Support safe/idempotent semantics: GET (safe), PUT/DELETE (idempotent), POST/PATCH (non-idempotent by default).
- Use standard methods (GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD); avoid custom verbs.
- Honor conditional requests via `If-Match`, `If-None-Match`, `If-Modified-Since` using ETags for optimistic locking.
- Accept partial updates with `PATCH` using JSON Merge Patch or JSON Patch; document the chosen format.
- Provide asynchronous processing patterns via 202 Accepted + status endpoints or event notifications.
- Document request size limits, timeouts, and client retry expectations.
- Support idempotency keys for POST operations that create resources.

## 10. HTTP Status Codes & Error Handling
- Use standard status codes precisely: 2xx success, 4xx client errors, 5xx server errors.
- Provide rich error bodies following RFC 7807 (Problem Details) or the RiskExec error envelope (which includes type, title, status, detail, instance, correlationId, and optional field errors).
- Reserve 202 + polling for asynchronous operations; 207, 422, 429, and 503 should be applied according to the documented semantics in this guide.
- Include machine-readable error codes, documentation links, and remediation hints.
- Ensure business rule violations use 409 Conflict or 422 Unprocessable Entity appropriately.

## 11. HTTP Headers
- Support standard negotiation headers (`Accept`, `Content-Type`, `Accept-Language`, `Accept-Encoding`).
- Use `Prefer`, `Range`, and `Content-Range` when partial responses are available.
- Emit caching headers (`ETag`, `Last-Modified`, `Cache-Control`, `Expires`) consistent with resource mutability.
- Propagate correlation identifiers via `X-Correlation-ID` and ensure they are logged and returned in error envelopes.
- Avoid inventing custom headers; when necessary, prefix with `X-` only if no standard alternative exists, and document thoroughly.

## 12. Hypermedia
- Provide pagination links (`self`, `next`, `prev`, `first`, `last`) where applicable.
- Use URI templates (RFC 6570) sparingly to express follow-up operations.
- Document link relations using IANA-registered or well-defined custom relation types.
- Consider hypermedia to surface available state transitions while acknowledging RiskExec’s pragmatic REST level (selective HATEOAS usage).

## 13. Performance
- Optimize payload size with field projections and compression (`gzip`, `br`).
- Support caching via appropriate headers and evaluate CDN compatibility.
- Document SLAs for latency, throughput, and concurrency; ensure autoscaling policies align with expectations.
- Provide bulk operations or asynchronous alternatives for high-volume use cases.
- Measure and log performance metrics (percentiles, error rates) for ARB review.

## 14. Pagination
- Offer cursor-based pagination for large datasets; include `cursor` tokens and stable sort orders.
- Provide limit/offset as baseline but document default and maximum values; ensure deterministic ordering.
- Return metadata (`total`, `count`, `hasMore`) when feasible.
- For streaming/event feeds, supply replay tokens, watermark timestamps, and idempotent sequencing guidance.

## 15. Compatibility
- Maintain backwards compatibility; introduce breaking changes only with major version increments and migration plans.
- Follow additive change rules: only add optional fields, new resources, or new enum values after announcing to consumers.
- Document and test fallback behavior for unknown fields and forward compatibility.
- Version event schemas and REST APIs independently, documenting compatibility matrices.

## 16. Deprecation
- Publish deprecation notices with clear timelines (minimum 6-month sunsetting window for RiskExec).
- Use `Deprecation` and `Sunset` headers where appropriate; update documentation and changelogs simultaneously.
- Provide migration guides, sample payload diffs, and communication plans for affected consumers.
- Track deprecation progress via ARB dashboards.

## 17. API Operations
- Provide onboarding support, SLAs, and operational contacts.
- Establish monitoring (metrics, logs, traces), alerting thresholds, and runbooks.
- Ensure disaster recovery plans, rate limiting configurations, and capacity testing are documented.
- Supply sandbox environments with representative data sets.
- Automate contract testing, integration tests, and smoke tests as part of CI/CD.

## 18. Events
- Treat events as first-class interfaces with AsyncAPI definitions.
- Name event types using `<domain>.<aggregate>.<action>`; version payloads thoughtfully.
- Document delivery guarantees (at-least-once baseline), ordering expectations, and retry/dlq behaviors.
- Use CloudEvents-compatible envelopes when integrating with platform messaging.
- Provide schema evolution guidance mirroring REST compatibility rules.
- Publish event catalogs, consumer onboarding steps, and monitoring expectations (lag metrics, replay procedures).

## 19. References
- Maintain a library of reusable schema fragments, link relations, and error codes.
- Cite external standards (RFCs, ISO specifications) relevant to fields and protocols.
- Keep reference links up to date inside the documentation portal.

## 20. Tooling
- Use shared linters, code generators, and documentation pipelines to enforce guideline compliance (e.g., Spectral, AsyncAPI validators, schema registries).
- Automate style checks (naming, pagination params, error envelopes) via CI.
- Provide developer tooling for mocking, contract testing, and documentation previews.
- Align with Backstage or equivalent catalog for spec publishing and lifecycle badges.

## 21. Best Practices
- Publish runnable examples, SDKs, and snippets to accelerate integration.
- Encourage consumer-driven contracts to capture expectations and detect regressions early.
- Share migration stories, architecture decision records, and anti-pattern retrospectives.
- Foster community by hosting design reviews, brown bags, and maintaining FAQ documents.

## 22. Changelog Management
- Record every guideline-relevant change in versioned changelogs with timestamps and authors.
- Communicate releases via platform announcements and update templates referencing this guide.
- Maintain historical versions to aid audits and compliance reviews.

## 23. RiskExec-Specific Augmentations
- **Authentication & Authorization**: OAuth 2.0 client credentials by default, with optional JWT bearer or mTLS for internal services; document fallback flows.
- **Error Envelope**: Standardize on the JSON structure introduced above, embedding correlation IDs and optional remediation links.
- **Lifecycle Governance**: ARB reviews specs before implementation, monitors compatibility contracts, and enforces deprecation policy adherence.
- **Compliance Hooks**: Tag personally identifiable information (PII), financial data, and retention requirements in schema annotations.
- **Monitoring & Observability**: Emit metrics conforming to RiskExec Observability SLO framework (`request.count`, `request.latency`, `error.rate`, `event.lag`).
- **Operational Readiness**: Provide incident escalation paths, playbooks, chaos test results, and data residency statements.

## 24. Implementation Checklist
- [ ] Specification reviewed and approved under API First workflow.
- [ ] Authentication, authorization, and rate limiting documented per Section 5.
- [ ] Request/response payloads validated against Section 6–10 conventions.
- [ ] Pagination, filtering, and sorting options implemented per Section 14.
- [ ] Compatibility strategy and versioning documented per Sections 15–16.
- [ ] Async interactions follow Section 18 (events) and include DLQ/backoff documentation.
- [ ] Monitoring, logging, and alerting hooks instrumented per Section 17.
- [ ] Changelog entry published referencing impacted consumers.
- [ ] RiskExec extensions (`x-riskexec`) completed with owner, SLA, data classification, and compliance fields.

By following this playbook, every RiskExec API honors the platform, security, and lifecycle requirements established for the organization.
