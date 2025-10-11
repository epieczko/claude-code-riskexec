import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import {
  CURRENT_CONTEXT_SCHEMA_VERSION,
  ensureContextSetup,
  listStoredContexts,
  loadContext,
  loadContextEnvelope,
  registerRunMcpCommand,
  saveContext,
} from '../src/lib/contextStore';
import { makeSpecContext } from './factories';

describe('context store persistence', () => {
  let workspaceRoot: string;
  const feature = 'context-feature';

  beforeEach(async () => {
    workspaceRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'context-store-'));
    registerRunMcpCommand(null);
  });

  afterEach(async () => {
    await fs.rm(workspaceRoot, { recursive: true, force: true });
  });

  it('saves and loads context envelopes and syncs through MCP runner when requested', async () => {
    const context = makeSpecContext(['Requirement A'], ['Question?']);
    const runner = jest.fn().mockResolvedValue(undefined);
    const contextPath = await saveContext(feature, 'specify', context, {
      workspaceRoot,
      syncToMemory: true,
      runMcpCommand: runner,
      memoryCommand: 'memory.save',
    });

    expect(await fs.stat(contextPath)).toBeTruthy();
    expect(runner).toHaveBeenCalledWith(
      'memory.save',
      expect.objectContaining({ feature, phase: 'specify', data: context })
    );

    const envelope = await loadContextEnvelope<typeof context>(
      feature,
      'specify',
      { workspaceRoot }
    );
    expect(envelope).not.toBeNull();
    expect(envelope?.schemaVersion).toBe(CURRENT_CONTEXT_SCHEMA_VERSION);

    const loaded = await loadContext<typeof context>(feature, 'specify', {
      workspaceRoot,
    });
    expect(loaded).toEqual(context);
  });

  it('handles missing and malformed context files gracefully', async () => {
    const missing = await loadContextEnvelope(feature, 'plan', {
      workspaceRoot,
    });
    expect(missing).toBeNull();

    const contextDir = path.join(workspaceRoot, 'specs', feature, 'context');
    await fs.mkdir(contextDir, { recursive: true });
    const targetPath = path.join(contextDir, 'plan.json');
    await fs.writeFile(targetPath, '{ invalid json');

    const malformed = await loadContextEnvelope(feature, 'plan', {
      workspaceRoot,
    });
    expect(malformed).toBeNull();
  });

  it('prepares context directories and lists stored context files', async () => {
    await ensureContextSetup(feature, workspaceRoot);
    const contextDir = path.join(workspaceRoot, 'specs', feature, 'context');
    const contextPath = path.join(contextDir, 'tasks.json');
    await fs.writeFile(
      contextPath,
      JSON.stringify({
        feature,
        phase: 'tasks',
        savedAt: new Date().toISOString(),
        schemaVersion: 1,
        data: {},
      })
    );

    const contexts = await listStoredContexts(workspaceRoot);
    expect(contexts).toContain(contextPath);
  });
});
