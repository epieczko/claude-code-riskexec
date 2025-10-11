import path from 'path';
import { ensureDir, readFileIfExists } from './files';

export interface FeaturePaths {
  featureDir: string;
  idea: string;
  spec: string;
  plan: string;
  tasks: string;
  architectureDir: string;
  implementationDir: string;
}

export interface PhaseFileDescriptor {
  key: string;
  path: string;
  description: string;
  required?: boolean;
}

export interface PhaseIOResult {
  files: Record<string, string | null>;
  missing: string[];
}

export function resolveFeaturePaths(featureDir: string): FeaturePaths {
  return {
    featureDir,
    idea: path.join(featureDir, 'idea.md'),
    spec: path.join(featureDir, 'spec.md'),
    plan: path.join(featureDir, 'plan.md'),
    tasks: path.join(featureDir, 'tasks.md'),
    architectureDir: path.join(featureDir, 'architecture'),
    implementationDir: path.join(featureDir, 'implementation'),
  };
}

export async function ensureFeaturePaths(
  featurePaths: FeaturePaths,
  extraDirs: string[] = []
): Promise<void> {
  await ensureDir(featurePaths.featureDir);
  await Promise.all(extraDirs.map((dir) => ensureDir(dir)));
}

export async function readPhaseFiles(
  descriptors: PhaseFileDescriptor[]
): Promise<PhaseIOResult> {
  const files: Record<string, string | null> = {};
  const missing: string[] = [];

  await Promise.all(
    descriptors.map(async (descriptor) => {
      const content = await readFileIfExists(descriptor.path);
      files[descriptor.key] = content;
      if (!content && descriptor.required) {
        missing.push(`${descriptor.description} (${descriptor.path})`);
      }
    })
  );

  return { files, missing };
}

export function assertPhasePrerequisites(
  result: PhaseIOResult,
  phaseName: string
): void {
  if (result.missing.length) {
    const details = result.missing.map((item) => ` - ${item}`).join('\n');
    throw new Error(
      `Missing required inputs for ${phaseName} phase:\n${details}`
    );
  }
}
