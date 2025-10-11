#!/usr/bin/env ts-node

import fs from 'fs';
import path from 'path';

function extractDocblock(content: string): { name: string; comment: string } | null {
  const pattern = /\/\*\*([\s\S]*?)\*\/\s*export class (\w+)/m;
  const match = content.match(pattern);
  if (!match) {
    return null;
  }
  const [, rawComment, className] = match;
  const cleaned = rawComment
    .split('\n')
    .map(line => line.replace(/^\s*\*\s?/, ''))
    .map(line => line.trimEnd())
    .join('\n')
    .trim();
  return { name: className, comment: cleaned };
}

function toMarkdown(entry: { name: string; comment: string; file: string }): string {
  const lines = [`## ${entry.name}`, '', `**Source:** \`${entry.file}\``, ''];
  lines.push(entry.comment);
  lines.push('');
  return lines.join('\n');
}

function generate(): void {
  const phasesDir = path.join(__dirname, '..', 'src', 'phases');
  const targetPath = path.join(__dirname, '..', 'docs', 'api', 'phase-modules.md');
  const files = fs
    .readdirSync(phasesDir)
    .filter(name => name.endsWith('Phase.ts'))
    .filter(name => name !== 'types.ts');

  const sections: string[] = ['# Phase Handlers', '', 'Automatically generated from JSDoc comments in `src/phases`.'];

  files.forEach(file => {
    const fullPath = path.join(phasesDir, file);
    const content = fs.readFileSync(fullPath, 'utf8');
    const docblock = extractDocblock(content);
    if (!docblock) {
      return;
    }
    sections.push(
      toMarkdown({
        name: docblock.name,
        comment: docblock.comment,
        file: path.relative(path.join(__dirname, '..'), fullPath)
      })
    );
  });

  sections.push('');
  fs.writeFileSync(targetPath, `${sections.join('\n')}\n`);
}

generate();
