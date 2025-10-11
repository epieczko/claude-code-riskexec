import path from 'path';
import { loadContext, PlanContext, SpecContext, TaskContext } from './lib/contextStore';
import { PhaseHandler, PhaseResult, PhaseRunOptions } from './phases/types';
import { phaseRegistry } from './phases/registry';
import SpecifyPhase from './phases/SpecifyPhase';
import PlanPhase from './phases/PlanPhase';
import TasksPhase from './phases/TasksPhase';
import ImplementPhase from './phases/ImplementPhase';
import { createWorkflowLogger, createLogger } from './lib/logger';

export interface WorkflowOptions {
  feature?: string;
  brief?: string;
  phases?: string[];
  resumeFrom?: string;
  resumeTask?: string;
  dryRun?: boolean;
  workspaceRoot?: string;
}

const phaseHandlers: Record<string, PhaseHandler> = {
  specify: new SpecifyPhase(),
  plan: new PlanPhase(),
  tasks: new TasksPhase(),
  implement: new ImplementPhase()
};

function parseArgv(argv: string[]): WorkflowOptions {
  const options: WorkflowOptions = {};
  const phases: string[] = [];

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    switch (token) {
      case '--feature':
      case '-f':
        options.feature = argv[++i];
        break;
      case '--brief':
        options.brief = argv[++i];
        break;
      case '--phases':
        phases.push(...(argv[++i] || '').split(',').map(part => part.trim()).filter(Boolean));
        break;
      case '--phase':
        phases.push(argv[++i]);
        break;
      case '--resume-from':
        options.resumeFrom = argv[++i];
        break;
      case '--resume-task':
        options.resumeTask = argv[++i];
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
      default:
        if (!options.feature && !token.startsWith('--')) {
          options.feature = token;
        }
        break;
    }
  }

  if (phases.length) {
    options.phases = phases;
  }

  return options;
}

function resolvePhases(options: WorkflowOptions): string[] {
  if (options.phases && options.phases.length) {
    return options.phases;
  }
  if (options.resumeFrom) {
    const order = ['specify', 'plan', 'tasks', 'implement'];
    const startIndex = order.indexOf(options.resumeFrom);
    if (startIndex === -1) {
      throw new Error(`Unknown resume phase: ${options.resumeFrom}`);
    }
    return order.slice(startIndex);
  }
  return ['specify', 'plan', 'tasks', 'implement'];
}

function createPhaseOptions(phase: string, workflowOptions: WorkflowOptions, workspaceRoot: string): PhaseRunOptions {
  const featureName = workflowOptions.feature || 'Feature-A';
  const featureDir = path.join(workspaceRoot, 'specs', featureName);
  return {
    featureName,
    featureDir,
    workspaceRoot,
    brief: workflowOptions.brief,
    resumeFromTask: workflowOptions.resumeTask
  };
}

export async function runWorkflow(options: WorkflowOptions = {}): Promise<PhaseResult[]> {
  const workspaceRoot = options.workspaceRoot || process.cwd();
  const phaseOrder = resolvePhases(options);
  const results: PhaseResult[] = [];
  let specContext: SpecContext | null = null;
  let planContext: PlanContext | null = null;
  let taskContext: TaskContext | null = null;
  const workflowLogger = createWorkflowLogger();

  for (const phaseName of phaseOrder) {
    const handler = phaseHandlers[phaseName];
    if (!handler) {
      throw new Error(`Unsupported phase: ${phaseName}`);
    }

    const registryEntry = phaseRegistry[phaseName];
    if (!registryEntry) {
      throw new Error(`Missing registry entry for phase ${phaseName}`);
    }

    const phaseOptions = createPhaseOptions(phaseName, options, workspaceRoot);
    const phaseLogger = createLogger(`workflow:${phaseName}`);

    if (phaseName === 'plan') {
      specContext = specContext ?? (await loadContext<SpecContext>(phaseOptions.featureName, 'specify', { workspaceRoot }));
      phaseOptions.specContext = specContext;
    } else if (phaseName === 'tasks') {
      specContext = specContext ?? (await loadContext<SpecContext>(phaseOptions.featureName, 'specify', { workspaceRoot }));
      planContext = planContext ?? (await loadContext<PlanContext>(phaseOptions.featureName, 'plan', { workspaceRoot }));
      phaseOptions.specContext = specContext;
      phaseOptions.planContext = planContext;
    } else if (phaseName === 'implement') {
      planContext = planContext ?? (await loadContext<PlanContext>(phaseOptions.featureName, 'plan', { workspaceRoot }));
      taskContext = taskContext ?? (await loadContext<TaskContext>(phaseOptions.featureName, 'tasks', { workspaceRoot }));
      phaseOptions.planContext = planContext;
      phaseOptions.taskContext = taskContext;
    }

    if (options.dryRun) {
      results.push({ phase: phaseName, outputPath: 'dry-run', details: { skipped: true } });
      continue;
    }

    phaseLogger.info(`Starting phase for ${phaseOptions.featureName} (agent: ${registryEntry.agent})`);
    const result = await handler.run(phaseOptions);
    phaseLogger.info(`Phase complete → ${result.outputPath}`);
    results.push(result);

    if (phaseName === 'specify') {
      specContext = await loadContext<SpecContext>(phaseOptions.featureName, 'specify', { workspaceRoot });
    } else if (phaseName === 'plan') {
      planContext = await loadContext<PlanContext>(phaseOptions.featureName, 'plan', { workspaceRoot });
    } else if (phaseName === 'tasks') {
      taskContext = await loadContext<TaskContext>(phaseOptions.featureName, 'tasks', { workspaceRoot });
    }
  }

  workflowLogger.info(`Workflow completed for ${options.feature ?? 'Feature-A'}`);

  return results;
}

if (require.main === module) {
  runWorkflow(parseArgv(process.argv.slice(2)))
    .then(() => {
      createWorkflowLogger().info('Workflow finished successfully.');
    })
    .catch(error => {
      createWorkflowLogger().error(`Workflow failed: ${error.message}`);
      process.exit(1);
    });
}
