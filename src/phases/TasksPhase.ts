import { invokeAgent } from '../lib/invokeAgent';
import { writeFileAtomic } from '../lib/files';
import { mirrorAgentOsFile } from '../lib/agentOs';
import { extractTaskContext, loadContext, saveContext } from '../lib/contextStore';
import type { PlanContext, SpecContext } from '../lib/contextStore';
import { PhaseHandler, PhaseResult, PhaseRunOptions } from './types';
import {
  assertPhasePrerequisites,
  ensureFeaturePaths,
  readPhaseFiles,
  resolveFeaturePaths
} from '../lib/phaseUtils';
import path from 'path';
import { createPhaseLogger } from '../lib/logger';

/**
 * Converts an approved plan into an actionable checklist of tasks with QA notes.
 * Requires both `spec.md` and `plan.md`, writes the generated checklist to
 * `tasks.md`, mirrors it to Agent OS, and saves derived task context for
 * implementation.
 */
export class TasksPhase implements PhaseHandler {
  public readonly phaseName = 'tasks';

  public async run(options: PhaseRunOptions): Promise<PhaseResult> {
    const logger = createPhaseLogger(this.phaseName);
    const paths = resolveFeaturePaths(options.featureDir);
    await ensureFeaturePaths(paths);

    const io = await readPhaseFiles([
      { key: 'spec', path: paths.spec, description: 'Specification', required: true },
      { key: 'plan', path: paths.plan, description: 'Implementation plan', required: true },
      { key: 'tasks', path: paths.tasks, description: 'Existing task list' }
    ]);

    assertPhasePrerequisites(io, this.phaseName);

    const spec = io.files.spec as string;
    const plan = io.files.plan as string;
    const specContext: SpecContext | null =
      options.specContext ??
      (await loadContext<SpecContext>(options.featureName, 'specify', { workspaceRoot: options.workspaceRoot }));
    const planContext: PlanContext | null =
      options.planContext ??
      (await loadContext<PlanContext>(options.featureName, 'plan', { workspaceRoot: options.workspaceRoot }));

    const prompt = [
      'Break the plan into executable tasks with QA acceptance notes.',
      'Ensure each task traces back to specific requirements and architectural decisions.',
      'Use Markdown checklists and include QA/validation hooks for each item.',
      'Return the content for tasks.md.'
    ].join('\n\n');

    const contextFiles = [
      { path: paths.spec, label: 'Specification', optional: false },
      { path: paths.plan, label: 'Implementation Plan', optional: false },
      { path: paths.tasks, label: 'Existing Task List', optional: true }
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
    await writeFileAtomic(paths.tasks, outputMarkdown);
    await mirrorAgentOsFile({
      workspaceRoot: options.workspaceRoot,
      featureName: options.featureName,
      relativePath: path.relative(options.featureDir, paths.tasks),
      content: outputMarkdown
    });

    const taskContext = extractTaskContext(outputMarkdown);
    const contextPath = await saveContext(options.featureName, this.phaseName, taskContext, {
      workspaceRoot: options.workspaceRoot
    });

    logger.info(`tasks.md created with ${taskContext.tasks.length} tasks`);

    return {
      phase: this.phaseName,
      outputPath: paths.tasks,
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
