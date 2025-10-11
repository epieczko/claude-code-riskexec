import path from 'path';
import type {
  PlanContext,
  SpecContext,
  TaskContext,
} from '../src/lib/contextStore';

type RequirementInput = string | { text: string; completed?: boolean };

type TaskInput = {
  title: string;
  completed?: boolean;
  references?: string[];
  notes?: string[];
};

export function makeSpecContext(
  requirements: RequirementInput[] = [],
  openQuestions: string[] = []
): SpecContext {
  return {
    requirements: requirements.map((req, index) => {
      if (typeof req === 'string') {
        return { id: `req-${index + 1}`, text: req, completed: false };
      }
      return {
        id: `req-${index + 1}`,
        text: req.text,
        completed: Boolean(req.completed),
      };
    }),
    openQuestions: [...openQuestions],
  };
}

export function makeSpecMarkdown(context: SpecContext): string {
  const requirements = context.requirements
    .map((req) => `- [${req.completed ? 'x' : ' '}] ${req.text}`)
    .join('\n');
  const questions = context.openQuestions
    .map((question) => `- ${question}`)
    .join('\n');
  const sections = [
    '# Feature Spec',
    '',
    '## Functional Requirements',
    requirements,
    '',
    '## Open Questions',
    questions,
  ];
  return sections.join('\n').trim() + '\n';
}

export function makePlanContext(
  architecture: string[] = [],
  risks: string[] = []
): PlanContext {
  return { architecture: [...architecture], risks: [...risks] };
}

export function makePlanMarkdown(context: PlanContext): string {
  const architecture = context.architecture
    .map((item) => `- ${item}`)
    .join('\n');
  const risks = context.risks.map((item) => `- ${item}`).join('\n');
  const sections = [
    '# Implementation Plan',
    '',
    '## Architecture Decisions',
    architecture,
    '',
    '## Risks & Mitigations',
    risks,
  ];
  return sections.join('\n').trim() + '\n';
}

export function makeTaskContext(tasks: TaskInput[] = []): TaskContext {
  return {
    tasks: tasks.map((task, index) => ({
      id: `task-${index + 1}`,
      title: task.title,
      completed: Boolean(task.completed),
      references: task.references ? [...task.references] : [],
      notes: task.notes ? [...task.notes] : [],
      raw: `- [${task.completed ? 'x' : ' '}] ${task.title}`,
    })),
    progress: tasks.length
      ? `${tasks.filter((task) => task.completed).length}/${tasks.length} completed (${Math.round(
          (tasks.filter((task) => task.completed).length / tasks.length) * 100
        )}%)`
      : '0/0 completed (0%)',
  };
}

export function makeTasksMarkdown(tasks: TaskInput[] = []): string {
  const lines: string[] = ['# Tasks', ''];
  tasks.forEach((task) => {
    lines.push(`- [${task.completed ? 'x' : ' '}] ${task.title}`);
    task.references?.forEach((reference) => {
      lines.push(`  - ${reference}`);
    });
    task.notes?.forEach((note) => {
      lines.push(`  ${note}`);
    });
  });
  if (lines[lines.length - 1] !== '') {
    lines.push('');
  }
  return lines.join('\n');
}

export function joinWorkspacePath(...parts: string[]): string {
  return path.join(...parts);
}
