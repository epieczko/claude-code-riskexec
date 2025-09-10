---
sidebar_position: 6
---

# Claude Code Router Integration 🔄

**Claude Code Router** is a local proxy service that provides security controls and basic request routing for Claude Code interactions. It enforces strict provider and model restrictions while maintaining local-only operation.

## What is Claude Code Router?

The Claude Code Router is a security-focused proxy that:

- **Routes AI Requests**: Routes requests to Anthropic's Claude models based on simple configuration rules
- **Provides Security Controls**: Enforces approved provider and model restrictions with verification scripts
- **Enables Local Management**: Offers local configuration of AI model access
- **Maintains Compliance**: Ensures all interactions use only approved Anthropic models

## Router Architecture

### Core Components

#### 1. Router Configuration (`config.json`)
Central configuration file defining providers, models, and routing rules:

```json
{
  "HOST": "127.0.0.1",
  "APIKEY": "${CCR_APIKEY}",
  "LOG": true,
  "LOG_LEVEL": "info",
  "API_TIMEOUT_MS": 600000,
  "Providers": [
    {
      "name": "anthropic",
      "api_base_url": "https://api.anthropic.com/v1/messages",
      "api_key": "${ANTHROPIC_API_KEY}",
      "models": ["claude-3.7-sonnet", "claude-3.7-haiku"],
      "transformer": { "use": ["anthropic"] }
    }
  ],
  "Router": {
    "default": "anthropic,claude-3.7-sonnet",
    "background": "anthropic,claude-3.7-haiku",
    "think": "anthropic,claude-3.7-sonnet",
    "longContext": "anthropic,claude-3.7-sonnet",
    "longContextThreshold": 60000
  }
}
```

#### 2. Installation Script (`router-install.js`)
Automated configuration deployment:
- Copies router configuration to user home directory
- Preserves existing configurations to prevent overrides
- Provides setup instructions for environment variables
- Cross-platform compatibility (Windows/Unix)

#### 3. Verification Script (`router-verify.js`)
Security compliance enforcement:
- Validates approved providers (Anthropic only)
- Enforces allowed model restrictions
- Checks routing configuration integrity
- Prevents unauthorized provider usage

## Installation & Setup

### Quick Installation

Install and configure the router with npm scripts:

```bash
# Install router configuration
npm run router:install

# Verify security compliance
npm run router:verify

# Launch router in code mode
npm run router:code

# Launch router UI
npm run router:ui
```

### Manual Installation Steps

#### 1. Environment Setup

⚠️ **CRITICAL**: Never commit `~/.claude-code-router/config.json` to version control! This file contains API keys and should remain only on your local machine.

Configure required environment variables:

**Windows (PowerShell):**
```powershell
setx ANTHROPIC_API_KEY "your-anthropic-api-key"
setx CCR_APIKEY "your-local-router-secret"
```

**Unix/Linux/macOS:**
```bash
export ANTHROPIC_API_KEY="your-anthropic-api-key"
export CCR_APIKEY="your-local-router-secret"
```

#### 2. Configuration Installation
Run the installation script:

```bash
node ./scripts/router-install.js
```

**Output:**
```
Wrote /home/user/.claude-code-router/config.json

Set env vars before running the router:
  export ANTHROPIC_API_KEY="<your_key>"
  export CCR_APIKEY="<a_local_secret>"
```

#### 3. Security Verification
Verify configuration compliance:

```bash
node ./scripts/router-verify.js
```

**Output:**
```
Router config OK. Local routing only. Anthropic only. Allowed models only.
```

## Security Features

### Provider Restrictions

The verification script enforces strict security controls:

#### Approved Providers
```javascript
const allowedProviders = new Set(["anthropic"]);
const bannedProviders = new Set([
  "openrouter", 
  "iflow", 
  "volcengine", 
  "modelscope", 
  "dashscope"
]);
```

#### Model Restrictions
```javascript
const allowedModels = new Set([
  "claude-3.7-sonnet", 
  "claude-3.7-haiku"
]);
```

### Local-Only Operation

#### Network Security
- Router binds to localhost (127.0.0.1) only
- No external network exposure
- Local API key authentication required
- HTTPS connection to Anthropic API

## NPM Script Integration

### Available Commands

#### Setup & Configuration
```bash
# Install router configuration
npm run router:install

# Verify security compliance  
npm run router:verify
```

#### Router Operation
```bash
# Launch router in development mode
npm run router:code

# Launch router web interface
npm run router:ui
```

## Troubleshooting

### Common Issues

#### Configuration Problems
```bash
# Issue: Router config missing
Error: Router config missing at ~/.claude-code-router/config.json

# Solution:
npm run router:install
```

```bash
# Issue: Banned provider detected
Error: BANNED provider: openrouter

# Solution: Update config.json to use only 'anthropic' provider
```

#### Connection Issues
```bash
# Issue: API authentication failure
Error: Invalid API key for provider 'anthropic'

# Solution: Verify ANTHROPIC_API_KEY environment variable
echo $ANTHROPIC_API_KEY
```

---

**Related Documentation:**
- [Components Overview](./overview) - Understanding the component system
- [MCPs](./mcps) - Model Context Protocol integrations
- [Security Features](../safety-features) - Project security overview
