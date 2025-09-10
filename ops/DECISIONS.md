# Architecture Decision Records (ADRs) Index

This file tracks all architectural decisions made during the claude-code-router integration.

## ADR Index

### 2025-01-28
- **ADR-001**: [Security-First Router Configuration](adr/001-security-first-router-config.md)
- **ADR-002**: [Localhost-Only Binding Strategy](adr/002-localhost-only-binding.md)
- **ADR-003**: [Provider Allowlist Implementation](adr/003-provider-allowlist.md)

### 2025-09-09
- **ADR-004**: [Model Policy Enforcement Architecture](adr/004-model-policy-enforcement-architecture.md)

## Quick Reference

| ADR | Title | Status | Date |
|-----|-------|--------|------|
| 001 | Security-First Router Configuration | Accepted | 2025-01-28 |
| 002 | Localhost-Only Binding Strategy | Accepted | 2025-01-28 |
| 003 | Provider Allowlist Implementation | Accepted | 2025-01-28 |
| 004 | Model Policy Enforcement Architecture | Accepted | 2025-09-09 |

## Decision Categories

- **Security**: ADR-001, ADR-002, ADR-003, ADR-004
- **Configuration**: ADR-001, ADR-004
- **Network**: ADR-002
- **Access Control**: ADR-003
- **Policy Enforcement**: ADR-004

## Summary

All decisions prioritize security and compliance with organizational AI usage policies. The router integration enforces strict provider and network controls, while the model policy enforcement system ensures appropriate model usage based on task complexity. Together they provide comprehensive AI usage governance while maintaining developer usability.
