import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import { mirrorAgentOsDirectory, mirrorAgentOsFile } from '../src/lib/agentOs';

const featureName = 'test-feature';

describe('Agent OS mirroring helpers', () => {
  let workspaceRoot: string;
  let sourceDir: string;

  beforeEach(async () => {
    workspaceRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'agent-os-test-'));
    sourceDir = path.join(workspaceRoot, 'source');
    await fs.mkdir(sourceDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(workspaceRoot, { recursive: true, force: true });
  });

  it('writes files into the agent OS product directory', async () => {
    const resultPath = await mirrorAgentOsFile({
      workspaceRoot,
      featureName,
      relativePath: path.join('docs', 'plan.md'),
      content: '# Plan\n'
    });

    const expectedPath = path.join(workspaceRoot, '.agent-os', 'product', featureName, 'docs', 'plan.md');
    expect(resultPath).toBe(expectedPath);
    const mirroredContent = await fs.readFile(expectedPath, 'utf8');
    expect(mirroredContent).toBe('# Plan\n');
  });

  it('mirrors directories recursively into Agent OS', async () => {
    const nestedDir = path.join(sourceDir, 'nested');
    await fs.mkdir(nestedDir, { recursive: true });
    await fs.writeFile(path.join(sourceDir, 'root.txt'), 'root file');
    await fs.writeFile(path.join(nestedDir, 'child.txt'), 'child file');

    await mirrorAgentOsDirectory({ workspaceRoot, featureName, sourceDir });

    const destination = path.join(workspaceRoot, '.agent-os', 'product', featureName, path.basename(sourceDir));
    const mirroredFiles = await fs.readdir(destination);
    expect(mirroredFiles.sort()).toEqual(['nested', 'root.txt']);
    const childContent = await fs.readFile(path.join(destination, 'nested', 'child.txt'), 'utf8');
    expect(childContent).toBe('child file');
  });

  it('ignores missing directories without throwing', async () => {
    await expect(
      mirrorAgentOsDirectory({ workspaceRoot, featureName, sourceDir: path.join(workspaceRoot, 'missing') })
    ).resolves.toBeUndefined();
  });
});
