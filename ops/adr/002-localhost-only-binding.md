# ADR-002: Localhost-Only Binding Strategy

## Status
Accepted

## Date
2025-01-28

## Context
The claude-code-router server needs to bind to a network interface. We must decide whether to allow external access or restrict to localhost only.

## Decision
The router will bind exclusively to localhost (127.0.0.1) and will not accept connections from external networks.

## Implementation
✅ **Tested and Validated**: Configuration enforces localhost-only binding
- Router config specifies HOST: "127.0.0.1"
- Security verification confirms local-only access
- No external network exposure possible

## Rationale
- **Security**: Prevents external access to AI model endpoints
- **Network Isolation**: Eliminates network-based attack vectors
- **Developer Safety**: Ensures the router is only accessible from the local development machine
- **Compliance**: Meets security requirements for AI service access
- **Simplicity**: Reduces network configuration complexity

## Consequences
### Positive
- Enhanced security through network isolation
- No risk of accidental external exposure
- Simplified firewall and network configuration
- Reduced attack surface

### Negative
- Cannot be accessed from other machines on the network
- Limits certain development scenarios

## Related Decisions
- ADR-001: Security-First Router Configuration
- ADR-003: Provider Allowlist Implementation
