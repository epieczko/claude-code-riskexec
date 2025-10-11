#!/usr/bin/env node

require('ts-node/register');

const fs = require('fs');
const path = require('path');
const YAML = require('yaml');
const { phaseRegistry } = require('../src/phases/registry');
const { createWorkflowLogger } = require('../src/lib/logger');

const logger = createWorkflowLogger();

function readWorkflowConfig() {
  const target = path.join(__dirname, '..', '.claude', 'workflow.yml');
  const content = fs.readFileSync(target, 'utf8');
  return YAML.parse(content);
}

function normalizeRegistryInputs(input) {
  if (!input) return [];
  const list = Array.isArray(input) ? input : [input];
  return list.map((entry) =>
    entry.includes('/') ? entry : `specs/{feature}/${entry}`
  );
}

function compareArrays(expected, actual) {
  if (expected.length !== actual.length) {
    return false;
  }
  return expected.every((value) => actual.includes(value));
}

function main() {
  const config = readWorkflowConfig();
  const yamlPhases = config.phases || [];
  const yamlMap = Object.fromEntries(
    yamlPhases.map((phase) => [phase.id, phase])
  );
  const registryPhases = Object.keys(phaseRegistry);
  const mismatches = [];

  registryPhases.forEach((phaseId, index) => {
    const registryEntry = phaseRegistry[phaseId];
    const yamlEntry = yamlMap[phaseId];
    if (!yamlEntry) {
      mismatches.push(`Phase "${phaseId}" missing from workflow.yml`);
      return;
    }
    const yamlIndex = yamlPhases.findIndex((phase) => phase.id === phaseId);
    if (yamlIndex !== index) {
      mismatches.push(
        `Phase order mismatch for "${phaseId}" (registry index ${index}, YAML index ${yamlIndex})`
      );
    }
    if (yamlEntry.agent !== registryEntry.agent) {
      mismatches.push(
        `Agent mismatch for "${phaseId}": registry=${registryEntry.agent}, yaml=${yamlEntry.agent}`
      );
    }
    if (yamlEntry.output !== registryEntry.output) {
      mismatches.push(
        `Output mismatch for "${phaseId}": registry=${registryEntry.output}, yaml=${yamlEntry.output}`
      );
    }
    const registryInputs = normalizeRegistryInputs(registryEntry.input);
    const yamlInputs = Array.isArray(yamlEntry.input)
      ? yamlEntry.input
      : yamlEntry.input
        ? [yamlEntry.input]
        : [];
    if (!compareArrays(registryInputs, yamlInputs)) {
      mismatches.push(
        `Input mismatch for "${phaseId}": registry=${registryInputs.join(', ') || 'none'}, yaml=${yamlInputs.join(', ') || 'none'}`
      );
    }
  });

  yamlPhases.forEach((phase) => {
    if (!phaseRegistry[phase.id]) {
      mismatches.push(`workflow.yml lists unknown phase "${phase.id}"`);
    }
  });

  if (mismatches.length) {
    mismatches.forEach((message) => logger.error(message));
    process.exitCode = 1;
    return;
  }

  logger.info('workflow.yml is in sync with phaseRegistry.');
}

main();
