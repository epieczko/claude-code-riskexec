const REQUIRED_SECTIONS = [
  '## Architecture Overview',
  '## Implementation Strategy',
  '## Validation Strategy',
];

function validatePlan(content, specContent = '') {
  const errors = [];
  const warnings = [];

  if (!content || !content.trim()) {
    errors.push('Plan is empty.');
    return buildResult(errors, warnings, {
      wordCount: 0,
      missingSections: REQUIRED_SECTIONS,
    });
  }

  const normalizedContent = content.replace(/\r\n/g, '\n');
  const wordCount = normalizedContent.split(/\s+/).filter(Boolean).length;
  const missingSections = REQUIRED_SECTIONS.filter(
    (section) => !normalizedContent.includes(section)
  );

  if (missingSections.length) {
    errors.push(`Missing required sections: ${missingSections.join(', ')}`);
  }

  if (!/integration|interface|api/i.test(normalizedContent)) {
    warnings.push('Plan does not mention integration touchpoints.');
  }

  const acceptanceCriteria = extractAcceptanceCriteria(specContent);
  const unmetCriteria = acceptanceCriteria.filter((criterion) => {
    const key = deriveKeyword(criterion);
    if (!key) return false;
    return !normalizedContent.toLowerCase().includes(key);
  });

  if (
    acceptanceCriteria.length &&
    unmetCriteria.length === acceptanceCriteria.length
  ) {
    warnings.push(
      'Plan does not explicitly reference acceptance criteria from the specification.'
    );
  } else if (unmetCriteria.length) {
    warnings.push(
      `Plan is missing references for ${unmetCriteria.length} acceptance criteria.`
    );
  }

  if (!/risk|mitigation|fallback/i.test(normalizedContent)) {
    warnings.push('Plan does not list explicit risks or mitigations.');
  }

  const metrics = {
    wordCount,
    missingSections,
    acceptanceCriteriaReferenced:
      acceptanceCriteria.length - unmetCriteria.length,
    acceptanceCriteriaTotal: acceptanceCriteria.length,
  };

  return buildResult(errors, warnings, metrics);
}

function extractAcceptanceCriteria(specContent) {
  if (!specContent) return [];

  const lines = specContent.replace(/\r\n/g, '\n').split('\n');
  const criteria = [];
  let inSection = false;

  for (const line of lines) {
    if (line.startsWith('## ')) {
      inSection = line.trim().toLowerCase().includes('acceptance criteria');
      continue;
    }

    if (inSection && line.trim().startsWith('-')) {
      criteria.push(line.trim().replace(/^[-*]\s*/, ''));
    }
  }

  return criteria;
}

function deriveKeyword(criterion) {
  if (!criterion) return '';

  const cleaned = criterion
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 3);

  return cleaned[0] || '';
}

function buildResult(errors, warnings, metrics) {
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    metrics,
  };
}

module.exports = {
  validatePlan,
};
