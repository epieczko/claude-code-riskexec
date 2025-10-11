#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const frontMatter = require('front-matter');

const componentsRoot = path.join(__dirname, '..', 'cli-tool', 'components');
const registryPath = path.join(componentsRoot, 'registry.json');

const errors = [];

function readComponent(relativePath) {
  const fullPath = path.join(componentsRoot, relativePath);
  if (!fs.existsSync(fullPath)) {
    errors.push(`Missing component file: ${relativePath}`);
    return null;
  }
  const raw = fs.readFileSync(fullPath, 'utf8');
  return { fullPath, raw, frontmatter: frontMatter(raw) };
}

function ensureNoExtraKeys(data, allowed, context) {
  Object.keys(data).forEach((key) => {
    if (!allowed.includes(key)) {
      errors.push(`${context} contains unsupported key \"${key}\"`);
    }
  });
}

const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));

const agentSkillSet = new Set();

Object.entries(registry.agents || {}).forEach(([agentName, relativePath]) => {
  const component = readComponent(relativePath);
  if (!component) return;
  const attrs = component.frontmatter.attributes;
  const context = `Agent ${agentName}`;
  const requiredAgentFields = ['name', 'description', 'phase', 'skill', 'model', 'tools'];
  requiredAgentFields.forEach((field) => {
    if (!attrs[field]) {
      errors.push(`${context} missing required frontmatter field \"${field}\"`);
    }
  });

  if (attrs.name !== agentName) {
    errors.push(`${context} frontmatter name \"${attrs.name}\" does not match registry key`);
  }

  if (attrs.tools && !Array.isArray(attrs.tools)) {
    errors.push(`${context} field \"tools\" must be an array`);
  }

  if (attrs.skill) {
    if (agentSkillSet.has(attrs.skill)) {
      errors.push(`Duplicate skill identifier detected: ${attrs.skill}`);
    } else {
      agentSkillSet.add(attrs.skill);
    }
  }

  ensureNoExtraKeys(
    attrs,
    ['name', 'description', 'phase', 'skill', 'model', 'tools', 'maxTokens', 'strict', 'color'],
    context
  );
});

Object.entries(registry.commands || {}).forEach(([commandName, relativePath]) => {
  const component = readComponent(relativePath);
  if (!component) return;
  const attrs = component.frontmatter.attributes;
  const context = `Command ${commandName}`;
  const requiredCommandFields = ['command', 'description', 'argument-hint', 'agent', 'phase'];
  requiredCommandFields.forEach((field) => {
    if (!attrs[field]) {
      errors.push(`${context} missing required frontmatter field \"${field}\"`);
    }
  });

  if (attrs.command && attrs.command !== `/${commandName}`) {
    errors.push(`${context} frontmatter command \"${attrs.command}\" does not match registry key`);
  }

  ['model', 'allowed-tools'].forEach((disallowed) => {
    if (attrs[disallowed]) {
      errors.push(`${context} should not define \"${disallowed}\"; configure it on the agent instead`);
    }
  });

  ensureNoExtraKeys(attrs, ['command', 'description', 'argument-hint', 'agent', 'phase'], context);

  if (attrs.agent && !registry.agents?.[attrs.agent]) {
    errors.push(`${context} references unknown agent ${attrs.agent}`);
  }

  if (attrs.agent && registry.agents?.[attrs.agent]) {
    const agentComponent = readComponent(registry.agents[attrs.agent]);
    if (agentComponent) {
      const agentPhase = agentComponent.frontmatter.attributes.phase;
      if (agentPhase && attrs.phase && agentPhase !== attrs.phase) {
        errors.push(
          `${context} phase \"${attrs.phase}\" does not match agent phase \"${agentPhase}\"`
        );
      }
    }
  }
});

const verifyCommand = registry.commands?.verify;
if (!verifyCommand) {
  errors.push('Registry is missing /verify command entry');
}

if (errors.length > 0) {
  console.error('BMAD component validation failed:\n - ' + errors.join('\n - '));
  process.exit(1);
}

console.log('BMAD component validation passed.');
