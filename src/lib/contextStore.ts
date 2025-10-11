import fs from 'fs/promises';
import path from 'path';
import { ensureDir, readFileIfExists, writeFileAtomic } from './files';

export interface Requirement {
  id: string;
  text: string;
  completed: boolean;
}

export interface TaskItem {
  id: string;
  title: string;
  completed: boolean;
  references: string[];
  notes: string[];
  raw: string;
}

export interface SpecContext {
  requirements: Requirement[];
  openQuestions: string[];
}

export interface PlanContext {
  architecture: string[];
  risks: string[];
}

export interface TaskContext {
  tasks: TaskItem[];
  progress: string;
}

export interface ContextEnvelope<T> {
  feature: string;
  phase: string;
  savedAt: string;
  data: T;
}

export interface SaveContextOptions {
  workspaceRoot?: string;
  syncToMemory?: boolean;
  memoryCommand?: string;
  runMcpCommand?: RunMcpCommand;
}

export interface LoadContextOptions {
  workspaceRoot?: string;
}

export type RunMcpCommand = (command: string, payload: unknown) => Promise<unknown>;

let registeredRunMcpCommand: RunMcpCommand | null = null;

export function registerRunMcpCommand(runner: RunMcpCommand | null): void {
  registeredRunMcpCommand = runner;
}

function resolveWorkspaceRoot(options?: { workspaceRoot?: string }): string {
  if (options?.workspaceRoot) {
    return options.workspaceRoot;
  }
  return process.env.SPEC_KIT_ROOT || process.cwd();
}

function resolveContextPath(feature: string, phase: string, workspaceRoot?: string): string {
  const root = resolveWorkspaceRoot({ workspaceRoot });
  return path.join(root, 'specs', feature, 'context', `${phase}.json`);
}

async function pushToMemory(
  command: string,
  payload: unknown,
  options?: SaveContextOptions
): Promise<void> {
  const runner = options?.runMcpCommand || registeredRunMcpCommand || (process.env.MEMORY_MCP_ENDPOINT ? defaultRunMcpCommand : null);
  if (!runner) {
    return;
  }
  await runner(command, payload);
}

