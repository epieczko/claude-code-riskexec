# ADR-003: Provider Allowlist Implementation

## Status
Accepted

## Date
2025-01-28

## Context
The claude-code-router can potentially access multiple AI providers. We need a mechanism to control which providers are allowed while preventing access to unauthorized or potentially insecure providers.

## Decision
Implement a strict allowlist approach where:
1. Only explicitly approved providers are enabled
2. A banned providers list blocks known unauthorized services
3. Configuration validation enforces these restrictions
4. Runtime verification prevents bypassing of restrictions

## Implementation
✅ **Tested and Validated**: Provider restrictions working correctly
- Only anthropic provider enabled in configuration
- Banned provider list includes: openrouter, iflow, volcengine, modelscope, dashscope
- Security verification script validates provider compliance
- Model restrictions limited to claude-3.7-sonnet and claude-3.7-haiku

## Rationale
- **Explicit Control**: Clear visibility into which AI services are being used
- **Risk Mitigation**: Prevents accidental use of unauthorized providers
- **Compliance**: Ensures adherence to organizational AI usage policies
- **Cost Management**: Controls exposure to potentially expensive services
- **Security**: Reduces risk of data exposure to untrusted providers

## Security Validation Results
✅ **Provider Enforcement**: Only anthropic provider accessible  
✅ **Model Restrictions**: Only approved models available  
✅ **Banned Provider Detection**: Security script properly blocks unauthorized providers  
✅ **Configuration Validation**: All settings comply with security requirements  

## Consequences
### Positive
- Clear control over AI provider access
- Reduced security risk
- Better compliance tracking
- Cost predictability

### Negative
- Limited flexibility for experimentation
- Requires updates to allowlist for new approved providers

## Related Decisions
- ADR-001: Security-First Router Configuration
- ADR-002: Localhost-Only Binding Strategy
