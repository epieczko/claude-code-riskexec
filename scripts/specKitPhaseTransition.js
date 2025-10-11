#!/usr/bin/env node

const { spawnSync } = require('child_process');

const ORDER = ['/specify', '/plan', '/tasks', '/implement'];

function main() {
  const autoEnabled = process.env.SPEC_KIT_AUTO_CHAIN === '1';
  if (!autoEnabled) {
    return;
  }

  const toolName = normalize(
    process.env.CLAUDE_TOOL_NAME || process.argv[2] || ''
  );
  const args = process.env.CLAUDE_TOOL_ARGUMENTS || process.argv[3] || '';
  if (!toolName) {
    return;
  }

  const nextCommand = getNextCommand(toolName);
  if (!nextCommand) {
    return;
  }

  const featureName = extractFirstArgument(args) || 'Feature-A';
  const cliBinary = process.env.CLAUDE_CLI || 'claude';

  console.log(
    `↪ Auto chaining ${toolName} → ${nextCommand} for ${featureName}`
  );
  const result = spawnSync(cliBinary, [nextCommand, featureName], {
    stdio: 'inherit',
    shell: false,
    env: process.env,
  });

  if (result.error) {
    console.error(`Failed to launch ${nextCommand}: ${result.error.message}`);
  }
}

function normalize(value) {
  return value.replace(/^Command:?/, '').trim();
}

function getNextCommand(current) {
  const index = ORDER.indexOf(current);
  if (index === -1 || index === ORDER.length - 1) {
    return null;
  }
  return ORDER[index + 1];
}

function extractFirstArgument(argString) {
  if (!argString) return '';
  const tokens = argString.match(/"([^"]+)"|[^\s]+/g);
  if (!tokens || !tokens.length) {
    return '';
  }
  const first = tokens[0];
  return first.replace(/^"|"$/g, '');
}

main();
