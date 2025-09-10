# ADR-001: Security-First Router Configuration

## Status
Accepted

## Date
2025-01-28

## Context
The claude-code-router integration requires a configuration approach that prioritizes security while maintaining functionality. Given the sensitive nature of AI model access and potential for misuse, we need strict controls on which providers and models can be accessed.

## Decision
We will implement a security-first approach to router configuration with the following principles:

1. **Default Deny**: All providers are blocked by default
2. **Explicit Allowlist**: Only anthropic provider is explicitly allowed
3. **Model Restrictions**: Only claude-3.7-sonnet and claude-3.7-haiku models are permitted
4. **Configuration Validation**: All configurations must pass security verification before use
5. **Banned Provider Detection**: Actively detect and block known unauthorized providers

## Rationale
- **Security**: Prevents unauthorized access to external AI providers
- **Compliance**: Ensures adherence to organizational AI usage policies
- **Cost Control**: Limits exposure to potentially expensive external providers
- **Audit Trail**: Provides clear tracking of which AI services are being used
- **Risk Mitigation**: Reduces risk of data leakage to unauthorized providers

## Implementation
✅ **Tested and Validated**: All security controls are working properly
- Router configuration enforces anthropic-only access
- Security verification script validates all restrictions
- Banned provider detection prevents unauthorized usage

## Consequences
### Positive
- Enhanced security posture
- Clear compliance with organizational policies
- Reduced risk of unauthorized AI provider usage
- Better cost control and monitoring

### Negative
- Reduced flexibility for developers wanting to use other providers
- Additional configuration complexity

## Related Decisions
- ADR-002: Localhost-Only Binding Strategy
- ADR-003: Provider Allowlist Implementation
