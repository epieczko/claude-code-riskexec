#!/usr/bin/env ts-node
import fs from 'fs/promises';
import path from 'path';
import { ensureDir } from '../src/lib/files';

interface CleanupOptions {
  workspaceRoot: string;
  days: number;
  mode: 'archive' | 'purge';
  feature?: string;
  verbose: boolean;
  dryRun: boolean;
}

interface ContextFile {
  feature: string;
  phase: string;
  filePath: string;
  mtimeMs: number;
}

function parseArgs(argv: string[]): CleanupOptions {
  const options: CleanupOptions = {
    workspaceRoot: process.cwd(),
    days: 14,
    mode: 'archive',
    verbose: false,
    dryRun: false
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token) continue;

    if (token === '--workspace' || token === '-w') {
      options.workspaceRoot = path.resolve(argv[++i] || options.workspaceRoot);
    } else if (token === '--days' || token === '-d') {
      const value = Number(argv[++i]);
      if (!Number.isNaN(value) && value > 0) {
        options.days = value;
      }
    } else if (token === '--purge') {
      options.mode = 'purge';
    } else if (token === '--archive') {
      options.mode = 'archive';
    } else if (token === '--feature' || token === '-f') {
      options.feature = argv[++i];
    } else if (token === '--verbose' || token === '-v') {
      options.verbose = true;
    } else if (token === '--dry-run') {
      options.dryRun = true;
    } else if (token.startsWith('--mode=')) {
      const mode = token.split('=')[1];
      if (mode === 'archive' || mode === 'purge') {
        options.mode = mode;
      }
    }
  }

  return options;
}

async function collectContextFiles(options: CleanupOptions): Promise<ContextFile[]> {
  const specsDir = path.join(options.workspaceRoot, 'specs');
  const featureDirs = await fs.readdir(specsDir, { withFileTypes: true }).catch(() => []);
  const contextFiles: ContextFile[] = [];

  for (const dirent of featureDirs) {
    if (!dirent.isDirectory()) {
      continue;
    }
    const feature = dirent.name;
    if (options.feature && feature !== options.feature) {
      continue;
    }

    const contextDir = path.join(specsDir, feature, 'context');
    const files = await fs.readdir(contextDir, { withFileTypes: true }).catch(() => []);
    for (const file of files) {
      if (!file.isFile() || !file.name.endsWith('.json')) {
        continue;
      }
      const filePath = path.join(contextDir, file.name);
      const stat = await fs.stat(filePath);
      contextFiles.push({
        feature,
        phase: path.basename(file.name, '.json'),
        filePath,
        mtimeMs: stat.mtimeMs
      });
    }
  }

  return contextFiles;
}

async function archiveFile(context: ContextFile, options: CleanupOptions): Promise<void> {
  const archiveDir = path.join(path.dirname(path.dirname(context.filePath)), 'context-archive');
  await ensureDir(archiveDir);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const destination = path.join(archiveDir, `${context.phase}-${timestamp}.json`);

  if (options.verbose || options.dryRun) {
    console.log(`${options.dryRun ? '[dry-run] ' : ''}Archive ${context.filePath} → ${destination}`);
  }
  if (!options.dryRun) {
    await fs.rename(context.filePath, destination);
  }
}

async function purgeFile(context: ContextFile, options: CleanupOptions): Promise<void> {
  if (options.verbose || options.dryRun) {
    console.log(`${options.dryRun ? '[dry-run] ' : ''}Remove ${context.filePath}`);
  }
  if (!options.dryRun) {
    await fs.unlink(context.filePath);
  }
}

export async function cleanupContext(options: CleanupOptions): Promise<{ processed: number }> {
  const contexts = await collectContextFiles(options);
  const cutoff = Date.now() - options.days * 24 * 60 * 60 * 1000;
  let processed = 0;

  for (const context of contexts) {
    if (context.mtimeMs >= cutoff) {
      continue;
    }
    processed += 1;
    if (options.mode === 'purge') {
      await purgeFile(context, options);
    } else {
      await archiveFile(context, options);
    }
  }

  if (options.verbose) {
    console.log(`Processed ${processed} context snapshot${processed === 1 ? '' : 's'}.`);
  }

  return { processed };
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  try {
    const { processed } = await cleanupContext(options);
    console.log(`Context cleanup complete. ${processed} file${processed === 1 ? '' : 's'} handled.`);
  } catch (error) {
    console.error(`Context cleanup failed: ${(error as Error).message}`);
    process.exitCode = 1;
  }
}

if (require.main === module) {
  void main();
}
