import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import { ensureDir, readFileIfExists, writeFileAtomic } from '../src/lib/files';

describe('file helpers', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'files-test-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('ensures nested directories exist', async () => {
    const nestedDir = path.join(tempDir, 'nested', 'dir');
    await ensureDir(nestedDir);
    const stats = await fs.stat(nestedDir);
    expect(stats.isDirectory()).toBe(true);
  });

  it('reads existing files and returns null for missing files', async () => {
    const targetFile = path.join(tempDir, 'example.txt');
    await writeFileAtomic(targetFile, 'hello world');

    await expect(readFileIfExists(targetFile)).resolves.toBe('hello world');
    await expect(readFileIfExists(path.join(tempDir, 'missing.txt'))).resolves.toBeNull();
  });

  it('writes files atomically by creating parent directories automatically', async () => {
    const targetFile = path.join(tempDir, 'deep', 'path', 'file.txt');
    await writeFileAtomic(targetFile, 'payload');

    const content = await fs.readFile(targetFile, 'utf8');
    expect(content).toBe('payload');
    const parentStats = await fs.stat(path.dirname(targetFile));
    expect(parentStats.isDirectory()).toBe(true);
  });
});
