/* eslint-disable no-console */
const fs = require('fs');
const fm = require('front-matter');

const ALLOWED_MODELS = new Set(['claude-3.7-sonnet', 'claude-3.7-haiku']);

function main() {
  const p = process.env.CLAUDE_AGENT_FILE_PATH;
  if (!p) {
    console.error('agent-switch-check: CLAUDE_AGENT_FILE_PATH not set');
    process.exit(2);
  }
  if (!fs.existsSync(p)) {
    console.error(`agent-switch-check: file not found ${p}`);
    process.exit(3);
  }
  const raw = fs.readFileSync(p, 'utf8');
  const { attributes } = fm(raw);

  const model = attributes.model;
  if (!model) throw new Error(`${p}: missing 'model' in front matter`);
  if (!ALLOWED_MODELS.has(model))
    throw new Error(`${p}: model '${model}' not allowed`);

  const active = process.env.CLAUDE_CURRENT_MODEL;
  if (active && active !== model) {
    throw new Error(
      `${p}: requires model '${model}' but current model is '${active}'`
    );
  }

  console.log('agent-switch-check OK');
}

try {
  main();
} catch (e) {
  console.error(String(e.message || e));
  process.exit(1);
}
