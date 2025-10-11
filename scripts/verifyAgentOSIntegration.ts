import fs from 'fs/promises';
import path from 'path';
import { load as loadYaml } from 'js-yaml';
import { phaseRegistry } from '../src/phases/registry';
import { AgentOsCommandMapEntry, buildAgentOsCommandMap } from './generateAgentOsCommandMap';

interface AgentOsWorkflowPhase {
  id: string;
  label?: string;
  agent: string;
  command: string;
  instruction?: string;
  input?: string | string[];
  output?: string;
}

interface AgentOsWorkflow {
  phases?: AgentOsWorkflowPhase[];
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return false;
    }
    throw error;
  }
}

function toArray<T>(value: T | T[] | undefined): T[] {
  if (!value) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

function compareCommandMaps(
  expected: Record<string, AgentOsCommandMapEntry>,
  actual: Record<string, AgentOsCommandMapEntry>
): string[] {
  const errors: string[] = [];

  const expectedKeys = Object.keys(expected).sort();
  const actualKeys = Object.keys(actual).sort();

  if (expectedKeys.join('|') !== actualKeys.join('|')) {
    errors.push(
      `Command map phase mismatch. Expected phases [${expectedKeys.join(', ')}] but found [${actualKeys.join(', ')}].`
    );
  }

  for (const key of expectedKeys) {
    const expectedEntry = expected[key];
    const actualEntry = actual[key];
    if (!actualEntry) {
      continue;
    }

    const serializedExpected = JSON.stringify(expectedEntry);
    const serializedActual = JSON.stringify(actualEntry);
    if (serializedExpected !== serializedActual) {
      errors.push(`Command map entry for phase "${key}" is out of date.`);
    }
  }

  return errors;
}

export async function verifyAgentOsIntegration(): Promise<void> {
  const workspaceRoot = path.resolve(__dirname, '..');
  const workflowPath = path.join(workspaceRoot, '.agent-os', 'workflows', 'spec_kit.yml');
  const commandMapPath = path.join(workspaceRoot, '.agent-os', 'command-map.json');
  const instructionsRoot = path.join(workspaceRoot, '.agent-os', 'instructions');

  const [workflowSource, commandMapSource, generatedCommandMap] = await Promise.all([
    fs.readFile(workflowPath, 'utf8'),
    fs.readFile(commandMapPath, 'utf8'),
    buildAgentOsCommandMap(workspaceRoot)
  ]);

  const workflow = loadYaml(workflowSource) as AgentOsWorkflow;
  const commandMap = JSON.parse(commandMapSource) as Record<string, AgentOsCommandMapEntry>;

  const errors: string[] = [];
  const warnings: string[] = [];

  for (const phase of workflow.phases ?? []) {
    const registryEntry = phaseRegistry[phase.id];
    if (!registryEntry) {
      errors.push(`Phase "${phase.id}" from Agent OS workflow is missing from phaseRegistry.`);
      continue;
    }

    if (registryEntry.agent !== phase.agent) {
      errors.push(
        `Agent mismatch for phase "${phase.id}": workflow=${phase.agent}, registry=${registryEntry.agent}.`
      );
    }

    if (phase.output && registryEntry.output && phase.output !== registryEntry.output) {
      errors.push(
        `Output mismatch for phase "${phase.id}": workflow=${phase.output}, registry=${registryEntry.output}.`
      );
    }

    const expectedInputs = Array.isArray(registryEntry.input)
      ? registryEntry.input
      : registryEntry.input
      ? [registryEntry.input]
      : [];
    const workflowInputs = toArray(phase.input);
    for (const input of expectedInputs) {
      const hasMatch = workflowInputs.some(candidate => candidate.endsWith(input));
      if (!hasMatch) {
        errors.push(
          `Input "${input}" from phaseRegistry missing in Agent OS workflow phase "${phase.id}".`
        );
      }
    }

    const mapEntry = commandMap[phase.id];
    if (!mapEntry) {
      errors.push(`Command map missing entry for phase "${phase.id}".`);
      continue;
    }

    if (mapEntry.agentOsCommand !== phase.command) {
      errors.push(
        `Command mismatch for phase "${phase.id}": workflow=${phase.command}, command-map=${mapEntry.agentOsCommand}.`
      );
    }

    if (!mapEntry.cliCommand.startsWith('/')) {
      errors.push(`CLI command for phase "${phase.id}" must start with '/'.`);
    }

    const cliCommandName = mapEntry.cliCommand.replace(/^\//, '');
    if (!(await fileExists(path.join(workspaceRoot, '.claude', 'commands', `${cliCommandName}.md`)))) {
      errors.push(
        `CLI command file for phase "${phase.id}" not found: .claude/commands/${cliCommandName}.md.`
      );
    }

    if (mapEntry.instruction) {
      const instructionPath = path.join(instructionsRoot, mapEntry.instruction);
      if (!(await fileExists(instructionPath))) {
        errors.push(
          `Instruction file for phase "${phase.id}" missing: .agent-os/instructions/${mapEntry.instruction}.`
        );
      }
    } else {
      warnings.push(`Phase "${phase.id}" has no instruction mapping.`);
    }
  }

  errors.push(...compareCommandMaps(generatedCommandMap, commandMap));

  const extraEntries = Object.keys(commandMap).filter(
    phaseId => !(workflow.phases ?? []).some(phase => phase.id === phaseId)
  );
  for (const extra of extraEntries) {
    warnings.push(`Command map contains unused phase "${extra}".`);
  }

  if (warnings.length) {
    // eslint-disable-next-line no-console
    console.warn('Agent OS integration warnings:');
    for (const warning of warnings) {
      // eslint-disable-next-line no-console
      console.warn(`  • ${warning}`);
    }
  }

  if (errors.length) {
    // eslint-disable-next-line no-console
    console.error('Agent OS integration errors:');
    for (const error of errors) {
      // eslint-disable-next-line no-console
      console.error(`  • ${error}`);
    }
    throw new Error('Agent OS integration verification failed.');
  }

  // eslint-disable-next-line no-console
  console.log('Agent OS integration verification passed.');
}

if (require.main === module) {
  verifyAgentOsIntegration().catch(error => {
    // eslint-disable-next-line no-console
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
