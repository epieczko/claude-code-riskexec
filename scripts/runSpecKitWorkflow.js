#!/usr/bin/env node

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const { validatePhaseOutputs } = require('./validators');

const PHASES = ['specify', 'plan', 'tasks', 'implement', 'verify'];
const PHASE_TO_COMMAND = {
  specify: '/specify',
  plan: '/plan',
  tasks: '/tasks',
  implement: '/implement',
  verify: '/verify'
};

function main() {
  const options = parseArgs(process.argv.slice(2));
  const featureName = options.feature || options._[0] || 'Feature-A';
  const brief = options.brief || options._[1] || '';
  const resumePhase = options.resume ? options.resume.toLowerCase() : null;
  const skipQA = options['skip-qa'] || false;
  const autoTestCommand = options['test-command'] || process.env.SPEC_KIT_TEST_COMMAND || '';

  const featureDir = path.join(process.cwd(), 'specs', featureName);
  ensureDirectory(featureDir);

  const startIndex = resumePhase ? PHASES.indexOf(resumePhase) : 0;
  if (resumePhase && startIndex === -1) {
    console.error(`Unknown resume phase: ${resumePhase}`);
    process.exit(1);
  }

  console.log(`\n▶ Running Spec Kit workflow for ${featureName}`);
  if (resumePhase) {
    console.log(`↻ Resuming from phase: ${resumePhase}`);
  }
  if (autoTestCommand) {
    console.log(`🧪 Tests will run after each implementation task using: ${autoTestCommand}`);
  }

  const queue = ['specify', 'plan', 'tasks', 'implement'];
  if (!skipQA) {
    queue.push('verify');
  }

  for (let i = startIndex; i < queue.length; i += 1) {
    const phase = queue[i];
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
        runImplementationPhase(featureDir, featureName, autoTestCommand, options['start-task']);
      } else if (phase === 'verify') {
        runCommand(phase, [featureName]);
        console.log('✅ QA review triggered');
      }
    } catch (error) {
      console.error(`❌ ${phase} phase failed: ${error.message}`);
      process.exit(1);
    }
  }

  console.log('\n🎉 Spec Kit workflow completed successfully.');
}

function runImplementationPhase(featureDir, featureName, testCommand, startTaskLabel) {
  const tasks = parseTasks(featureDir);
  if (!tasks.length) {
    throw new Error('No tasks found in tasks.md — cannot continue implementation.');
  }

  const startIndex = startTaskLabel
    ? tasks.findIndex(task => task.raw.includes(startTaskLabel))
    : 0;

  if (startTaskLabel && startIndex === -1) {
    throw new Error(`Task containing "${startTaskLabel}" was not found.`);
  }

  for (let i = startIndex; i < tasks.length; i += 1) {
    const task = tasks[i];
    console.log(`\n🚧 Implementing task ${i + 1}/${tasks.length}: ${task.label}`);
    const args = [featureName];
    if (task.label) {
      args.push(task.label);
    }

    runCommand('implement', args, {
      env: {
        SPEC_KIT_TASK_INDEX: String(i + 1),
        SPEC_KIT_TASK_TOTAL: String(tasks.length),
        SPEC_KIT_TASK_ID: task.label
      }
    });

    if (testCommand) {
      runTestCommand(testCommand);
    }
  }
}

function runTestCommand(command) {
  console.log(`🧪 Running tests: ${command}`);
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
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const tasks = [];

  for (const line of lines) {
    const match = line.match(/^- \[[ xX]\]\s+(.+)$/);
    if (match) {
      tasks.push({
        raw: line,
        label: match[1].trim()
      });
    }
  }

  return tasks;
}

function runCommand(phase, args, options = {}) {
  const command = PHASE_TO_COMMAND[phase];
  if (!command) {
    throw new Error(`Unknown phase: ${phase}`);
  }

  const cliBinary = process.env.CLAUDE_CLI || 'claude';
  const finalArgs = [command, ...args];
  console.log(`\n▶ Executing ${cliBinary} ${finalArgs.join(' ')}`);

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

  console.log(`\n🧮 Validation for ${phaseKey}: ${result.valid ? 'pass' : 'fail'}`);
  result.errors.forEach(error => console.error(`   ✖ ${error}`));
  result.warnings.forEach(warning => console.warn(`   ⚠ ${warning}`));

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
