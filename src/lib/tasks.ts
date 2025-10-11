import type { TaskContext } from './contextStore';

export interface TaskItem {
  index: number;
  title: string;
  raw: string;
  completed: boolean;
}

const TASK_PATTERN = /^- \[( |x|X)\]\s+(.*)$/;

export function parseTasksChecklist(markdown: string): TaskItem[] {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const tasks: TaskItem[] = [];

  for (const line of lines) {
    const match = line.match(TASK_PATTERN);
    if (!match) continue;
    const [, mark, body] = match;
    const title = body.trim();
    if (!title) continue;
    tasks.push({
      index: tasks.length + 1,
      title,
      raw: line.trim(),
      completed: mark.toLowerCase() === 'x'
    });
  }

  return tasks;
}

export function parseTasksFromContext(context: TaskContext): TaskItem[] {
  return context.tasks.map((task, idx) => ({
    index: idx + 1,
    title: task.title,
    raw: task.raw || task.title,
    completed: Boolean(task.completed)
  }));
}

export function slugifyTaskTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}
