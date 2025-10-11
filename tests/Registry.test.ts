import { phaseRegistry } from '../src/phases/registry';

describe('phase registry', () => {
  it('includes all Spec Kit phases with correct agents', () => {
    expect(Object.keys(phaseRegistry).sort()).toEqual(['implement', 'plan', 'specify', 'tasks']);
    expect(phaseRegistry.specify).toMatchObject({ agent: 'bmad-analyst', output: 'specs/{feature}/spec.md' });
    expect(phaseRegistry.plan).toMatchObject({ agent: 'bmad-architect', input: ['spec.md'] });
    expect(phaseRegistry.tasks).toMatchObject({ agent: 'bmad-pm', input: ['spec.md', 'plan.md'] });
    expect(phaseRegistry.implement).toMatchObject({ agent: 'bmad-developer', output: 'specs/{feature}/implementation' });
  });

  it('provides downstream file dependencies for coordination', () => {
    expect(phaseRegistry.plan?.input).toEqual(['spec.md']);
    expect(phaseRegistry.tasks?.input).toEqual(['spec.md', 'plan.md']);
    expect(phaseRegistry.implement?.input).toEqual(['plan.md', 'tasks.md']);
  });
});
