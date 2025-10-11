import path from 'path';
import { invokeAgent } from '../lib/invokeAgent';
import { writeFileAtomic } from '../lib/files';
import { mirrorAgentOsDirectory, mirrorAgentOsFile } from '../lib/agentOs';
import { extractPlanContext, loadContext, saveContext } from '../lib/contextStore';
import type { SpecContext } from '../lib/contextStore';
import { PhaseHandler, PhaseResult, PhaseRunOptions } from './types';
import {
  assertPhasePrerequisites,
  ensureFeaturePaths,
  readPhaseFiles,
  resolveFeaturePaths
} from '../lib/phaseUtils';
import { createPhaseLogger } from '../lib/logger';

/**
 * Handles the plan phase by translating an approved specification into a detailed
 * architecture plan. The phase requires an existing `spec.md` and optionally
 * considers prior `plan.md` and `tasks.md` drafts. Successful execution writes a
 * refreshed `plan.md`, mirrors artifacts to Agent OS, and persists derived plan
 * context for downstream phases.
 */
export class PlanPhase implements PhaseHandler {
  public readonly phaseName = 'plan';

  public async run(options: PhaseRunOptions): Promise<PhaseResult> {
    const logger = createPhaseLogger(this.phaseName);
    const paths = resolveFeaturePaths(options.featureDir);
    await ensureFeaturePaths(paths, [paths.architectureDir]);

    const io = await readPhaseFiles([
      { key: 'spec', path: paths.spec, description: 'Specification', required: true },
      { key: 'plan', path: paths.plan, description: 'Existing plan draft' },
      { key: 'tasks', path: paths.tasks, description: 'Existing task draft' }
    ]);

    assertPhasePrerequisites(io, this.phaseName);

    const specContent = io.files.spec as string;
    const existingTasks = io.files.tasks;
    const specContext: SpecContext | null =
      options.specContext ??
      (await loadContext<SpecContext>(options.featureName, 'specify', { workspaceRoot: options.workspaceRoot }));

    const prompt = [
      'Translate the approved specification into a technical plan.',
      'Document architecture decisions, integration points, risks, and validation strategy.',
      'Return Markdown ready for plan.md and reference any supplemental diagrams saved under architecture/.',
      existingTasks ? 'Review the current tasks.md draft to ensure the plan aligns with downstream execution.' : null
    ]
      .filter(Boolean)
      .join('\n\n');

    const contextFiles = [
      { path: paths.spec, label: 'Specification', optional: false },
      { path: paths.plan, label: 'Existing Plan', optional: true },
      { path: paths.tasks, label: 'Existing Tasks', optional: true },
      {
        path: path.join(options.workspaceRoot, 'specs', 'constitution.md'),
        label: 'Spec Kit Constitution',
        optional: true
      }
    ];

    const result = await invokeAgent({
      agent: 'bmad-architect',
      featureName: options.featureName,
      workspaceRoot: options.workspaceRoot,
      prompt,
      contextFiles,
      metadata: {
        phase: this.phaseName,
        architectureDir: paths.architectureDir,
        featureDirectory: options.featureDir,
        specRequirements: specContext ? String(specContext.requirements.length) : undefined,
        openQuestions: specContext ? String(specContext.openQuestions.length) : undefined
      }
    });

    const outputMarkdown = `${result.outputText.trim()}\n`;
    await writeFileAtomic(paths.plan, outputMarkdown);
    await mirrorAgentOsFile({
      workspaceRoot: options.workspaceRoot,
      featureName: options.featureName,
      relativePath: path.join(
        'specs',
        options.featureName,
        path.relative(options.featureDir, paths.plan)
      ),
      content: outputMarkdown
    });
    await mirrorAgentOsDirectory({
      workspaceRoot: options.workspaceRoot,
      featureName: options.featureName,
      sourceDir: paths.architectureDir,
      targetSubdir: path.join('specs', options.featureName, 'architecture')
    });

    const contextPath = await saveContext(options.featureName, this.phaseName, extractPlanContext(outputMarkdown), {
      workspaceRoot: options.workspaceRoot
    });

    logger.info(`plan.md updated (${outputMarkdown.length} bytes)`);

    return {
      phase: this.phaseName,
      outputPath: paths.plan,
      details: {
        agentCommand: result.command,
        contextPath,
        specContextLoaded: Boolean(specContext)
      }
    };
  }
}

export default PlanPhase;
