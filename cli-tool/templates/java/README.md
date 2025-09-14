# Java Templates

**Claude Code configuration template optimized for modern Java development**

This folder contains a Claude Code template designed for Java projects using common build tools and frameworks.

## 📁 What's in This Folder

### 📄 Files Included
- **`CLAUDE.md`** – Comprehensive Java development guidance for Claude Code
- **`README.md`** – This documentation file

### 🎯 Template Features
When you use this template with the installer, it automatically creates:
- **`.claude/settings.json`** – Optimized settings for Java projects
- **`.claude/commands/`** – Ready-to-use commands for common tasks

## 🚀 How to Use This Template

### Option 1: Automated Installation (Recommended)
Use the CLI installer to automatically set up this template in your project:

```bash
cd your-java-project
npx claude-code-riskexec --language java
```

The installer will:
- Copy the `CLAUDE.md` file to your project
- Create appropriate `.claude/` configuration files
- Set up common development commands

### Option 2: Manual Installation
Copy the template manually for more control:

```bash
# Clone the repository
git clone https://github.com/davila7/claude-code-riskexec.git

# Copy the Java template
cp claude-code-riskexec/cli-tool/templates/java/CLAUDE.md your-project/

# Then use the CLI to complete the setup
cd your-project
npx claude-code-riskexec --language java
```

## 🛠️ Commands Created by the Template

When installed, this template provides commands for:

### 🧪 Testing & Quality
- **`/test`** – Run unit tests with Maven or Gradle
- **`/lint`** – Run Checkstyle and SpotBugs

### 🔧 Development Tools
- **`/build`** – Build the project with Maven or Gradle
- **`/run`** – Run the application from the command line

## 📖 Learn More

- **Main Project**: [RiskExec](../../README.md)
- **Common Templates**: [Universal patterns](../common/README.md)

---

Ready to supercharge your Java development? Run `npx claude-code-riskexec --language java` in your project now!
