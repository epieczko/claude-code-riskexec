import path from 'path';
import { invokeAgent } from '../lib/invokeAgent';
import { ensureDir, readFileIfExists, writeFileAtomic } from '../lib/files';
import { PhaseHandler, PhaseResult, PhaseRunOptions } from './types';

export class TasksPhase implements PhaseHandler {
  public readonly phaseName = 'tasks';

  public async run(options: PhaseRunOptions): Promise<PhaseResult> {
    await ensureDir(options.featureDir);

    const specPath = path.join(options.featureDir, 'spec.md');
    const planPath = path.join(options.featureDir, 'plan.md');
    const tasksPath = path.join(options.featureDir, 'tasks.md');

    const spec = await readFileIfExists(specPath);
    const plan = await readFileIfExists(planPath);

    if (!spec) {
      throw new Error(`Missing specification at ${specPath}. Run the specify phase first.`);
    }
    if (!plan) {
      throw new Error(`Missing plan at ${planPath}. Run the plan phase before generating tasks.`);
    }

    const prompt = [
      'Break the plan into executable tasks with QA acceptance notes.',
      'Ensure each task traces back to specific requirements and architectural decisions.',
      'Use Markdown checklists and include QA/validation hooks for each item.',
      'Return the content for tasks.md.'
    ].join('\n\n');

    const contextFiles = [
      { path: specPath, label: 'Specification', optional: false },
      { path: planPath, label: 'Implementation Plan', optional: false },
      { path: tasksPath, label: 'Existing Task List', optional: true }
    ];

    const result = await invokeAgent({
      agent: 'bmad-pm',
      featureName: options.featureName,
      workspaceRoot: options.workspaceRoot,
      prompt,
      contextFiles,
      metadata: {
        phase: this.phaseName,
        featureDirectory: options.featureDir
      }
    });

    await writeFileAtomic(tasksPath, `${result.outputText.trim()}\n`);

    return {
      phase: this.phaseName,
      outputPath: tasksPath,
      details: {
        agentCommand: result.command
      }
    };
  }
}

export default TasksPhase;
