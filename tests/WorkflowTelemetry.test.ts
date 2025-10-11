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

describe('Workflow telemetry', () => {
  let workspaceRoot: string;

  beforeEach(async () => {
    jest.clearAllMocks();
    workspaceRoot = await fs.mkdtemp(
      path.join(os.tmpdir(), 'workflow-telemetry-')
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

  it('records telemetry entries for each successful phase', async () => {
    const feature = 'telemetry-feature';

    invokeAgentMock.mockImplementation(async (options) => {
      switch (options.agent) {
        case 'bmad-analyst':
          return {
            ok: true,
            outputText: makeSpecMarkdown(makeSpecContext(['Requirement'], [])),
            command: 'spec',
          };
        case 'bmad-architect':
          return {
            ok: true,
            outputText: '# Plan\n\n## Architecture Decisions\n- Decision\n',
            command: 'plan',
          };
        case 'bmad-pm':
          return {
            ok: true,
            outputText: makeTasksMarkdown([{ title: 'Task 1' }]),
            command: 'tasks',
          };
        case 'bmad-developer':
          return {
            ok: true,
            outputText: '# Implementation\n',
            command: 'impl',
          };
        default:
          throw new Error(`Unexpected agent ${options.agent}`);
      }
    });

    const results = await runWorkflow({ workspaceRoot, feature });

    const statusPath = path.join(
      workspaceRoot,
      '.agent-os',
      'product',
      'status.json'
    );
    const rawTelemetry = await fs.readFile(statusPath, 'utf8');
    const telemetry = JSON.parse(rawTelemetry);

    expect(Array.isArray(telemetry)).toBe(true);
    expect(telemetry).toHaveLength(results.length);
    expect(telemetry.map((entry: any) => entry.phase)).toEqual(
      results.map((result) => result.phase)
    );

    for (const entry of telemetry) {
      expect(typeof entry.startTime).toBe('string');
      expect(typeof entry.endTime).toBe('string');
      expect(typeof entry.durationMs).toBe('number');
      expect(entry.durationMs).toBeGreaterThanOrEqual(0);
      expect(entry.result).toBe('success');
      expect(Number.isNaN(Date.parse(entry.startTime))).toBe(false);
      expect(Number.isNaN(Date.parse(entry.endTime))).toBe(false);
    }
  });

  it('records failure telemetry when a phase throws', async () => {
    const feature = 'failure-telemetry-feature';

    invokeAgentMock.mockImplementation(async (options) => {
      if (options.agent === 'bmad-architect') {
        throw new Error('phase failure');
      }
      return {
        ok: true,
        outputText: makeSpecMarkdown(makeSpecContext(['Requirement'], [])),
        command: 'spec',
      };
    });

    await expect(runWorkflow({ workspaceRoot, feature })).rejects.toThrow(
      'phase failure'
    );

    const statusPath = path.join(
      workspaceRoot,
      '.agent-os',
      'product',
      'status.json'
    );
    const rawTelemetry = await fs.readFile(statusPath, 'utf8');
    const telemetry = JSON.parse(rawTelemetry);

    expect(telemetry).toHaveLength(2);
    expect(telemetry[0].phase).toBe('specify');
    expect(telemetry[0].result).toBe('success');
    expect(telemetry[1].phase).toBe('plan');
    expect(telemetry[1].result).toBe('failure');
  });
});
