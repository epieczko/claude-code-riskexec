import fs from 'fs/promises';
import path from 'path';

export async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

export async function readFileIfExists(
  filePath: string
): Promise<string | null> {
  try {
    const resolved = path.resolve(filePath);
    const content = await fs.readFile(resolved, 'utf8');
    return content;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

export async function writeFileAtomic(
  filePath: string,
  content: string
): Promise<void> {
  const resolved = path.resolve(filePath);
  await ensureDir(path.dirname(resolved));
  await fs.writeFile(resolved, content, 'utf8');
}
