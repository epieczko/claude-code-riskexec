const CHECKBOX_PATTERN = /^- \[[ xX]\]\s+(.+)$/;

function validateTasks(content) {
  const errors = [];
  const warnings = [];

  if (!content || !content.trim()) {
    errors.push('Task list is empty.');
    return buildResult(errors, warnings, { taskCount: 0, missingTraceability: 0 });
  }

  const normalizedContent = content.replace(/\r\n/g, '\n');
  const lines = normalizedContent.split('\n');
  const tasks = [];

  for (const line of lines) {
    const match = line.match(CHECKBOX_PATTERN);
    if (match) {
      tasks.push(match[1].trim());
    }
  }

  if (!tasks.length) {
    errors.push('No checkbox-formatted tasks found (expected "- [ ] Task").');
  }

  const longTasks = tasks.filter(task => task.length > 200);
  if (longTasks.length) {
    warnings.push(`${longTasks.length} tasks exceed the 200 character guideline.`);
  }

  const traceabilityGaps = tasks.filter(task => !/Spec:|Plan:|AC:/i.test(task));
  if (traceabilityGaps.length) {
    warnings.push(`${traceabilityGaps.length} tasks are missing explicit traceability tags (Spec:/Plan:/AC:).`);
  }

  const qaCoverage = tasks.filter(task => /QA|test/i.test(task)).length;
  if (!qaCoverage) {
    warnings.push('No QA or testing tasks were identified.');
  }

  const metrics = {
    taskCount: tasks.length,
    longTasks: longTasks.length,
    missingTraceability: traceabilityGaps.length,
    qaTasks: qaCoverage
  };

  return buildResult(errors, warnings, metrics);
}

function buildResult(errors, warnings, metrics) {
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    metrics
  };
}

module.exports = {
  validateTasks
};
