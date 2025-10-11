import { invokeAgent } from '../lib/invokeAgent';
import { readFileIfExists, writeFileAtomic } from '../lib/files';
import { mirrorAgentOsFile } from '../lib/agentOs';
import { extractSpecContext, saveContext } from '../lib/contextStore';
import { PhaseHandler, PhaseResult, PhaseRunOptions } from './types';
import { ensureFeaturePaths, resolveFeaturePaths } from '../lib/phaseUtils';
import path from 'path';
import { createPhaseLogger } from '../lib/logger';

/**
 * Generates or updates the specification for a feature by combining any provided
 * brief, existing drafts, and the Spec Kit constitution. The resulting
 * specification is written to `spec.md`, synchronized with Agent OS, and stored
 * in the context repository for later phases.
 */
export class SpecifyPhase implements PhaseHandler {
  public readonly phaseName = 'specify';

  public async run(options: PhaseRunOptions): Promise<PhaseResult> {
    const logger = createPhaseLogger(this.phaseName);
    const paths = resolveFeaturePaths(options.featureDir);
    await ensureFeaturePaths(paths);

    const constitutionPath = path.join(options.workspaceRoot, 'specs', 'constitution.md');
    const briefFromFile = await readFileIfExists(paths.idea);
    const brief = options.brief || briefFromFile || '';

    const prompt = [
      'Create or update the feature specification so it satisfies the Spec Kit constitution.',
      'Return the full Markdown document that should be written to `spec.md`.',
      brief ? `Feature brief:\n${brief}` : null,
      'Highlight approval checkpoints and list outstanding questions.'
    ]
      .filter(Boolean)
      .join('\n\n');

    const contextFiles = [
      { path: constitutionPath, label: 'Spec Kit Constitution', optional: false },
      { path: paths.spec, label: 'Existing Specification', optional: true },
      { path: paths.plan, label: 'Existing Plan', optional: true },
      { path: paths.tasks, label: 'Existing Tasks', optional: true },
      { path: paths.idea, label: 'Feature Idea', optional: true }
    ];

    const result = await invokeAgent({
      agent: 'bmad-analyst',
      featureName: options.featureName,
      workspaceRoot: options.workspaceRoot,
      prompt,
      contextFiles,
      metadata: {
        phase: this.phaseName,
        featureDirectory: options.featureDir,
        brief: brief ? brief.slice(0, 240) : undefined
      }
    });

    const outputMarkdown = `${result.outputText.trim()}\n`;
    await writeFileAtomic(paths.spec, outputMarkdown);
    await mirrorAgentOsFile({
      workspaceRoot: options.workspaceRoot,
      featureName: options.featureName,
      relativePath: path.join(
        'specs',
        options.featureName,
        path.relative(options.featureDir, paths.spec)
      ),
      content: outputMarkdown
    });

    const contextPath = await saveContext(options.featureName, this.phaseName, extractSpecContext(outputMarkdown), {
      workspaceRoot: options.workspaceRoot
    });

    logger.info(`spec.md generated (${outputMarkdown.length} bytes)`);

    return {
      phase: this.phaseName,
      outputPath: paths.spec,
      details: {
        briefSource: briefFromFile ? 'idea.md' : options.brief ? 'cli' : 'none',
        agentCommand: result.command,
        contextPath
      }
    };
  }
}

export default SpecifyPhase;
