import fs from 'fs/promises';
import path from 'path';
import { ensureDir } from './files';

const AGENT_OS_ROOT = '.agent-os';
const PRODUCT_SUBDIR = 'product';

interface MirrorFileOptions {
  workspaceRoot: string;
  featureName: string;
  relativePath: string;
  content: string | Buffer;
}

interface MirrorDirectoryOptions {
  workspaceRoot: string;
  featureName: string;
  sourceDir: string;
  targetSubdir?: string;
}

export async function mirrorAgentOsFile(options: MirrorFileOptions): Promise<string> {
  const { workspaceRoot, featureName, relativePath, content } = options;
  const targetPath = path.resolve(
    workspaceRoot,
    AGENT_OS_ROOT,
    PRODUCT_SUBDIR,
    featureName,
    relativePath
  );
  await ensureDir(path.dirname(targetPath));
  await fs.writeFile(targetPath, content);
  return targetPath;
}

export async function mirrorAgentOsDirectory(options: MirrorDirectoryOptions): Promise<void> {
  const { workspaceRoot, featureName, sourceDir, targetSubdir } = options;
  const resolvedSource = path.resolve(sourceDir);
  try {
    const stats = await fs.stat(resolvedSource);
    if (!stats.isDirectory()) {
      return;
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return;
    }
    throw error;
  }

  const destination = path.resolve(
    workspaceRoot,
    AGENT_OS_ROOT,
    PRODUCT_SUBDIR,
    featureName,
    targetSubdir ?? path.basename(resolvedSource)
  );

  await fs.rm(destination, { recursive: true, force: true });
  await copyDirectory(resolvedSource, destination);
}

async function copyDirectory(source: string, destination: string): Promise<void> {
  await ensureDir(destination);
  const entries = await fs.readdir(source, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const destinationPath = path.join(destination, entry.name);

    if (entry.isDirectory()) {
      await copyDirectory(sourcePath, destinationPath);
    } else if (entry.isFile()) {
      await ensureDir(path.dirname(destinationPath));
      const data = await fs.readFile(sourcePath);
      await fs.writeFile(destinationPath, data);
    }
  }
}
