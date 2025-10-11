#!/usr/bin/env node

require('ts-node/register');

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const { validatePhaseOutputs } = require('./validators');
const { createWorkflowLogger, createLogger } = require('../src/lib/logger');
const { parseTasksChecklist } = require('../src/lib/tasks');

const PHASES = ['specify', 'plan', 'tasks', 'implement', 'verify'];
const DEFAULT_PHASE_TO_COMMAND = {
  specify: '/specify',
  plan: '/plan',
  tasks: '/tasks',
  implement: '/implement',
  verify: '/verify'
};
let phaseCommandMap = { ...DEFAULT_PHASE_TO_COMMAND };

function loadAgentOsCommandMapSafe() {
  const commandMapPath = path.join(__dirname, '..', '.agent-os', 'command-map.json');
  try {
    const source = fs.readFileSync(commandMapPath, 'utf8');
    return JSON.parse(source);
  } catch (error) {
    if (!error || typeof error !== 'object' || error.code !== 'ENOENT') {
      const reason = error instanceof Error ? error.message : String(error);
      createLogger('workflow:agent-os').warn(
        `Unable to load Agent OS command map at ${commandMapPath}: ${reason}`
      );
    }
    return null;
  }
}

function buildPhaseCommandMap(useAgentOsAliases) {
  if (!useAgentOsAliases) {
    return { ...DEFAULT_PHASE_TO_COMMAND };
  }

  const agentOsLogger = createLogger('workflow:agent-os');
  const commandMap = loadAgentOsCommandMapSafe();
  if (!commandMap) {
    agentOsLogger.warn('Agent OS mode requested but command-map.json was not found. Falling back to CLI commands.');
    return { ...DEFAULT_PHASE_TO_COMMAND };
  }

  const resolved = { ...DEFAULT_PHASE_TO_COMMAND };
  for (const [phase, entry] of Object.entries(commandMap)) {
    if (entry && typeof entry.agentOsCommand === 'string' && entry.agentOsCommand.trim()) {
      resolved[phase] = entry.agentOsCommand;
    }
  }

  agentOsLogger.info('Agent OS command aliases enabled for Spec Kit workflow.');
  return resolved;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const featureName = options.feature || options._[0] || 'Feature-A';
  const brief = options.brief || options._[1] || '';
  const resumePhase = options.resume ? options.resume.toLowerCase() : null;
  const skipQA = options['skip-qa'] || false;
  const autoTestCommand = options['test-command'] || process.env.SPEC_KIT_TEST_COMMAND || '';
  const workflowLogger = createWorkflowLogger();

  const featureDir = path.join(process.cwd(), 'specs', featureName);
  ensureDirectory(featureDir);

  const startIndex = resumePhase ? PHASES.indexOf(resumePhase) : 0;
  if (resumePhase && startIndex === -1) {
    workflowLogger.error(`Unknown resume phase: ${resumePhase}`);
    process.exit(1);
  }

  const useAgentOsCommands = Boolean(
    options['agent-os'] ||
      options.agentOs ||
      process.env.SPEC_KIT_AGENT_OS_MODE === '1' ||
      process.env.SPEC_KIT_AGENT_OS_MODE === 'true'
  );
  phaseCommandMap = buildPhaseCommandMap(useAgentOsCommands);

  workflowLogger.info(`Starting workflow for ${featureName}`);
  if (resumePhase) {
    workflowLogger.info(`Resuming from phase: ${resumePhase}`);
  }
  if (autoTestCommand) {
    workflowLogger.info(`Tests will run after each implementation task using: ${autoTestCommand}`);
  }

  const queue = ['specify', 'plan', 'tasks', 'implement'];
  if (!skipQA) {
    queue.push('verify');
  }

  for (let i = startIndex; i < queue.length; i += 1) {
    const phase = queue[i];
    const phaseLogger = createLogger(`workflow:${phase}`);
    try {
      if (phase === 'specify') {
        runCommand(phase, [featureName, brief].filter(Boolean));
        validatePhase(featureDir, 'spec');
      } else if (phase === 'plan') {
        runCommand(phase, [featureName]);
        validatePhase(featureDir, 'plan');
      } else if (phase === 'tasks') {
        runCommand(phase, [featureName]);
        validatePhase(featureDir, 'tasks');
      } else if (phase === 'implement') {
        runImplementationPhase(featureDir, featureName, autoTestCommand, options['start-task'], phaseLogger);
      } else if (phase === 'verify') {
        runCommand(phase, [featureName]);
        phaseLogger.info('QA review triggered');
      }
      phaseLogger.info('Phase complete');
    } catch (error) {
      phaseLogger.error(`Phase failed: ${error.message}`);
      process.exit(1);
    }
  }

  workflowLogger.info('Workflow completed successfully.');
}

