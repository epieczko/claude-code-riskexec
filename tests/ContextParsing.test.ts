import { extractPlanContext, extractSpecContext, extractTaskContext } from '../src/lib/contextStore';
import {
  makePlanContext,
  makePlanMarkdown,
  makeSpecContext,
  makeSpecMarkdown,
  makeTaskContext,
  makeTasksMarkdown
} from './factories';

describe('Context parsing helpers', () => {
  it('parses specification requirements and questions', () => {
    const specContext = makeSpecContext([
      { text: 'Users can sign in', completed: true },
      { text: 'Users can reset passwords' }
    ], ['What about SSO?', 'Need audit logging?']);

    const context = extractSpecContext(makeSpecMarkdown(specContext));

    expect(context.requirements).toEqual(specContext.requirements);
    expect(context.openQuestions).toEqual(specContext.openQuestions);
  });

  it('supports alternate questions heading names', () => {
    const markdown = `# Feature Spec\n\n## Functional Requirements\n- [ ] Capture metrics\n\n## Outstanding Questions\n- How do we track latency?\n`;
    const context = extractSpecContext(markdown);
    expect(context.openQuestions).toEqual(['How do we track latency?']);
  });

  it('parses plan architecture and risks sections', () => {
    const planContext = makePlanContext(['Use modular services', 'Share auth module'], [
      'Migration complexity',
      'Third-party downtime'
    ]);

    const context = extractPlanContext(makePlanMarkdown(planContext));

    expect(context).toEqual(planContext);
  });

  it('parses task checklists including references and notes', () => {
    const markdown = makeTasksMarkdown([
      {
        title: 'Implement login',
        completed: false,
        references: ['src/auth/login.ts'],
        notes: ['Ensure OAuth fallback']
      },
      { title: 'Write tests', completed: true, notes: ['Document edge cases'] }
    ]);

    const context = extractTaskContext(markdown);
    const expectedContext = makeTaskContext([
      {
        title: 'Implement login',
        completed: false,
        references: ['src/auth/login.ts'],
        notes: ['Ensure OAuth fallback']
      },
      { title: 'Write tests', completed: true, notes: ['Document edge cases'] }
    ]);

    expect(context.tasks).toHaveLength(2);
    expect(context.tasks[0]).toMatchObject(expectedContext.tasks[0]);
    expect(context.tasks[1].completed).toBe(true);
    expect(context.progress).toBe(expectedContext.progress);
  });
});
