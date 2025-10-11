import {
  parseTasksChecklist,
  parseTasksFromContext,
  slugifyTaskTitle,
} from '../src/lib/tasks';
import { makeTaskContext } from './factories';

describe('parseTasksChecklist', () => {
  it('returns an empty array when no tasks are present', () => {
    expect(parseTasksChecklist('')).toEqual([]);
    expect(parseTasksChecklist('Some text without checkboxes')).toEqual([]);
  });

  it('parses tasks with completion state and raw content', () => {
    const markdown = `- [ ] Write unit tests\n- [x] Update documentation`;
    const tasks = parseTasksChecklist(markdown);

    expect(tasks).toHaveLength(2);
    expect(tasks[0]).toMatchObject({
      index: 1,
      title: 'Write unit tests',
      completed: false,
    });
    expect(tasks[1]).toMatchObject({
      index: 2,
      title: 'Update documentation',
      completed: true,
    });
    expect(tasks[0].raw).toBe('- [ ] Write unit tests');
  });

  it('ignores malformed checklist entries', () => {
    const markdown = `- [] Invalid\n- [ ] Valid task\n  - [ ] Nested task`;
    const tasks = parseTasksChecklist(markdown);
    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe('Valid task');
  });
});

describe('parseTasksFromContext', () => {
  it('converts stored context tasks into checklist items', () => {
    const context = makeTaskContext([
      { title: 'Implement feature', completed: true },
      { title: 'Write docs' },
    ]);

    const tasks = parseTasksFromContext(context);
    expect(tasks).toHaveLength(2);
    expect(tasks[0]).toMatchObject({
      index: 1,
      title: 'Implement feature',
      completed: true,
    });
    expect(tasks[1].raw).toContain('Write docs');
  });
});

describe('slugifyTaskTitle', () => {
  it('creates URL-friendly slugs from task titles', () => {
    expect(slugifyTaskTitle('Implement OAuth flow')).toBe(
      'implement-oauth-flow'
    );
    expect(slugifyTaskTitle('  Trim --- punctuation!! ')).toBe(
      'trim-punctuation'
    );
  });

  it('limits slug length to 80 characters', () => {
    const longTitle = 'a'.repeat(120);
    expect(slugifyTaskTitle(longTitle)).toHaveLength(80);
  });
});
