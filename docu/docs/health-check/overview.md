---
sidebar_position: 1
---

# Health Check Overview

The `claude-code-riskexec` CLI provides a comprehensive health check feature to validate your Claude Code configuration and system environment. This ensures that your setup is optimal for running Claude Code and helps identify any potential issues.

## Running the Health Check

You can run the comprehensive diagnostics on your Claude Code setup using the following command:

```bash
npx claude-code-riskexec --health-check
# or
npx claude-code-riskexec --health
# or
npx claude-code-riskexec --check
# or
npx claude-code-riskexec --verify
```

## What the Health Check Analyzes

The health check performs a complete system validation and configuration verification, including:

-   **System Requirements**: Validates your operating system, Node.js version, memory, and network connectivity.
-   **Claude Code Setup**: Verifies Claude Code installation, authentication, and permissions.
-   **Project Configuration**: Checks your project structure and configuration files, including `CLAUDE.md` files.
-   **Custom Commands**: Validates your custom slash commands and their syntax.
-   **Hooks Configuration**: Verifies the availability and correct configuration of your automation hooks.
-   **Interactive Results**: Provides real-time progress with immediate feedback and recommendations.
-   **Health Score**: Presents an overall system health percentage with actionable insights and performance optimization recommendations.
