// scripts/router-verify.js
const fs = require("fs");
const os = require("os");
const path = require("path");

function die(msg, code = 1) { console.error(msg); process.exit(code); }

const cfg = path.join(os.homedir(), ".claude-code-router", "config.json");
if (!fs.existsSync(cfg)) die("Router config missing at ~/.claude-code-router/config.json", 2);

const json = JSON.parse(fs.readFileSync(cfg, "utf8"));

if (json.HOST !== "127.0.0.1")
    die(`HOST must be "127.0.0.1", found '${json.HOST}'`, 8);

const allowedProviders = new Set(["anthropic"]);
const bannedProviders = new Set(["openrouter", "iflow", "volcengine", "modelscope", "dashscope"]);
const allowedModels = new Set(["claude-3.7-sonnet", "claude-3.7-haiku"]);

for (const p of json.Providers || []) {
    if (bannedProviders.has(p.name)) die(`BANNED provider: ${p.name}`, 3);
    if (!allowedProviders.has(p.name)) die(`Only ${[...allowedProviders]} allowed, found ${p.name}`, 4);
    for (const m of p.models || []) {
        if (!allowedModels.has(m)) die(`Model not allowed: ${m}`, 5);
    }
}

const r = json.Router || {};
for (const k of ["default", "background", "think", "longContext"]) {
    if (!r[k]) continue;
    const [prov, model] = String(r[k]).split(",");
    if (!allowedProviders.has(prov)) die(`Route '${k}' must use provider 'anthropic', found '${prov}'`, 6);
    if (!allowedModels.has(model)) die(`Route '${k}' model not allowed: ${model}`, 7);
}

console.log("Router config OK. Local routing only. Anthropic only. Allowed models only.");
