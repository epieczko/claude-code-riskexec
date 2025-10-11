import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import { mirrorAgentOsDirectory } from '../src/lib/agentOs';

describe('mirrorAgentOsDirectory phase artifacts', () => {
  let workspaceRoot: string;
  const featureName = 'demo-feature';
  let featureDir: string;

  beforeEach(async () => {
    workspaceRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'agent-os-phase-'));
    featureDir = path.join(workspaceRoot, 'specs', featureName);
    await fs.mkdir(path.join(featureDir, 'implementation'), { recursive: true });
    await fs.writeFile(path.join(featureDir, 'spec.md'), '# Spec\n', 'utf8');
    await fs.writeFile(path.join(featureDir, 'plan.md'), '# Plan\n', 'utf8');
    await fs.writeFile(path.join(featureDir, 'tasks.md'), '# Tasks\n- [ ] Item\n', 'utf8');
    await fs.writeFile(path.join(featureDir, 'implementation', 'task-1.md'), '# Log 1\n', 'utf8');
    await fs.writeFile(path.join(featureDir, 'implementation', 'task-2.md'), '# Log 2\n', 'utf8');
    await fs.mkdir(path.join(featureDir, 'context'), { recursive: true });
    await fs.writeFile(path.join(featureDir, 'context', 'tasks.json'), '{"tasks": []}', 'utf8');
  });

  afterEach(async () => {
    await fs.rm(workspaceRoot, { recursive: true, force: true });
  });

  it('mirrors spec, plan, tasks, and implementation logs into Agent OS root', async () => {
    await mirrorAgentOsDirectory({ workspaceRoot, featureName, sourceDir: featureDir });

    const productRoot = path.join(workspaceRoot, '.agent-os', 'product', featureName);
    await expect(fs.readFile(path.join(productRoot, 'spec.md'), 'utf8')).resolves.toBe('# Spec\n');
    await expect(fs.readFile(path.join(productRoot, 'plan.md'), 'utf8')).resolves.toBe('# Plan\n');
    await expect(fs.readFile(path.join(productRoot, 'tasks.md'), 'utf8')).resolves.toBe('# Tasks\n- [ ] Item\n');

    const implementationFiles = await fs.readdir(path.join(productRoot, 'implementation'));
    expect(implementationFiles.sort()).toEqual(['task-1.md', 'task-2.md']);
    const logOne = await fs.readFile(path.join(productRoot, 'implementation', 'task-1.md'), 'utf8');
    const logTwo = await fs.readFile(path.join(productRoot, 'implementation', 'task-2.md'), 'utf8');
    expect(logOne).toBe('# Log 1\n');
    expect(logTwo).toBe('# Log 2\n');

    await expect(fs.stat(path.join(productRoot, 'context'))).rejects.toThrow();
  });
});
