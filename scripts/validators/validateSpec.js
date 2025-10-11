const REQUIRED_SECTIONS = [
  '## Executive Summary',
  '## User Stories',
  '## Functional Requirements',
  '## Acceptance Criteria'
];

const AMBIGUOUS_TERMS = [
  'maybe',
  'possibly',
  'probably',
  'eventually',
  'hopefully',
  'might be able to',
  'should be able to'
];

function validateSpec(content) {
  const errors = [];
  const warnings = [];

  if (!content || !content.trim()) {
    errors.push('Specification is empty.');
    return buildResult(errors, warnings, { wordCount: 0, missingSections: REQUIRED_SECTIONS });
  }

  const normalizedContent = content.replace(/\r\n/g, '\n');
  const wordCount = normalizedContent.split(/\s+/).filter(Boolean).length;
  const missingSections = REQUIRED_SECTIONS.filter(section => !normalizedContent.includes(section));

  if (missingSections.length) {
    errors.push(`Missing required sections: ${missingSections.join(', ')}`);
  }

  if (!/^# /m.test(normalizedContent)) {
    warnings.push('Specification is missing a top-level heading.');
  }

  const ambiguousMatches = AMBIGUOUS_TERMS
    .filter(term => new RegExp(`\\b${escapeRegExp(term)}\\b`, 'i').test(normalizedContent));

  if (ambiguousMatches.length) {
    warnings.push(`Ambiguous language detected: ${ambiguousMatches.join(', ')}`);
  }

  const acceptanceCriteriaCount = (normalizedContent.match(/\bAcceptance Criteria\b/gi) || []).length;
  if (acceptanceCriteriaCount < 1) {
    errors.push('At least one acceptance criteria block is required.');
  }

  const metrics = {
    wordCount,
    missingSections,
    acceptanceCriteriaCount,
    ambiguousTerms: ambiguousMatches
  };

  return buildResult(errors, warnings, metrics);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
  validateSpec
};
