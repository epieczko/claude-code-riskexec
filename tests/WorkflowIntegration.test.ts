import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import { runWorkflow } from '../src/workflowOrchestrator';
import { invokeAgent } from '../src/lib/invokeAgent';
import { recordMetrics } from '../src/lib/metrics';

jest.mock('../src/lib/invokeAgent', () => ({
  invokeAgent: jest.fn()
}));

const invokeAgentMock = invokeAgent as jest.MockedFunction<typeof invokeAgent>;

describe('Workflow integration', () => {
  let workspaceRoot: string;

  beforeEach(async () => {
    jest.clearAllMocks();
    workspaceRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'workflow-integration-'));
  });

  afterEach(async () => {
    await fs.rm(workspaceRoot, { recursive: true, force: true });
  });

  it('runs all phases sequentially and records analytics metrics', async () => {
    const feature = 'integration-feature';

    invokeAgentMock.mockImplementation(async options => {
      switch (options.agent) {
        case 'bmad-analyst':
          return {
            ok: true,
            outputText:
              '# Spec\n\n## Functional Requirements\n- [ ] Demo requirement\n\n## Open Questions\n- Outstanding question\n',
            command: 'mock-spec'
          };
        case 'bmad-architect':
          return {
            ok: true,
            outputText:
              '# Plan\n\n## Architecture Decisions\n- Service oriented\n\n## Risks & Mitigations\n- Integration risk\n',
            command: 'mock-plan'
          };
        case 'bmad-pm':
          return {
            ok: true,
            outputText: '# Tasks\n\n- [ ] Implement API\n  - src/api/index.ts\n- [x] Write unit tests\n',
            command: 'mock-tasks'
          };
        case 'bmad-developer':
          return {
            ok: true,
            outputText: `# Implementation notes for ${options.metadata?.taskIndex}`,
            command: 'mock-impl'
          };
        default:
          throw new Error(`Unexpected agent ${options.agent}`);
      }
    });

    const start = Date.now();
    const results = await runWorkflow({ workspaceRoot, feature });
    const runtimeMs = Date.now() - start;

    expect(results.map(result => result.phase)).toEqual(['specify', 'plan', 'tasks', 'implement']);

    const featureDir = path.join(workspaceRoot, 'specs', feature);
    const specContent = await fs.readFile(path.join(featureDir, 'spec.md'), 'utf8');
    const planContent = await fs.readFile(path.join(featureDir, 'plan.md'), 'utf8');
    const tasksContent = await fs.readFile(path.join(featureDir, 'tasks.md'), 'utf8');
    expect(specContent).toContain('Demo requirement');
    expect(planContent).toContain('Service oriented');
    expect(tasksContent).toContain('Implement API');

    const specifyContext = JSON.parse(
      await fs.readFile(path.join(featureDir, 'context', 'specify.json'), 'utf8')
    );
    const planContext = JSON.parse(
      await fs.readFile(path.join(featureDir, 'context', 'plan.json'), 'utf8')
    );
    const taskContext = JSON.parse(
      await fs.readFile(path.join(featureDir, 'context', 'tasks.json'), 'utf8')
    );
    expect(specifyContext.data.requirements).toHaveLength(1);
    expect(planContext.data.architecture).toEqual(['Service oriented']);
    expect(taskContext.data.tasks).toHaveLength(2);

    const implementationDir = path.join(featureDir, 'implementation');
    const implementationFiles = await fs.readdir(implementationDir);
    expect(implementationFiles).toHaveLength(2);

    const analyticsRunner = jest.fn(async () => undefined);
    const metricsPayload = await recordMetrics(
      { coveragePct: 92.5, runtimeMs, success: true },
      { feature, phase: 'workflow', runner: analyticsRunner }
    );

    expect(metricsPayload).toMatchObject({ coveragePct: 92.5, runtimeMs, success: true, feature });
    expect(analyticsRunner).toHaveBeenCalledWith(
      'analytics.recordMetrics',
      expect.objectContaining({ feature, runtimeMs, success: true })
    );
  });
});
