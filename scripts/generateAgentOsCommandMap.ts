import fs from 'fs/promises';
import path from 'path';
import { load as loadYaml } from 'js-yaml';
import { phaseRegistry } from '../src/phases/registry';

export interface AgentOsCommandMapEntry {
  agent: string;
  cliCommand: string;
  agentOsCommand: string;
  instruction: string;
  inputs: string[];
  output: string;
}

interface AgentOsWorkflowPhase {
  id: string;
  agent: string;
  command: string;
  instruction?: string;
  input?: string | string[];
  output?: string;
}

interface AgentOsWorkflow {
  phases?: AgentOsWorkflowPhase[];
}

function sortRecord<T>(record: Record<string, T>): Record<string, T> {
  return Object.fromEntries(
    Object.entries(record).sort(([a], [b]) => a.localeCompare(b))
  );
}

async function readCliCommands(
  commandsDir: string
): Promise<Record<string, string>> {
  const entries = await fs.readdir(commandsDir, { withFileTypes: true });
  const commandMap: Record<string, string> = {};

  for (const entry of entries) {
    if (entry.isFile() && entry.name.endsWith('.md')) {
      const commandName = entry.name.replace(/\.md$/, '');
      commandMap[commandName] = `/${commandName}`;
    }
  }

  return commandMap;
}

export async function buildAgentOsCommandMap(
  workspaceRoot = path.resolve(__dirname, '..')
): Promise<Record<string, AgentOsCommandMapEntry>> {
  const workflowPath = path.join(
    workspaceRoot,
    '.agent-os',
    'workflows',
    'spec_kit.yml'
  );
  const commandsDir = path.join(workspaceRoot, '.claude', 'commands');

  const [workflowSource, cliCommandMap] = await Promise.all([
    fs.readFile(workflowPath, 'utf8'),
    readCliCommands(commandsDir),
  ]);

  const workflow = loadYaml(workflowSource) as AgentOsWorkflow;
  const map: Record<string, AgentOsCommandMapEntry> = {};

  for (const phase of workflow.phases ?? []) {
    const registryEntry = phaseRegistry[phase.id];
    const cliCommand = cliCommandMap[phase.id] ?? `/${phase.id}`;
    const inputs = Array.isArray(phase.input)
      ? phase.input
      : phase.input
        ? [phase.input]
        : [];

    map[phase.id] = {
      agent: phase.agent,
      cliCommand,
      agentOsCommand: phase.command,
      instruction: phase.instruction ?? '',
      inputs,
      output: phase.output ?? registryEntry?.output ?? '',
    };
  }

  return sortRecord(map);
}

async function writeAgentOsCommandMap(): Promise<void> {
  const workspaceRoot = path.resolve(__dirname, '..');
  const map = await buildAgentOsCommandMap(workspaceRoot);
  const targetPath = path.join(workspaceRoot, '.agent-os', 'command-map.json');
  const payload = `${JSON.stringify(map, null, 2)}\n`;
  await fs.writeFile(targetPath, payload, 'utf8');
  // eslint-disable-next-line no-console
  console.log(`Agent OS command map written to ${targetPath}`);
}

if (require.main === module) {
  writeAgentOsCommandMap().catch((error) => {
    // eslint-disable-next-line no-console
    console.error('Failed to generate Agent OS command map:', error);
    process.exitCode = 1;
  });
}
