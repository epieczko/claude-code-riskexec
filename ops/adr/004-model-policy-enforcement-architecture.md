# ADR-004: Model Policy Enforcement Architecture

## Status
Accepted

## Date
2025-09-09

## Context
The Claude Code RiskExec system needed a comprehensive model policy enforcement mechanism to ensure consistent model usage across all agents and commands. Without proper enforcement, agents could use inappropriate models for their complexity level or bypass organizational AI usage policies.

## Decision
We implemented a multi-layer model policy enforcement system with three complementary approaches:

### 1. Registry-Based Model Mapping
- **Registry File**: `.claude/registry.json` contains skill-to-default-model mappings
- **Skill Classification**: Skills are categorized by complexity
  - Complex agents (agent.expert, command.expert, etc.) → claude-3.7-sonnet
  - Simple commands (lint.command, test.command) → claude-3.7-haiku
- **Override Support**: Front matter can override registry defaults

### 2. Static Policy Validation
- **Validation Script**: `scripts/model-policy-check.js` validates all markdown files
- **Front Matter Requirements**: All agents/commands must declare `skill` and `model`
- **Allowed Models**: Enforces allowlist of `claude-3.7-sonnet` and `claude-3.7-haiku`
- **npm Integration**: `npm run policy:models` for CI/CD integration

### 3. Runtime Enforcement
- **Pre-tool Hook**: `.claude/hooks/pre-tool.enforce-model.json` runs before execution
- **Runtime Validation**: Prevents execution with invalid configurations
- **Fail-Fast**: Immediately blocks non-compliant model usage

## Consequences

### Positive
- **Consistent Model Usage**: Prevents inappropriate model selection
- **Cost Control**: Ensures expensive models used only for complex tasks
- **Policy Compliance**: Enforces organizational AI usage policies
- **Developer Guidance**: Clear skill-to-model mappings guide development
- **CI/CD Integration**: Automated validation in build pipelines
- **Multi-layer Safety**: Three independent enforcement mechanisms

### Negative
- **Configuration Overhead**: Requires front matter in all agent files
- **Build Complexity**: Additional validation steps in development workflow
- **Dependency Addition**: front-matter npm package required
- **Maintenance**: Registry and validation rules need updates for new models

## Implementation Notes
- All existing agents and commands updated with proper front matter
- Registry defaults chosen based on agent complexity analysis
- Validation script uses front-matter library for reliable parsing
- Hook system integrates with existing Claude Code infrastructure
- Testing validated all three enforcement layers work correctly

## Related Decisions
- Builds on ADR-001 (Security-First Router Configuration)
- Complements ADR-003 (Provider Allowlist Implementation)
- Aligns with router-level model restrictions

## Future Considerations
- Registry could be extended with additional metadata (cost, performance)
- Policy validation could include prompt length limits
- Runtime enforcement could log model usage statistics
- Integration with external policy management systems possible
