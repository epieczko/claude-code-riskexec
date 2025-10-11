import path from 'path';
import { invokeAgent } from '../lib/invokeAgent';
import { ensureDir, readFileIfExists, writeFileAtomic } from '../lib/files';
import { PhaseHandler, PhaseResult, PhaseRunOptions } from './types';

interface ParsedTask {
  index: number;
  label: string;
  raw: string;
}

function parseTasks(content: string): ParsedTask[] {
  const lines = content.split(/\r?\n/);
  const tasks: ParsedTask[] = [];
  lines.forEach(line => {
    const match = line.match(/^- \[[ xX]\]\s+(.*)$/);
    if (match) {
      const label = match[1].trim();
      tasks.push({
        index: tasks.length + 1,
        label,
        raw: line.trim()
      });
    }
  });
  return tasks;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export class ImplementPhase implements PhaseHandler {
  public readonly phaseName = 'implement';

  public async run(options: PhaseRunOptions): Promise<PhaseResult> {
    await ensureDir(options.featureDir);

    const specPath = path.join(options.featureDir, 'spec.md');
    const planPath = path.join(options.featureDir, 'plan.md');
    const tasksPath = path.join(options.featureDir, 'tasks.md');
    const implementationDir = path.join(options.featureDir, 'implementation');

    const spec = await readFileIfExists(specPath);
    const plan = await readFileIfExists(planPath);
    const tasksMarkdown = await readFileIfExists(tasksPath);

    if (!spec || !plan || !tasksMarkdown) {
      throw new Error('Implementation requires spec.md, plan.md, and tasks.md to be present.');
    }

    await ensureDir(implementationDir);

    const tasks = parseTasks(tasksMarkdown);
    if (!tasks.length) {
      throw new Error('No tasks found in tasks.md. Ensure the file contains checklist items.');
    }

    let startIndex = 0;
    if (options.resumeFromTask) {
      const resumeIndex = tasks.findIndex(task => task.label.includes(options.resumeFromTask as string));
      if (resumeIndex === -1) {
        throw new Error(`Unable to locate task containing "${options.resumeFromTask}".`);
      }
      startIndex = resumeIndex;
    }

    const logPaths: string[] = [];
    for (let i = startIndex; i < tasks.length; i += 1) {
      const task = tasks[i];
      const prompt = [
        `Execute the implementation work for task ${task.index}: ${task.label}.`,
        'Provide code changes, testing steps, and QA notes.',
        'Summarize validation evidence and next actions.'
      ].join('\n\n');

      const contextFiles = [
        { path: specPath, label: 'Specification', optional: false },
        { path: planPath, label: 'Implementation Plan', optional: false },
        { path: tasksPath, label: 'Task List', optional: false }
      ];

      const result = await invokeAgent({
        agent: 'bmad-developer',
        featureName: options.featureName,
        workspaceRoot: options.workspaceRoot,
        prompt,
        contextFiles,
        metadata: {
          phase: this.phaseName,
          taskLabel: task.label,
          taskIndex: String(task.index),
          taskTotal: String(tasks.length)
        }
      });

      const filename = `task-${task.index}-${slugify(task.label) || 'implementation'}.md`;
      const outputPath = path.join(implementationDir, filename);
      await writeFileAtomic(outputPath, `${result.outputText.trim()}\n`);
      logPaths.push(outputPath);
    }

    return {
      phase: this.phaseName,
      outputPath: implementationDir,
      logPaths,
      details: {
        tasksExecuted: logPaths.length
      }
    };
  }
}

export default ImplementPhase;
