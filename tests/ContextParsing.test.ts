import { extractPlanContext, extractSpecContext, extractTaskContext } from '../src/lib/contextStore';

describe('Context parsing helpers', () => {
  it('parses specification requirements and questions', () => {
    const markdown = `# Feature Spec\n\n## Functional Requirements\n- [x] Users can sign in\n- [ ] Users can reset passwords\n\n## Open Questions\n- What about SSO?\n- Need audit logging?\n`;
    const context = extractSpecContext(markdown);

    expect(context.requirements).toHaveLength(2);
    expect(context.requirements[0]).toMatchObject({ text: 'Users can sign in', completed: true });
    expect(context.requirements[1]).toMatchObject({ text: 'Users can reset passwords', completed: false });
    expect(context.openQuestions).toEqual(['What about SSO?', 'Need audit logging?']);
  });

  it('parses plan architecture and risks sections', () => {
    const markdown = `# Plan\n\n## Architecture Decisions\n- Use modular services\n- Share auth module\n\n## Risks & Mitigations\n- Migration complexity\n- Third-party downtime\n`;
    const context = extractPlanContext(markdown);

    expect(context.architecture).toEqual(['Use modular services', 'Share auth module']);
    expect(context.risks).toEqual(['Migration complexity', 'Third-party downtime']);
  });

  it('parses task checklists including references and notes', () => {
    const markdown = `# Tasks\n\n- [ ] Implement login\n  - src/auth/login.ts\n  Ensure OAuth fallback\n- [x] Write tests\n  Document edge cases\n`;
    const context = extractTaskContext(markdown);

    expect(context.tasks).toHaveLength(2);
    expect(context.tasks[0]).toMatchObject({
      title: 'Implement login',
      completed: false,
      references: ['src/auth/login.ts'],
      notes: ['Ensure OAuth fallback']
    });
    expect(context.tasks[1].completed).toBe(true);
    expect(context.progress).toBe('1/2 completed (50%)');
  });
});
