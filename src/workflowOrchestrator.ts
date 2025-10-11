import fs from 'fs/promises';
import path from 'path';
import {
  extractPlanContext,
  extractSpecContext,
  extractTaskContext,
  loadContext,
  PlanContext,
  SpecContext,
  TaskContext,
} from './lib/contextStore';
import { PhaseHandler, PhaseResult, PhaseRunOptions } from './phases/types';
import { phaseRegistry } from './phases/registry';
import SpecifyPhase from './phases/SpecifyPhase';
import PlanPhase from './phases/PlanPhase';
import TasksPhase from './phases/TasksPhase';
import ImplementPhase from './phases/ImplementPhase';
import { createWorkflowLogger, createLogger } from './lib/logger';
import type { PhaseLogger } from './lib/logger';
import { recordMetrics } from './lib/metrics';

interface PhaseTelemetryEntry {
  phase: string;
  startTime: string;
  endTime: string;
  durationMs: number;
  result: 'success' | 'failure';
}

async function appendPhaseTelemetry(
  workspaceRoot: string,
  telemetry: PhaseTelemetryEntry,
  logger: PhaseLogger
): Promise<void> {
  const telemetryPath = path.join(
    workspaceRoot,
    '.agent-os',
    'product',
    'status.json'
  );

  try {
    await fs.mkdir(path.dirname(telemetryPath), { recursive: true });

    let existing: unknown = [];
    try {
      const existingContent = await fs.readFile(telemetryPath, 'utf8');
      existing = JSON.parse(existingContent);
      if (!Array.isArray(existing)) {
        logger.warn(
          `Existing telemetry file at ${telemetryPath} is not an array. Overwriting.`
        );
        existing = [];
      }
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      if (err.code && err.code !== 'ENOENT') {
        logger.warn(
          `Failed to read telemetry file at ${telemetryPath}: ${err.message}`
        );
      }
      if (!Array.isArray(existing)) {
        existing = [];
      }
    }

    (existing as PhaseTelemetryEntry[]).push(telemetry);

    await fs.writeFile(telemetryPath, JSON.stringify(existing, null, 2));
  } catch (error) {
    logger.warn(
      `Failed to write telemetry entry for ${telemetry.phase}: ${(error as Error).message}`
    );
  }
}

export interface WorkflowOptions {
  feature?: string;
  brief?: string;
  phases?: string[];
  resumeFrom?: string;
  resumeTask?: string;
  dryRun?: boolean;
  workspaceRoot?: string;
  rebuildContext?: boolean;
}

const phaseHandlers: Record<string, PhaseHandler> = {
  specify: new SpecifyPhase(),
  plan: new PlanPhase(),
  tasks: new TasksPhase(),
  implement: new ImplementPhase(),
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
        phases.push(
          ...(argv[++i] || '')
            .split(',')
            .map((part) => part.trim())
            .filter(Boolean)
        );
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
      case '--rebuild-context':
        options.rebuildContext = true;
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

function createPhaseOptions(
  phase: string,
  workflowOptions: WorkflowOptions,
  workspaceRoot: string
): PhaseRunOptions {
  const featureName = workflowOptions.feature || 'Feature-A';
  const featureDir = path.join(workspaceRoot, 'specs', featureName);
  return {
    featureName,
    featureDir,
    workspaceRoot,
    brief: workflowOptions.brief,
    resumeFromTask: workflowOptions.resumeTask,
  };
}

async function readMarkdownIfAvailable(
  filePath: string,
  logger: PhaseLogger
): Promise<string | null> {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code !== 'ENOENT') {
      logger.warn(`Failed to read ${filePath}: ${err.message}`);
    }
    return null;
  }
}

async function rebuildSpecContextFromMarkdown(
  featureName: string,
  workspaceRoot: string,
  logger: PhaseLogger
): Promise<SpecContext | null> {
  const specPath = path.join(workspaceRoot, 'specs', featureName, 'spec.md');
  const markdown = await readMarkdownIfAvailable(specPath, logger);
  return markdown ? extractSpecContext(markdown) : null;
}

