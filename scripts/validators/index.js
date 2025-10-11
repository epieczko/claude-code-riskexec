const fs = require('fs');
const path = require('path');

const { validateSpec } = require('./validateSpec');
const { validatePlan } = require('./validatePlan');
const { validateTasks } = require('./validateTasks');

function loadFile(featureDir, filename) {
  const target = path.join(featureDir, filename);
  if (!fs.existsSync(target)) {
    return '';
  }
  return fs.readFileSync(target, 'utf8');
}

function validatePhaseOutputs(featureDir) {
  const spec = loadFile(featureDir, 'spec.md');
  const plan = loadFile(featureDir, 'plan.md');
  const tasks = loadFile(featureDir, 'tasks.md');

  return {
    spec: validateSpec(spec),
    plan: validatePlan(plan, spec),
    tasks: validateTasks(tasks)
  };
}

module.exports = {
  validateSpec,
  validatePlan,
  validateTasks,
  validatePhaseOutputs
};
