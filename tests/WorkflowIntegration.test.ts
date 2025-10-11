import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import { runWorkflow } from '../src/workflowOrchestrator';
import { invokeAgent } from '../src/lib/invokeAgent';
import { recordMetrics } from '../src/lib/metrics';
import {
  makeSpecContext,
  makeSpecMarkdown,
  makeTasksMarkdown,
} from './factories';

jest.mock('../src/lib/invokeAgent', () => ({
  invokeAgent: jest.fn(),
}));

jest.mock('../src/lib/metrics', () => ({
  recordMetrics: jest.fn(),
}));

const invokeAgentMock = invokeAgent as jest.MockedFunction<typeof invokeAgent>;
const recordMetricsMock = recordMetrics as jest.MockedFunction<
  typeof recordMetrics
>;

describe('Workflow integration', () => {
  let workspaceRoot: string;

  beforeEach(async () => {
    jest.clearAllMocks();
    workspaceRoot = await fs.mkdtemp(
      path.join(os.tmpdir(), 'workflow-integration-')
    );
    recordMetricsMock.mockResolvedValue({
      coveragePct: 0,
      runtimeMs: 0,
      success: true,
      timestamp: new Date().toISOString(),
    });
  });

  afterEach(async () => {
    await fs.rm(workspaceRoot, { recursive: true, force: true });
  });

  it('runs all phases sequentially and records analytics metrics', async () => {
    const feature = 'integration-feature';

    invokeAgentMock.mockImplementation(async (options) => {
      switch (options.agent) {
        case 'bmad-analyst':
          return {
            ok: true,
            outputText: makeSpecMarkdown(
              makeSpecContext(['Demo requirement'], ['Outstanding question'])
            ),
            command: 'mock-spec',
          };
        case 'bmad-architect':
          return {
            ok: true,
            outputText:
              '# Plan\n\n## Architecture Decisions\n- Service oriented\n\n## Risks & Mitigations\n- Integration risk\n',
            command: 'mock-plan',
          };
        case 'bmad-pm':
          return {
            ok: true,
            outputText: makeTasksMarkdown([
              { title: 'Implement API', references: ['src/api/index.ts'] },
              { title: 'Write unit tests', completed: true },
            ]),
            command: 'mock-tasks',
          };
        case 'bmad-developer':
          return {
            ok: true,
            outputText: `# Implementation notes for ${options.metadata?.taskIndex}`,
            command: 'mock-impl',
          };
        default:
          throw new Error(`Unexpected agent ${options.agent}`);
      }
    });

    const results = await runWorkflow({ workspaceRoot, feature });

    expect(results.map((result) => result.phase)).toEqual([
      'specify',
      'plan',
      'tasks',
      'implement',
    ]);

    const featureDir = path.join(workspaceRoot, 'specs', feature);
    const specContent = await fs.readFile(
      path.join(featureDir, 'spec.md'),
      'utf8'
    );
    const planContent = await fs.readFile(
      path.join(featureDir, 'plan.md'),
      'utf8'
    );
    const tasksContent = await fs.readFile(
      path.join(featureDir, 'tasks.md'),
      'utf8'
    );
    expect(specContent).toContain('Demo requirement');
    expect(planContent).toContain('Service oriented');
    expect(tasksContent).toContain('Implement API');

    const implementationDir = path.join(featureDir, 'implementation');
    const implementationFiles = await fs.readdir(implementationDir);
    expect(implementationFiles).toHaveLength(2);

    expect(recordMetricsMock).toHaveBeenCalledTimes(1);
    const [metrics, metadata] = recordMetricsMock.mock.calls[0];
    expect(metrics.success).toBe(true);
    expect(metrics.runtimeMs).toBeGreaterThan(0);
    expect(metrics.details?.phases).toEqual([
      'specify',
      'plan',
      'tasks',
      'implement',
    ]);
    expect(metadata).toEqual({ feature, phase: 'workflow' });
  });

  it('supports resuming from a specified phase with existing artifacts', async () => {
    const feature = 'resume-feature';
    const featureDir = path.join(workspaceRoot, 'specs', feature);
    await fs.mkdir(featureDir, { recursive: true });
    await fs.writeFile(
      path.join(featureDir, 'spec.md'),
      '# Spec\n\n## Functional Requirements\n- [ ] Demo\n'
    );

    invokeAgentMock.mockImplementation(async (options) => {
      if (options.agent === 'bmad-architect') {
        return {
          ok: true,
          outputText: '# Plan\n\n## Architecture Decisions\n- Cached layer\n',
          command: 'mock-plan',
        };
      }
      if (options.agent === 'bmad-pm') {
        return {
          ok: true,
          outputText: makeTasksMarkdown([
            { title: 'Implement feature' },
            { title: 'Write docs', completed: true },
          ]),
          command: 'mock-tasks',
        };
      }
      return {
        ok: true,
        outputText: `Implementation for ${options.metadata?.taskLabel}`,
        command: 'mock-impl',
      };
    });

    const results = await runWorkflow({
      workspaceRoot,
      feature,
      resumeFrom: 'plan',
    });
    expect(results.map((result) => result.phase)).toEqual([
      'plan',
      'tasks',
      'implement',
    ]);
    expect(recordMetricsMock).toHaveBeenCalledWith(
      expect.objectContaining({ success: true }),
      { feature, phase: 'workflow' }
    );
  });

  it('resumes implementation from a specific task label', async () => {
    const feature = 'resume-task';

    invokeAgentMock.mockImplementation(async (options) => {
      switch (options.agent) {
        case 'bmad-analyst':
          return {
            ok: true,
            outputText:
              '# Spec\n\n## Functional Requirements\n- [ ] Task resume\n',
            command: 'spec',
          };
        case 'bmad-architect':
          return {
            ok: true,
            outputText: '# Plan\n\n## Architecture Decisions\n- Step\n',
            command: 'plan',
          };
        case 'bmad-pm':
          return {
            ok: true,
            outputText: makeTasksMarkdown([
              { title: 'Implement API' },
              { title: 'Write docs' },
              { title: 'Ship release' },
            ]),
            command: 'tasks',
          };
        case 'bmad-developer':
          return {
            ok: true,
            outputText: `Notes for ${options.metadata?.taskLabel}`,
            command: 'impl',
          };
        default:
          throw new Error('unexpected agent');
      }
    });

    await runWorkflow({ workspaceRoot, feature, resumeTask: 'Write docs' });

    const developerCalls = invokeAgentMock.mock.calls.filter(
      (call) => call[0].agent === 'bmad-developer'
    );
    expect(developerCalls).toHaveLength(2);
    expect(developerCalls[0][0].metadata?.taskLabel).toContain('Write docs');
    expect(developerCalls[1][0].metadata?.taskLabel).toContain('Ship release');
  });

  it('records failed runs when a phase throws an error', async () => {
    const feature = 'failure-feature';

    invokeAgentMock.mockImplementation(async (options) => {
      if (options.agent === 'bmad-architect') {
        throw new Error('agent failure');
      }
      return { ok: true, outputText: '# Spec\n', command: 'spec' };
    });

    await expect(runWorkflow({ workspaceRoot, feature })).rejects.toThrow(
      'agent failure'
    );

    expect(recordMetricsMock).toHaveBeenCalledTimes(1);
    expect(recordMetricsMock.mock.calls[0][0].success).toBe(false);
  });

  it('skips execution and analytics in dry-run mode', async () => {
    const feature = 'dry-run-feature';

    const results = await runWorkflow({ workspaceRoot, feature, dryRun: true });

    expect(results).toHaveLength(4);
    expect(results.every((result) => result.details?.skipped)).toBe(true);
    expect(recordMetricsMock).not.toHaveBeenCalled();
    expect(invokeAgentMock).not.toHaveBeenCalled();
  });
});
