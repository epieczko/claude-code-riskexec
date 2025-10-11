import path from 'path';
import { invokeAgent } from '../lib/invokeAgent';
import { ensureDir, readFileIfExists, writeFileAtomic } from '../lib/files';
import { mirrorAgentOsFile } from '../lib/agentOs';
import { extractTaskContext, loadContext, saveContext } from '../lib/contextStore';
import type { PlanContext, SpecContext } from '../lib/contextStore';
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
    const specContext: SpecContext | null =
      options.specContext ??
      (await loadContext<SpecContext>(options.featureName, 'specify', { workspaceRoot: options.workspaceRoot }));
    const planContext: PlanContext | null =
      options.planContext ??
      (await loadContext<PlanContext>(options.featureName, 'plan', { workspaceRoot: options.workspaceRoot }));

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
        featureDirectory: options.featureDir,
        specRequirements: specContext ? String(specContext.requirements.length) : undefined,
        architectureDecisions: planContext ? String(planContext.architecture.length) : undefined,
        knownRisks: planContext ? String(planContext.risks.length) : undefined
      }
    });

    const outputMarkdown = `${result.outputText.trim()}\n`;
    await writeFileAtomic(tasksPath, outputMarkdown);
    await mirrorAgentOsFile({
      workspaceRoot: options.workspaceRoot,
      featureName: options.featureName,
      relativePath: path.relative(options.featureDir, tasksPath),
      content: outputMarkdown
    });

    const taskContext = extractTaskContext(outputMarkdown);
    const contextPath = await saveContext(options.featureName, this.phaseName, taskContext, {
      workspaceRoot: options.workspaceRoot
    });

    return {
      phase: this.phaseName,
      outputPath: tasksPath,
      details: {
        agentCommand: result.command,
        contextPath,
        planContextLoaded: Boolean(planContext),
        specContextLoaded: Boolean(specContext),
        taskProgress: taskContext.progress
      }
    };
  }
}

export default TasksPhase;