async function rebuildPlanContextFromMarkdown(
  featureName: string,
  workspaceRoot: string,
  logger: PhaseLogger
): Promise<PlanContext | null> {
  const planPath = path.join(workspaceRoot, 'specs', featureName, 'plan.md');
  const markdown = await readMarkdownIfAvailable(planPath, logger);
  return markdown ? extractPlanContext(markdown) : null;
}

async function rebuildTaskContextFromMarkdown(
  featureName: string,
  workspaceRoot: string,
  logger: PhaseLogger
): Promise<TaskContext | null> {
  const tasksPath = path.join(workspaceRoot, 'specs', featureName, 'tasks.md');
  const markdown = await readMarkdownIfAvailable(tasksPath, logger);
  return markdown ? extractTaskContext(markdown) : null;
}

export async function runWorkflow(
  options: WorkflowOptions = {}
): Promise<PhaseResult[]> {
  const workspaceRoot = options.workspaceRoot || process.cwd();
  const phaseOrder = resolvePhases(options);
  const results: PhaseResult[] = [];
  let specContext: SpecContext | null = null;
  let planContext: PlanContext | null = null;
  let taskContext: TaskContext | null = null;
  const workflowLogger = createWorkflowLogger();
  const contextLogger = createLogger('workflow:context');
  const telemetryLogger = createLogger('workflow:telemetry');
  const rebuildContext =
    options.rebuildContext ?? process.env.SPEC_KIT_REBUILD_CONTEXT === '1';
  const startTime = Date.now();
  let success = false;

  try {
    for (const phaseName of phaseOrder) {
      const handler = phaseHandlers[phaseName];
      if (!handler) {
        throw new Error(`Unsupported phase: ${phaseName}`);
      }

      const registryEntry = phaseRegistry[phaseName];
      if (!registryEntry) {
        throw new Error(`Missing registry entry for phase ${phaseName}`);
      }

      const phaseOptions = createPhaseOptions(
        phaseName,
        options,
        workspaceRoot
      );
      phaseOptions.rebuildContext = rebuildContext;
      const phaseLogger = createLogger(`workflow:${phaseName}`);

      if (phaseName === 'plan') {
        specContext = rebuildContext
          ? await rebuildSpecContextFromMarkdown(
              phaseOptions.featureName,
              workspaceRoot,
              contextLogger
            )
          : (specContext ??
            (await loadContext<SpecContext>(
              phaseOptions.featureName,
              'specify',
              { workspaceRoot }
            )));
        phaseOptions.specContext = specContext;
      } else if (phaseName === 'tasks') {
        specContext = rebuildContext
          ? await rebuildSpecContextFromMarkdown(
              phaseOptions.featureName,
              workspaceRoot,
              contextLogger
            )
          : (specContext ??
            (await loadContext<SpecContext>(
              phaseOptions.featureName,
              'specify',
              { workspaceRoot }
            )));
        planContext = rebuildContext
          ? await rebuildPlanContextFromMarkdown(
              phaseOptions.featureName,
              workspaceRoot,
              contextLogger
            )
          : (planContext ??
            (await loadContext<PlanContext>(phaseOptions.featureName, 'plan', {
              workspaceRoot,
            })));
        phaseOptions.specContext = specContext;
        phaseOptions.planContext = planContext;
      } else if (phaseName === 'implement') {
        planContext = rebuildContext
          ? await rebuildPlanContextFromMarkdown(
              phaseOptions.featureName,
              workspaceRoot,
              contextLogger
            )
          : (planContext ??
            (await loadContext<PlanContext>(phaseOptions.featureName, 'plan', {
              workspaceRoot,
            })));
        taskContext = rebuildContext
          ? await rebuildTaskContextFromMarkdown(
              phaseOptions.featureName,
              workspaceRoot,
              contextLogger
            )
          : (taskContext ??
            (await loadContext<TaskContext>(phaseOptions.featureName, 'tasks', {
              workspaceRoot,
            })));
        phaseOptions.planContext = planContext;
        phaseOptions.taskContext = taskContext;
      }

      if (options.dryRun) {
        results.push({
          phase: phaseName,
          outputPath: 'dry-run',
          details: { skipped: true },
        });
        continue;
      }

      const phaseStart = Date.now();
      phaseLogger.info(
        `Starting phase for ${phaseOptions.featureName} (agent: ${registryEntry.agent})`
      );
      let result: PhaseResult;
      try {
        result = await handler.run(phaseOptions);
      } catch (error) {
        const failureEnd = Date.now();
        await appendPhaseTelemetry(
          workspaceRoot,
          {
            phase: phaseName,
            startTime: new Date(phaseStart).toISOString(),
            endTime: new Date(failureEnd).toISOString(),
            durationMs: failureEnd - phaseStart,
            result: 'failure',
          },
          telemetryLogger
        );
        throw error;
      }
      const phaseEnd = Date.now();
      phaseLogger.info(`Phase complete → ${result.outputPath}`);
      results.push(result);

      await appendPhaseTelemetry(
        workspaceRoot,
        {
          phase: phaseName,
          startTime: new Date(phaseStart).toISOString(),
          endTime: new Date(phaseEnd).toISOString(),
          durationMs: phaseEnd - phaseStart,
          result: 'success',
        },
        telemetryLogger
      );

      if (phaseName === 'specify') {
        specContext = rebuildContext
          ? await rebuildSpecContextFromMarkdown(
              phaseOptions.featureName,
              workspaceRoot,
              contextLogger
            )
          : await loadContext<SpecContext>(
              phaseOptions.featureName,
              'specify',
              { workspaceRoot }
            );
      } else if (phaseName === 'plan') {
        planContext = rebuildContext
          ? await rebuildPlanContextFromMarkdown(
              phaseOptions.featureName,
              workspaceRoot,
              contextLogger
            )
          : await loadContext<PlanContext>(phaseOptions.featureName, 'plan', {
              workspaceRoot,
            });
      } else if (phaseName === 'tasks') {
        taskContext = rebuildContext
          ? await rebuildTaskContextFromMarkdown(
              phaseOptions.featureName,
              workspaceRoot,
              contextLogger
            )
          : await loadContext<TaskContext>(phaseOptions.featureName, 'tasks', {
              workspaceRoot,
            });
      }
    }

    workflowLogger.info(
      `Workflow completed for ${options.feature ?? 'Feature-A'}`
    );
    success = true;
    return results;
  } finally {
    if (!options.dryRun) {
      const runtimeMs = Date.now() - startTime;
      const requirementCount = specContext?.requirements?.length ?? 0;
      const completedRequirements =
        specContext?.requirements?.filter((req) => req.completed).length ?? 0;
      const taskCount = taskContext?.tasks?.length ?? 0;
      const completedTasks =
        taskContext?.tasks?.filter((task) => task.completed).length ?? 0;
      const coverageSource =
        taskCount > 0
          ? [completedTasks, taskCount]
          : [completedRequirements, requirementCount];
      const coveragePct =
        coverageSource[1] > 0
          ? (coverageSource[0] / coverageSource[1]) * 100
          : 0;

      try {
        await recordMetrics(
          {
            coveragePct,
            runtimeMs,
            success,
            details: {
              phases: results.map((result) => result.phase),
              resumeFrom: options.resumeFrom ?? null,
              resumeTask: options.resumeTask ?? null,
              completedTasks,
              taskCount,
              completedRequirements,
              requirementCount,
            },
          },
          { feature: options.feature ?? 'Feature-A', phase: 'workflow' }
        );
      } catch (error) {
        workflowLogger.warn(
          `Failed to record analytics metrics: ${(error as Error).message}`
        );
      }
    }
  }
}

if (require.main === module) {
  runWorkflow(parseArgv(process.argv.slice(2)))
    .then(() => {
      createWorkflowLogger().info('Workflow finished successfully.');
    })
    .catch((error) => {
      createWorkflowLogger().error(`Workflow failed: ${error.message}`);
      process.exit(1);
    });
}
