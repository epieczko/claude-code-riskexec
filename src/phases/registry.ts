export interface PhaseRegistryEntry {
  agent: string;
  input?: string | string[];
  output: string;
}

export const phaseRegistry: Record<string, PhaseRegistryEntry> = {
  specify: {
    agent: 'bmad-analyst',
    output: 'specs/{feature}/spec.md',
  },
  plan: {
    agent: 'bmad-architect',
    input: ['spec.md'],
    output: 'specs/{feature}/plan.md',
  },
  tasks: {
    agent: 'bmad-pm',
    input: ['spec.md', 'plan.md'],
    output: 'specs/{feature}/tasks.md',
  },
  implement: {
    agent: 'bmad-developer',
    input: ['plan.md', 'tasks.md'],
    output: 'specs/{feature}/implementation',
  },
  verify: {
    agent: 'bmad-qa',
    input: ['spec.md', 'plan.md', 'tasks.md', 'implementation'],
    output: 'specs/{feature}/qa-report.md',
  },
};
