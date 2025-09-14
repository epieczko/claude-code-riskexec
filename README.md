[![npm version](https://img.shields.io/npm/v/claude-code-riskexec.svg)](https://www.npmjs.com/package/claude-code-riskexec)
[![npm downloads](https://img.shields.io/npm/dt/claude-code-riskexec.svg)](https://www.npmjs.com/package/claude-code-riskexec)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![GitHub stars](https://img.shields.io/github/stars/davila7/claude-code-riskexec.svg?style=social&label=Star)](https://github.com/davila7/claude-code-riskexec)



# Claude Code RiskExec (riskexec.com)

**Ready-to-use configurations for Anthropic's Claude Code.** A comprehensive collection of AI agents, custom commands, settings, hooks, external integrations (MCPs), and project templates to enhance your development workflow.

## Browse & Install Components and Templates

**[Browse All Templates](https://riskexec.com)** - Interactive web interface to explore and install 100+ agents, commands, settings, hooks, and MCPs.

<img width="1049" height="855" alt="Screenshot 2025-08-19 at 08 09 24" src="https://github.com/user-attachments/assets/e3617410-9b1c-4731-87b7-a3858800b737" />

## 🚀 Quick Installation

```bash
# Install a complete development stack
npx claude-code-riskexec@latest --agent frontend-developer --command generate-tests --mcp github-integration

# Browse and install interactively
npx claude-code-riskexec@latest

# Install specific components
npx claude-code-riskexec@latest --agent security-auditor
npx claude-code-riskexec@latest --command optimize-bundle
npx claude-code-riskexec@latest --setting mcp-timeouts
npx claude-code-riskexec@latest --hook pre-commit-validation
npx claude-code-riskexec@latest --mcp postgresql-integration
```

## What You Get

| Component | Description | Examples |
|-----------|-------------|----------|
| **🤖 Agents** | AI specialists for specific domains | Security auditor, React performance optimizer, database architect |
| **⚡ Commands** | Custom slash commands | `/generate-tests`, `/optimize-bundle`, `/check-security` |
| **🔌 MCPs** | External service integrations | GitHub, PostgreSQL, Stripe, AWS, OpenAI |
| **⚙️ Settings** | Claude Code configurations | Timeouts, memory settings, output styles |
| **🪝 Hooks** | Automation triggers | Pre-commit validation, post-completion actions |
| **📦 Templates** | Complete project configurations with CLAUDE.md, .claude/* files and .mcp.json | Framework-specific setups, project best practices |

## 🛠️ Additional Tools

Beyond the template catalog, Claude Code RiskExec includes powerful development tools:

### 📊 Claude Code Analytics
Monitor your AI-powered development sessions in real-time with live state detection and performance metrics.

```bash
npx claude-code-riskexec@latest --analytics
```

### 💬 Conversation Monitor  
Mobile-optimized interface to view Claude responses in real-time with secure remote access.

```bash
# Local access
npx claude-code-riskexec@latest --chats

# Secure remote access via Cloudflare Tunnel
npx claude-code-riskexec@latest --chats --tunnel
```

### 🔍 Health Check
Comprehensive diagnostics to ensure your Claude Code installation is optimized.

```bash
npx claude-code-riskexec@latest --health-check
```

## 📖 Documentation

**[📚 docs.riskexec.com](https://docs.riskexec.com/)** - Complete guides, examples, and API reference for all components and tools.

## Contributing

We welcome contributions! **[Browse existing templates](https://riskexec.com)** to see what's available, then check our [contributing guidelines](CONTRIBUTING.md) to add your own agents, commands, MCPs, settings, or hooks.

**Please read our [Code of Conduct](CODE_OF_CONDUCT.md) before contributing.**

## 🔗 Links

- **🌐 Browse Templates**: [riskexec.com](https://riskexec.com)
- **📚 Documentation**: [docs.riskexec.com](https://docs.riskexec.com)
- **💬 Community**: [GitHub Discussions](https://github.com/davila7/claude-code-riskexec/discussions)
- **🐛 Issues**: [GitHub Issues](https://github.com/davila7/claude-code-riskexec/issues)
