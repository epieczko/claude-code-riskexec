import path from 'path';
import { invokeAgent } from '../lib/invokeAgent';
import { ensureDir, readFileIfExists, writeFileAtomic } from '../lib/files';
import { mirrorAgentOsFile } from '../lib/agentOs';
import { extractSpecContext, saveContext } from '../lib/contextStore';
import { PhaseHandler, PhaseResult, PhaseRunOptions } from './types';

export class SpecifyPhase implements PhaseHandler {
  public readonly phaseName = 'specify';

  public async run(options: PhaseRunOptions): Promise<PhaseResult> {
    const featureDir = options.featureDir;
    await ensureDir(featureDir);

    const ideaPath = path.join(featureDir, 'idea.md');
    const specPath = path.join(featureDir, 'spec.md');
    const planPath = path.join(featureDir, 'plan.md');
    const tasksPath = path.join(featureDir, 'tasks.md');
    const constitutionPath = path.join(options.workspaceRoot, 'specs', 'constitution.md');

    const briefFromFile = await readFileIfExists(ideaPath);
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
      { path: specPath, label: 'Existing Specification', optional: true },
      { path: planPath, label: 'Existing Plan', optional: true },
      { path: tasksPath, label: 'Existing Tasks', optional: true },
      { path: ideaPath, label: 'Feature Idea', optional: true }
    ];

    const result = await invokeAgent({
      agent: 'bmad-analyst',
      featureName: options.featureName,
      workspaceRoot: options.workspaceRoot,
      prompt,
      contextFiles,
      metadata: {
        phase: this.phaseName,
        featureDirectory: featureDir,
        brief: brief ? brief.slice(0, 240) : undefined
      }
    });

    const outputMarkdown = `${result.outputText.trim()}\n`;
    await writeFileAtomic(specPath, outputMarkdown);
    await mirrorAgentOsFile({
      workspaceRoot: options.workspaceRoot,
      featureName: options.featureName,
      relativePath: path.relative(options.featureDir, specPath),
      content: outputMarkdown
    });

    const contextPath = await saveContext(options.featureName, this.phaseName, extractSpecContext(outputMarkdown), {
      workspaceRoot: options.workspaceRoot
    });

    return {
      phase: this.phaseName,
      outputPath: specPath,
      details: {
        briefSource: briefFromFile ? 'idea.md' : options.brief ? 'cli' : 'none',
        agentCommand: result.command,
        contextPath
      }
    };
  }
}

export default SpecifyPhase;
