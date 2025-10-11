import { spawnSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export interface AgentContextFile {
  path: string;
  label?: string;
  optional?: boolean;
}

export interface InvokeAgentOptions {
  agent: string;
  featureName: string;
  workspaceRoot: string;
  prompt: string;
  contextFiles?: AgentContextFile[];
  metadata?: Record<string, string | undefined>;
  dryRun?: boolean;
}

export interface InvokeAgentResult {
  ok: boolean;
  outputText: string;
  raw?: string;
  command?: string;
}

function formatContextSection(label: string, content: string): string {
  return [`## ${label}`, '```markdown', content.trim(), '```', ''].join('\n');
}

async function readContextFiles(
  files: AgentContextFile[] | undefined
): Promise<string> {
  if (!files || !files.length) {
    return '';
  }

  const sections: string[] = [];
  for (const file of files) {
    try {
      const resolved = path.resolve(file.path);
      const content = await fs.readFile(resolved, 'utf8');
      sections.push(
        formatContextSection(file.label || path.basename(resolved), content)
      );
    } catch (error) {
      if (!file.optional) {
        throw new Error(
          `Failed to load context file ${file.path}: ${(error as Error).message}`
        );
      }
    }
  }

  return sections.join('\n');
}

function buildPrompt(options: InvokeAgentOptions, context: string): string {
  const metadataEntries = Object.entries(options.metadata || {})
    .filter(([, value]) => Boolean(value))
    .map(([key, value]) => `- ${key}: ${value}`);

  const header = [`# Feature: ${options.featureName}`];
  if (metadataEntries.length) {
    header.push('## Metadata', ...metadataEntries, '');
  }

  const promptSection = [`## Task`, options.prompt.trim(), ''];

  return [...header, context, ...promptSection].join('\n');
}

function runCli(agent: string, payloadPath: string): InvokeAgentResult {
  const cliBinary = process.env.CLAUDE_CLI || 'claude';
  const args = ['--agent', agent, '--input-file', payloadPath, '--quiet'];
  const command = `${cliBinary} ${args.join(' ')}`;
  const result = spawnSync(cliBinary, args, {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: process.env,
    encoding: 'utf8',
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    const stderr = (result.stderr || '').trim();
    throw new Error(
      `Agent invocation failed (${result.status}): ${stderr || 'unknown error'}`
    );
  }

  const output = (result.stdout || '').trim();
  return {
    ok: true,
    outputText: output,
    raw: output,
    command,
  };
}

export async function invokeAgent(
  options: InvokeAgentOptions
): Promise<InvokeAgentResult> {
  const executor = process.env.SPEC_KIT_AGENT_EXECUTOR || 'cli';
  const context = await readContextFiles(options.contextFiles);
  const prompt = buildPrompt(options, context);

  if (options.dryRun || executor === 'noop') {
    return {
      ok: true,
      outputText: prompt,
      raw: prompt,
      command: 'noop',
    };
  }

  const tempFile = path.join(
    os.tmpdir(),
    `spec-kit-${Date.now()}-${Math.random().toString(16).slice(2)}.md`
  );
  await fs.writeFile(tempFile, prompt, 'utf8');

  try {
    if (executor === 'mock') {
      return {
        ok: true,
        outputText: `# Mock response from ${options.agent}\n\n${prompt}`,
        raw: prompt,
        command: 'mock',
      };
    }

    return runCli(options.agent, tempFile);
  } finally {
    await fs.unlink(tempFile).catch(() => undefined);
  }
}
