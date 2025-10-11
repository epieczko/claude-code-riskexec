import fs from 'fs/promises';
import path from 'path';
import process from 'process';

import { CURRENT_CONTEXT_SCHEMA_VERSION, listStoredContexts } from '../src/lib/contextStore';
import type { PlanContext, SpecContext, TaskContext } from '../src/lib/contextStore';

interface ValidationResult {
  file: string;
  messages: string[];
}

type Validator = (data: unknown, envelope: { phase: string; file: string }) => string[];

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === 'string');
}

function validateRequirement(requirement: unknown, index: number, file: string): string[] {
  if (typeof requirement !== 'object' || requirement === null) {
    return [`${file} → requirements[${index}] must be an object`];
  }

  const messages: string[] = [];
  const candidate = requirement as Partial<SpecContext['requirements'][number]>;

  if (typeof candidate.id !== 'string' || !candidate.id.trim()) {
    messages.push(`${file} → requirements[${index}].id must be a non-empty string`);
  }
  if (typeof candidate.text !== 'string' || !candidate.text.trim()) {
    messages.push(`${file} → requirements[${index}].text must be a non-empty string`);
  }
  if (typeof candidate.completed !== 'boolean') {
    messages.push(`${file} → requirements[${index}].completed must be a boolean`);
  }

  return messages;
}

const specValidator: Validator = (data, { file }) => {
  const messages: string[] = [];
  const candidate = data as Partial<SpecContext> | null;

  if (!candidate || typeof candidate !== 'object') {
    return [`${file} → data must be an object`];
  }

  if (!Array.isArray(candidate.requirements)) {
    messages.push(`${file} → data.requirements must be an array`);
  } else {
    candidate.requirements.forEach((req, index) => {
      messages.push(...validateRequirement(req, index, file));
    });
  }

  if (!isStringArray(candidate.openQuestions)) {
    messages.push(`${file} → data.openQuestions must be an array of strings`);
  }

  return messages;
};

const planValidator: Validator = (data, { file }) => {
  const messages: string[] = [];
  const candidate = data as Partial<PlanContext> | null;

  if (!candidate || typeof candidate !== 'object') {
    return [`${file} → data must be an object`];
  }

  if (!isStringArray(candidate.architecture)) {
    messages.push(`${file} → data.architecture must be an array of strings`);
  }

  if (!isStringArray(candidate.risks)) {
    messages.push(`${file} → data.risks must be an array of strings`);
  }

  return messages;
};

function validateTaskItem(task: unknown, index: number, file: string): string[] {
  if (typeof task !== 'object' || task === null) {
    return [`${file} → data.tasks[${index}] must be an object`];
  }

  const messages: string[] = [];
  const candidate = task as Partial<TaskContext['tasks'][number]>;

  if (typeof candidate.id !== 'string' || !candidate.id.trim()) {
    messages.push(`${file} → data.tasks[${index}].id must be a non-empty string`);
  }
  if (typeof candidate.title !== 'string' || !candidate.title.trim()) {
    messages.push(`${file} → data.tasks[${index}].title must be a non-empty string`);
  }
  if (typeof candidate.completed !== 'boolean') {
    messages.push(`${file} → data.tasks[${index}].completed must be a boolean`);
  }
  if (!isStringArray(candidate.references)) {
    messages.push(`${file} → data.tasks[${index}].references must be an array of strings`);
  }
  if (!isStringArray(candidate.notes)) {
    messages.push(`${file} → data.tasks[${index}].notes must be an array of strings`);
  }
  if (typeof candidate.raw !== 'string' || !candidate.raw.trim()) {
    messages.push(`${file} → data.tasks[${index}].raw must be a non-empty string`);
  }

  return messages;
}

const taskValidator: Validator = (data, { file }) => {
  const messages: string[] = [];
  const candidate = data as Partial<TaskContext> | null;

  if (!candidate || typeof candidate !== 'object') {
    return [`${file} → data must be an object`];
  }

  if (!Array.isArray(candidate.tasks)) {
    messages.push(`${file} → data.tasks must be an array`);
  } else {
    candidate.tasks.forEach((task, index) => {
      messages.push(...validateTaskItem(task, index, file));
    });
  }

  if (typeof candidate.progress !== 'string' || !candidate.progress.trim()) {
    messages.push(`${file} → data.progress must be a non-empty string`);
  }

  return messages;
};

const validators: Record<string, Validator> = {
  specify: specValidator,
  plan: planValidator,
  tasks: taskValidator
};

async function validateFile(file: string): Promise<ValidationResult | null> {
  const messages: string[] = [];
  let parsed: any;

  try {
    const raw = await fs.readFile(file, 'utf8');
    parsed = JSON.parse(raw);
  } catch (error) {
    return {
      file,
      messages: [`${file} → failed to read or parse JSON: ${(error as Error).message}`]
    };
  }

  if (!parsed || typeof parsed !== 'object') {
    return { file, messages: [`${file} → expected a JSON object`] };
  }

  if (typeof parsed.feature !== 'string' || !parsed.feature.trim()) {
    messages.push(`${file} → feature must be a non-empty string`);
  }
  if (typeof parsed.phase !== 'string' || !parsed.phase.trim()) {
    messages.push(`${file} → phase must be a non-empty string`);
  }
  if (typeof parsed.savedAt !== 'string' || !parsed.savedAt.trim()) {
    messages.push(`${file} → savedAt must be an ISO timestamp string`);
  }
  if (typeof parsed.schemaVersion !== 'number') {
    messages.push(`${file} → schemaVersion must be a number`);
  } else if (parsed.schemaVersion !== CURRENT_CONTEXT_SCHEMA_VERSION) {
    messages.push(
      `${file} → schemaVersion ${parsed.schemaVersion} does not match expected ${CURRENT_CONTEXT_SCHEMA_VERSION}`
    );
  }

  const validator = validators[parsed.phase];
  if (validator) {
    messages.push(...validator(parsed.data, { phase: parsed.phase, file }));
  } else if (parsed.data !== undefined) {
    if (typeof parsed.data !== 'object' || parsed.data === null) {
      messages.push(`${file} → data must be an object`);
    }
  }

  if (messages.length === 0) {
    return null;
  }

  return { file, messages };
}

async function main(): Promise<void> {
  const workspaceRoot = process.env.SPEC_KIT_ROOT || process.cwd();
  const specsDir = path.join(workspaceRoot, 'specs');
  const exists = await fs
    .access(specsDir)
    .then(() => true)
    .catch(() => false);

  if (!exists) {
    console.warn(`No specs directory found at ${specsDir}; nothing to validate.`);
    return;
  }

  const files = await listStoredContexts(workspaceRoot);

  if (!files.length) {
    console.log('No context files found to validate.');
    return;
  }

  const results = await Promise.all(files.map(validateFile));
  const failures = results.filter((result): result is ValidationResult => Boolean(result && result.messages.length));

  if (failures.length) {
    console.error('Context validation failed:\n');
    failures.forEach(result => {
      result.messages.forEach(message => console.error(` - ${message}`));
    });
    process.exitCode = 1;
    return;
  }

  console.log(`Validated ${files.length} context file${files.length === 1 ? '' : 's'} successfully.`);
}

if (require.main === module) {
  main().catch(error => {
    console.error(`Context validation encountered an error: ${(error as Error).message}`);
    process.exit(1);
  });
}
