import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import SpecifyPhase from '../src/phases/SpecifyPhase';
import PlanPhase from '../src/phases/PlanPhase';
import TasksPhase from '../src/phases/TasksPhase';
import ImplementPhase from '../src/phases/ImplementPhase';
import type { TaskContext } from '../src/lib/contextStore';
import { invokeAgent } from '../src/lib/invokeAgent';

jest.mock('../src/lib/invokeAgent', () => ({
  invokeAgent: jest.fn()
}));

const invokeAgentMock = invokeAgent as jest.MockedFunction<typeof invokeAgent>;

describe('Phase handlers', () => {
  let workspaceRoot: string;
  let featureDir: string;

  beforeEach(async () => {
    jest.clearAllMocks();
    workspaceRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'phase-handlers-'));
    featureDir = path.join(workspaceRoot, 'specs', 'demo-feature');
  });

  afterEach(async () => {
    await fs.rm(workspaceRoot, { recursive: true, force: true });
  });

  it('SpecifyPhase writes spec file and stores parsed context', async () => {
    invokeAgentMock.mockResolvedValue({
      ok: true,
      outputText: '# Spec\n\n## Functional Requirements\n- [ ] First requirement\n\n## Open Questions\n- Need more research\n',
      command: 'mock'
    });

    const phase = new SpecifyPhase();
    const result = await phase.run({ featureName: 'demo-feature', featureDir, workspaceRoot });

    const specPath = path.join(featureDir, 'spec.md');
    const specContent = await fs.readFile(specPath, 'utf8');
    expect(specContent).toContain('First requirement');

    expect(result.details).toMatchObject({ agentCommand: 'mock' });

    const contextPath = path.join(featureDir, 'context', 'specify.json');
    const contextContent = await fs.readFile(contextPath, 'utf8');
    const envelope = JSON.parse(contextContent);
    expect(envelope.data.requirements).toHaveLength(1);
    expect(envelope.data.openQuestions).toEqual(['Need more research']);
  });

  it('PlanPhase writes plan and captures metadata about spec context', async () => {
    await fs.mkdir(featureDir, { recursive: true });
    await fs.writeFile(path.join(featureDir, 'spec.md'), '# Spec\n', 'utf8');

    invokeAgentMock.mockResolvedValue({
      ok: true,
      outputText: '# Plan\n\n## Architecture Decisions\n- Layered\n\n## Risks & Mitigations\n- Scope creep\n',
      command: 'mock-plan'
    });

    const phase = new PlanPhase();
    const result = await phase.run({
      featureName: 'demo-feature',
      featureDir,
      workspaceRoot,
      specContext: { requirements: [{ id: '1', text: 'R', completed: false }], openQuestions: ['Q'] }
    });

    expect(invokeAgentMock).toHaveBeenCalledWith(
      expect.objectContaining({
        agent: 'bmad-architect',
        metadata: expect.objectContaining({ specRequirements: '1', openQuestions: '1' })
      })
    );

    const planContent = await fs.readFile(path.join(featureDir, 'plan.md'), 'utf8');
    expect(planContent).toContain('Layered');
    expect(result.details).toMatchObject({ agentCommand: 'mock-plan', specContextLoaded: true });

    const contextEnvelope = JSON.parse(
      await fs.readFile(path.join(featureDir, 'context', 'plan.json'), 'utf8')
    );
    expect(contextEnvelope.data.architecture).toEqual(['Layered']);
  });

  it('TasksPhase writes tasks file and saves task progress context', async () => {
    await fs.mkdir(featureDir, { recursive: true });
    await fs.writeFile(path.join(featureDir, 'spec.md'), '# Spec\n', 'utf8');
    await fs.writeFile(path.join(featureDir, 'plan.md'), '# Plan\n', 'utf8');

    invokeAgentMock.mockResolvedValue({
      ok: true,
      outputText: '# Tasks\n\n- [ ] Do work\n  - src/file.ts\n- [x] Verify\n',
      command: 'mock-tasks'
    });

    const phase = new TasksPhase();
    const result = await phase.run({
      featureName: 'demo-feature',
      featureDir,
      workspaceRoot,
      specContext: { requirements: [{ id: '1', text: 'R', completed: false }], openQuestions: [] },
      planContext: { architecture: ['Layered'], risks: ['Scope'] }
    });

    expect(invokeAgentMock).toHaveBeenCalledWith(
      expect.objectContaining({
        agent: 'bmad-pm',
        metadata: expect.objectContaining({
          specRequirements: '1',
          architectureDecisions: '1',
          knownRisks: '1'
        })
      })
    );

    const tasksContent = await fs.readFile(path.join(featureDir, 'tasks.md'), 'utf8');
    expect(tasksContent).toContain('- [ ] Do work');
    expect(result.details).toMatchObject({ taskProgress: '1/2 completed (50%)' });

    const contextEnvelope = JSON.parse(
      await fs.readFile(path.join(featureDir, 'context', 'tasks.json'), 'utf8')
    );
    expect(contextEnvelope.data.tasks).toHaveLength(2);
    expect(contextEnvelope.data.progress).toBe('1/2 completed (50%)');
  });

  it('ImplementPhase executes each task and writes implementation logs', async () => {
    await fs.mkdir(featureDir, { recursive: true });
    await fs.writeFile(path.join(featureDir, 'spec.md'), '# Spec\n', 'utf8');
    await fs.writeFile(path.join(featureDir, 'plan.md'), '# Plan\n', 'utf8');
    await fs.writeFile(path.join(featureDir, 'tasks.md'), '# Tasks\n- [ ] Alpha\n- [ ] Beta\n', 'utf8');

    const mockContext: TaskContext = {
      tasks: [
        { id: '1', title: 'Alpha', completed: false, references: [], notes: [], raw: '- [ ] Alpha' },
        { id: '2', title: 'Beta', completed: false, references: [], notes: [], raw: '- [ ] Beta' }
      ],
      progress: '0/2 completed (0%)'
    };

    invokeAgentMock.mockImplementation(async options => ({
      ok: true,
      outputText: `# Implementation log for ${options.metadata?.taskIndex}`,
      command: 'mock-impl'
    }));

    const phase = new ImplementPhase();
    const result = await phase.run({
      featureName: 'demo-feature',
      featureDir,
      workspaceRoot,
      taskContext: mockContext
    });

    expect(invokeAgentMock).toHaveBeenCalledTimes(2);
    expect(result.logPaths).toHaveLength(2);
    const contents = await Promise.all(result.logPaths!.map(file => fs.readFile(file, 'utf8')));
    expect(contents[0]).toContain('Implementation log for 1');
    expect(contents[1]).toContain('Implementation log for 2');
  });
});