async function defaultRunMcpCommand(command: string, payload: unknown): Promise<void> {
  const endpoint = process.env.MEMORY_MCP_ENDPOINT;
  if (!endpoint) {
    return;
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-mcp-command': command
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Memory MCP sync failed: ${response.status} ${response.statusText}`);
  }
}

export async function saveContext<T>(
  feature: string,
  phase: string,
  data: T,
  options?: SaveContextOptions
): Promise<string> {
  const targetPath = resolveContextPath(feature, phase, options?.workspaceRoot);
  const envelope: ContextEnvelope<T> = {
    feature,
    phase,
    savedAt: new Date().toISOString(),
    data
  };

  await writeFileAtomic(targetPath, `${JSON.stringify(envelope, null, 2)}\n`);

  const shouldSync = options?.syncToMemory ?? process.env.SPEC_KIT_MEMORY_SYNC === '1';
  if (shouldSync) {
    const command = options?.memoryCommand || process.env.MEMORY_MCP_COMMAND || 'memory.saveContext';
    try {
      await pushToMemory(command, envelope, options);
    } catch (error) {
      console.warn(`⚠️  Failed to sync context to Memory MCP: ${(error as Error).message}`);
    }
  }

  return targetPath;
}

export async function loadContextEnvelope<T>(
  feature: string,
  phase: string,
  options?: LoadContextOptions
): Promise<ContextEnvelope<T> | null> {
  const targetPath = resolveContextPath(feature, phase, options?.workspaceRoot);
  const content = await readFileIfExists(targetPath);
  if (!content) {
    return null;
  }

  try {
    const parsed = JSON.parse(content) as ContextEnvelope<T>;
    return parsed;
  } catch (error) {
    console.warn(`⚠️  Failed to parse context file ${targetPath}: ${(error as Error).message}`);
    return null;
  }
}

export async function loadContext<T>(
  feature: string,
  phase: string,
  options?: LoadContextOptions
): Promise<T | null> {
  const envelope = await loadContextEnvelope<T>(feature, phase, options);
  return envelope?.data ?? null;
}

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractSection(markdown: string, header: string): string | null {
  const pattern = new RegExp(`^##\\s+${escapeRegExp(header)}\\s*$`, 'im');
  const match = pattern.exec(markdown);
  if (!match) {
    return null;
  }
  const startIndex = match.index + match[0].length;
  const rest = markdown.slice(startIndex);
  const nextHeaderIndex = rest.search(/^##\s+/m);
  if (nextHeaderIndex === -1) {
    return rest.trim();
  }
  return rest.slice(0, nextHeaderIndex).trim();
}

function parseCheckboxList(section: string | null): Requirement[] {
  if (!section) {
    return [];
  }
  const lines = section.split(/\r?\n/);
  const requirements: Requirement[] = [];
  lines.forEach(line => {
    const match = line.match(/^-\s*\[( |x|X)\]\s*(.+)$/);
    if (match) {
      const completed = match[1].toLowerCase() === 'x';
      const text = match[2].trim();
      requirements.push({
        id: `req-${requirements.length + 1}`,
        text,
        completed
      });
    }
  });
  return requirements;
}

function parseList(section: string | null): string[] {
  if (!section) {
    return [];
  }
  return section
    .split(/\r?\n/)
    .map(line => line.replace(/^[-*+\d.\s]+/, '').trim())
    .filter(item => item.length > 0);
}

export function extractSpecContext(markdown: string): SpecContext {
  const requirements = parseCheckboxList(extractSection(markdown, 'Functional Requirements'));
  const openQuestionsSection = extractSection(markdown, 'Open Questions') || extractSection(markdown, 'Outstanding Questions');
  const openQuestions = parseList(openQuestionsSection);
  return { requirements, openQuestions };
}

export function extractPlanContext(markdown: string): PlanContext {
  const architectureSection =
    extractSection(markdown, 'Architecture Decisions') ||
    extractSection(markdown, 'Architecture');
  const risksSection =
    extractSection(markdown, 'Risks & Mitigations') ||
    extractSection(markdown, 'Risks');

  const architecture = parseList(architectureSection);
  const risks = parseList(risksSection);

  return { architecture, risks };
}

function parseTaskProgress(tasks: TaskItem[]): string {
  if (!tasks.length) {
    return '0/0 completed (0%)';
  }
  const completed = tasks.filter(task => task.completed).length;
  const percentage = Math.round((completed / tasks.length) * 100);
  return `${completed}/${tasks.length} completed (${percentage}%)`;
}

export function extractTaskContext(markdown: string): TaskContext {
  const lines = markdown.split(/\r?\n/);
  const tasks: TaskItem[] = [];
  let current: TaskItem | null = null;

  const flush = () => {
    if (current) {
      tasks.push(current);
      current = null;
    }
  };

  lines.forEach(line => {
    const checkboxMatch = line.match(/^-\s*\[( |x|X)\]\s*(.+)$/);
    if (checkboxMatch) {
      flush();
      const completed = checkboxMatch[1].toLowerCase() === 'x';
      const title = checkboxMatch[2].trim();
      current = {
        id: `task-${tasks.length + 1}`,
        title,
        completed,
        references: [],
        notes: [],
        raw: line.trim()
      };
      return;
    }

    if (!current) {
      return;
    }

    const referenceMatch = line.match(/^\s{2,}-\s*(.+)$/);
    if (referenceMatch) {
      current.references.push(referenceMatch[1].trim());
      return;
    }

    if (line.trim().length) {
      current.notes.push(line.trim());
    }
  });

  flush();

  const progress = parseTaskProgress(tasks);
  return { tasks, progress };
}

export async function ensureContextSetup(feature: string, workspaceRoot?: string): Promise<void> {
  const targetDir = path.dirname(resolveContextPath(feature, 'placeholder', workspaceRoot)).replace(/placeholder\.json$/, '');
  await ensureDir(targetDir);
}

export async function listStoredContexts(workspaceRoot?: string): Promise<string[]> {
  const root = resolveWorkspaceRoot({ workspaceRoot });
  const specsDir = path.join(root, 'specs');
  const entries = await fs.readdir(specsDir, { withFileTypes: true }).catch(() => []);
  const contexts: string[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }
    const feature = entry.name;
    const contextDir = path.join(specsDir, feature, 'context');
    const files = await fs.readdir(contextDir).catch(() => []);
    files
      .filter(file => file.endsWith('.json'))
      .forEach(file => {
        contexts.push(path.join(contextDir, file));
      });
  }

  return contexts;
}
