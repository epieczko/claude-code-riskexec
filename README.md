[![npm version](https://img.shields.io/npm/v/claude-code-riskexec.svg)](https://www.npmjs.com/package/claude-code-riskexec)
[![Test Coverage](https://img.shields.io/badge/coverage-84%25-brightgreen.svg)](coverage/lcov-report/index.html)
[![npm downloads](https://img.shields.io/npm/dt/claude-code-riskexec.svg)](https://www.npmjs.com/package/claude-code-riskexec)
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

| Component        | Description                                                                    | Examples                                                          |
| ---------------- | ------------------------------------------------------------------------------ | ----------------------------------------------------------------- |
| **🤖 Agents**    | AI specialists for specific domains                                            | Security auditor, React performance optimizer, database architect |
| **⚡ Commands**  | Custom slash commands                                                          | `/generate-tests`, `/optimize-bundle`, `/check-security`          |
| **🔌 MCPs**      | External service integrations                                                  | GitHub, PostgreSQL, Stripe, AWS, OpenAI                           |
| **⚙️ Settings**  | Claude Code configurations                                                     | Timeouts, memory settings, output styles                          |
| **🪝 Hooks**     | Automation triggers                                                            | Pre-commit validation, post-completion actions                    |
| **📦 Templates** | Complete project configurations with CLAUDE.md, .claude/\* files and .mcp.json | Framework-specific setups, project best practices                 |

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

### 🧭 Spec Kit Phase Automation

Phase 2 of the Spec Kit workflow introduces semi-automated handoffs between `/specify`, `/plan`, `/tasks`, `/implement`, and the new `/verify` QA review. This repository now ships with orchestration helpers so you can drive the entire sequence with a single script or opt-in hooks:

- `scripts/runSpecKitWorkflow.js` — Node-based runner that executes each command in order, runs constitution-aware validators after every phase, and optionally executes your test suite between implementation tasks. Launch it with `node scripts/runSpecKitWorkflow.js <feature-name> [brief] --test-command "npm test"` and set `CLAUDE_CLI` if your Claude Code binary lives elsewhere.
- `scripts/specKitPhaseTransition.js` — Lightweight hook target used by `.claude/hooks/post-tool.spec-kit-auto-chain.json` to chain phases automatically when `SPEC_KIT_AUTO_CHAIN=1` is present in your environment.
- `scripts/validators/*` — Specification, plan, and task validators that enforce constitution rules (required sections, traceability tags, ambiguous language checks, etc.). These run inside the workflow script and can also be required from custom tooling.

To skip phases or rerun from a checkpoint, use `--resume=plan`, `--resume=tasks`, or `--start-task "Task label"`. Pass `--skip-qa` if you want to defer the `/verify` pass. Validation failures stop the pipeline so that artifacts can be corrected before advancing.

## 🧱 Architecture at a Glance

Whether you're wiring up a new workflow or contributing templates, the BMAD (Specify → Plan → Tasks → Implement → Verify) phases
drive how this repository is organized:

- **Spec Kit deliverables** live under `specs/<feature>/` and are produced sequentially by the BMAD agents. Each phase handoff is encoded in the matching command (`/specify`, `/plan`, `/tasks`, `/implement`, `/verify`).
- **Agent and command source** sits in `.claude/` for live usage and in `cli-tool/components/` for CLI distribution. Frontmatter now includes a `phase` label so you can immediately identify where the component fits in the lifecycle.
- **Documentation** is cataloged in [`docs/SUMMARY.md`](docs/SUMMARY.md) and split across architecture, usage, and internals sections. Start with [`docs/internals/developer-guide.md`](docs/internals/developer-guide.md) for contributor onboarding and [`docs/architecture/Context_Architecture_Overview.md`](docs/architecture/Context_Architecture_Overview.md) for a deeper dive into system design.
- **Docusaurus site content** mirrors the repository docs under `docu/docs/`, making it easy to surface the same structure on [docs.riskexec.com](https://docs.riskexec.com/).

## 📖 Documentation

**[📚 docs.riskexec.com](https://docs.riskexec.com/)** - Complete guides, examples, and API reference for all components and tools.

## Contributing

We welcome contributions! **[Browse existing templates](https://riskexec.com)** to see what's available, then check our [contributing guidelines](CONTRIBUTING.md) to add your own agents, commands, MCPs, settings, or hooks.

## 🔗 Links

- **🌐 Browse Templates**: [riskexec.com](https://riskexec.com)
- **📚 Documentation**: [docs.riskexec.com](https://docs.riskexec.com)
- **💬 Community**: [GitHub Discussions](https://github.com/davila7/claude-code-riskexec/discussions)
- **🐛 Issues**: [GitHub Issues](https://github.com/davila7/claude-code-riskexec/issues)
