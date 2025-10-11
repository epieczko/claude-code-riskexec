import fs from 'fs/promises';
import path from 'path';
import fsExtra from 'fs-extra';
import { ensureDir } from './files';
import { createLogger } from './logger';

const AGENT_OS_ROOT = '.agent-os';
const PRODUCT_SUBDIR = 'product';
const agentOsLogger = createLogger('agent-os');

const PHASE_ARTIFACTS = ['spec.md', 'plan.md', 'tasks.md', 'implementation'];

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
  const payload = typeof content === 'string' ? content : new Uint8Array(content);
  await fs.writeFile(targetPath, payload);
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

  const destinationRoot = path.resolve(workspaceRoot, AGENT_OS_ROOT, PRODUCT_SUBDIR, featureName);
  await ensureDir(destinationRoot);

  const mirroredEntries: string[] = [];

  if (targetSubdir) {
    const destination = path.join(destinationRoot, targetSubdir);
    fsExtra.copySync(resolvedSource, destination, { overwrite: true, errorOnExist: false });
    mirroredEntries.push(...listPathsRelativeToRoot(destination, destinationRoot));
  } else {
    for (const artifact of PHASE_ARTIFACTS) {
      const sourcePath = path.join(resolvedSource, artifact);
      if (!fsExtra.pathExistsSync(sourcePath)) {
        continue;
      }

      const destination = path.join(destinationRoot, artifact);
      fsExtra.copySync(sourcePath, destination, { overwrite: true, errorOnExist: false });
      mirroredEntries.push(...listPathsRelativeToRoot(destination, destinationRoot));
    }
  }

  if (mirroredEntries.length > 0) {
    const sortedEntries = Array.from(new Set(mirroredEntries)).sort();
    const summary = sortedEntries.join(', ');
    const message = `Mirrored ${sortedEntries.length} artifact${
      sortedEntries.length === 1 ? '' : 's'
    } to Agent OS for ${featureName}: ${summary}`;
    agentOsLogger.info(message);
  } else {
    agentOsLogger.info(`No artifacts mirrored from ${resolvedSource} for ${featureName}.`);
  }
}

function listPathsRelativeToRoot(targetPath: string, root: string): string[] {
  if (!fsExtra.pathExistsSync(targetPath)) {
    return [];
  }

  const stats = fsExtra.statSync(targetPath);
  if (!stats.isDirectory()) {
    return [path.relative(root, targetPath) || path.basename(targetPath)];
  }

  const files: string[] = [];
  const stack: string[] = [targetPath];

  while (stack.length > 0) {
    const current = stack.pop() as string;
    const dirents = fsExtra.readdirSync(current, { withFileTypes: true });

    if (dirents.length === 0) {
      const relativeDir = path.relative(root, current);
      files.push(relativeDir.endsWith(path.sep) ? relativeDir : `${relativeDir}${path.sep}`);
      continue;
    }

    for (const dirent of dirents) {
      const fullPath = path.join(current, dirent.name);
      if (dirent.isDirectory()) {
        stack.push(fullPath);
      } else if (dirent.isFile()) {
        files.push(path.relative(root, fullPath));
      }
    }
  }

  return files.sort();
}
