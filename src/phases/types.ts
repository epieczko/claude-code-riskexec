import { PlanContext, SpecContext, TaskContext } from '../lib/contextStore';

export interface PhaseContext {
  featureName: string;
  featureDir: string;
  workspaceRoot: string;
}

export interface PhaseRunOptions extends PhaseContext {
  brief?: string;
  resumeFromTask?: string;
  specContext?: SpecContext | null;
  planContext?: PlanContext | null;
  taskContext?: TaskContext | null;
}

export interface PhaseResult {
  phase: string;
  outputPath?: string;
  logPaths?: string[];
  details?: Record<string, unknown>;
}

export interface PhaseHandler {
  readonly phaseName: string;
  run(options: PhaseRunOptions): Promise<PhaseResult>;
}
