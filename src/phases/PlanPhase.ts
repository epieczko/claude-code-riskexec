import path from 'path';
import { invokeAgent } from '../lib/invokeAgent';
import { ensureDir, readFileIfExists, writeFileAtomic } from '../lib/files';
import { mirrorAgentOsDirectory, mirrorAgentOsFile } from '../lib/agentOs';
import { extractPlanContext, loadContext, saveContext } from '../lib/contextStore';
import type { SpecContext } from '../lib/contextStore';
import { PhaseHandler, PhaseResult, PhaseRunOptions } from './types';

export class PlanPhase implements PhaseHandler {
  public readonly phaseName = 'plan';

  public async run(options: PhaseRunOptions): Promise<PhaseResult> {
    await ensureDir(options.featureDir);

    const specPath = path.join(options.featureDir, 'spec.md');
    const planPath = path.join(options.featureDir, 'plan.md');
    const tasksPath = path.join(options.featureDir, 'tasks.md');
    const architectureDir = path.join(options.featureDir, 'architecture');

    const specContent = await readFileIfExists(specPath);
    if (!specContent) {
      throw new Error(`Missing spec at ${specPath}. Run the specify phase first.`);
    }

    const existingTasks = await readFileIfExists(tasksPath);
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
      { path: specPath, label: 'Specification', optional: false },
      { path: planPath, label: 'Existing Plan', optional: true },
      { path: tasksPath, label: 'Existing Tasks', optional: true },
      { path: path.join(options.workspaceRoot, 'specs', 'constitution.md'), label: 'Spec Kit Constitution', optional: true }
    ];

    const result = await invokeAgent({
      agent: 'bmad-architect',
      featureName: options.featureName,
      workspaceRoot: options.workspaceRoot,
      prompt,
      contextFiles,
      metadata: {
        phase: this.phaseName,
        architectureDir,
        featureDirectory: options.featureDir,
        specRequirements: specContext ? String(specContext.requirements.length) : undefined,
        openQuestions: specContext ? String(specContext.openQuestions.length) : undefined
      }
    });

    const outputMarkdown = `${result.outputText.trim()}\n`;
    await writeFileAtomic(planPath, outputMarkdown);
    await mirrorAgentOsFile({
      workspaceRoot: options.workspaceRoot,
      featureName: options.featureName,
      relativePath: path.relative(options.featureDir, planPath),
      content: outputMarkdown
    });
    await mirrorAgentOsDirectory({
      workspaceRoot: options.workspaceRoot,
      featureName: options.featureName,
      sourceDir: architectureDir,
      targetSubdir: 'architecture'
    });

    const contextPath = await saveContext(options.featureName, this.phaseName, extractPlanContext(outputMarkdown), {
      workspaceRoot: options.workspaceRoot
    });

    return {
      phase: this.phaseName,
      outputPath: planPath,
      details: {
        agentCommand: result.command,
        contextPath,
        specContextLoaded: Boolean(specContext)
      }
    };
  }
}

export default PlanPhase;
