/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");
const fm = require("front-matter");

const ALLOWED_MODELS = new Set(["claude-3.7-sonnet", "claude-3.7-haiku"]);
const REG_PATH = path.join(".claude", "registry.json");
if (!fs.existsSync(REG_PATH)) {
  console.error("Missing .claude/registry.json");
  process.exit(2);
}
const registry = JSON.parse(fs.readFileSync(REG_PATH, "utf8"));

function listMarkdown(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const s = fs.statSync(p);
    if (s.isDirectory()) out.push(...listMarkdown(p));
    else if (name.endsWith(".md")) out.push(p);
  }
  return out;
}

function validateFile(p) {
  const raw = fs.readFileSync(p, "utf8");
  const { attributes } = fm(raw);

  const skill = attributes.skill;
  if (!skill) throw new Error(`${p}: missing 'skill' in front matter`);

  const fmModel = attributes.model;
  const defaultModel = registry.skills?.[skill]?.defaultModel;
  const model = fmModel || defaultModel;

  if (!model) throw new Error(`${p}: no 'model' and no registry default for skill '${skill}'`);
  if (!ALLOWED_MODELS.has(model)) throw new Error(`${p}: model '${model}' not allowed`);

  // Optional: strict behavior must be satisfiable by router allowlist
  if (attributes.strict && !ALLOWED_MODELS.has(model)) {
    throw new Error(`${p}: strict=true but model not on allowlist`);
  }
}

function main() {
  const files = [
    ...listMarkdown(path.join(".claude", "agents")),
    ...listMarkdown(path.join(".claude", "commands"))
  ];
  for (const f of files) validateFile(f);
  console.log("model-policy-check OK");
}
try { main(); } catch (e) { console.error(String(e.message || e)); process.exit(1); }