function runImplementationPhase(featureDir, featureName, testCommand, startTaskLabel, logger) {
  const tasks = parseTasks(featureDir);
  if (!tasks.length) {
    throw new Error('No tasks found in tasks.md — cannot continue implementation.');
  }

  const startIndex = startTaskLabel
    ? tasks.findIndex(task => task.title.includes(startTaskLabel))
    : 0;

  if (startTaskLabel && startIndex === -1) {
    throw new Error(`Task containing "${startTaskLabel}" was not found.`);
  }

  for (let i = startIndex; i < tasks.length; i += 1) {
    const task = tasks[i];
    logger.info(`Implementing task ${i + 1}/${tasks.length}: ${task.title}`);
    const args = [featureName];
    if (task.title) {
      args.push(task.title);
    }

    runCommand('implement', args, {
      env: {
        SPEC_KIT_TASK_INDEX: String(i + 1),
        SPEC_KIT_TASK_TOTAL: String(tasks.length),
        SPEC_KIT_TASK_ID: task.title
      }
    });

    if (testCommand) {
      runTestCommand(testCommand);
    }
  }
}

function runTestCommand(command) {
  createLogger('workflow:tests').info(`Running tests: ${command}`);
  const result = spawnSync(command, {
    stdio: 'inherit',
    shell: true
  });

  if (result.status !== 0) {
    throw new Error('Automated tests failed. Resolve issues before proceeding.');
  }
}

function parseTasks(featureDir) {
  const tasksFile = path.join(featureDir, 'tasks.md');
  if (!fs.existsSync(tasksFile)) {
    return [];
  }

  const content = fs.readFileSync(tasksFile, 'utf8');
  return parseTasksChecklist(content);
}

function runCommand(phase, args, options = {}) {
  const command = phaseCommandMap[phase];
  if (!command) {
    throw new Error(`Unknown phase: ${phase}`);
  }

  const cliBinary = process.env.CLAUDE_CLI || 'claude';
  const finalArgs = [command, ...args];
  createLogger(`workflow:${phase}`).info(`Executing ${cliBinary} ${finalArgs.join(' ')}`);

  const result = spawnSync(cliBinary, finalArgs, {
    stdio: 'inherit',
    shell: false,
    env: {
      ...process.env,
      ...options.env
    }
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`${command} exited with code ${result.status}`);
  }
}

function validatePhase(featureDir, phaseKey) {
  const outputs = validatePhaseOutputs(featureDir);
  const result = outputs[phaseKey];
  if (!result) {
    throw new Error(`Unknown validation key: ${phaseKey}`);
  }

  const validatorLogger = createLogger(`workflow:validate:${phaseKey}`);
  validatorLogger.info(`Validation ${result.valid ? 'pass' : 'fail'}`);
  result.errors.forEach(error => validatorLogger.error(`Validation error: ${error}`));
  result.warnings.forEach(warning => validatorLogger.warn(`Validation warning: ${warning}`));

  if (!result.valid) {
    throw new Error('Validation failed. Fix issues before continuing.');
  }
}

function parseArgs(argv) {
  const options = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token.startsWith('--')) {
      const key = token.replace(/^--/, '');
      const next = argv[i + 1];
      if (!next || next.startsWith('--')) {
        options[key] = true;
      } else {
        options[key] = next;
        i += 1;
      }
    } else {
      options._.push(token);
    }
  }
  return options;
}

function ensureDirectory(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

main();
