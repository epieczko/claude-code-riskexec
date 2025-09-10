// scripts/router-verify.js
const fs = require("fs");
const os = require("os");
const path = require("path");

function die(msg, code = 1) { console.error(`❌ FAIL: ${msg}`); process.exit(code); }
function must(cond, msg, code = 1) { if (!cond) die(msg, code); }

const cfg = path.join(os.homedir(), ".claude-code-router", "config.json");
if (!fs.existsSync(cfg)) die("Router config missing at ~/.claude-code-router/config.json", 2);

let json;
try {
    json = JSON.parse(fs.readFileSync(cfg, "utf8"));
} catch (e) {
    die(`Config JSON malformed: ${e.message}`, 3);
}

// Shape validation
must(typeof json === 'object' && json !== null, "Config must be an object", 10);
must(Array.isArray(json.Providers), "Providers must be an array", 11);
must(typeof json.Router === 'object' && json.Router !== null, "Router must be an object", 12);
must(json.HOST === "127.0.0.1", "HOST must be 127.0.0.1 (localhost only)", 13);

const allowedProviders = new Set(["anthropic"]);
const bannedProviders = new Set(["openrouter", "iflow", "volcengine", "modelscope", "dashscope"]);
const allowedModels = new Set(["claude-3.7-sonnet", "claude-3.7-haiku"]);

// Validate providers
for (const p of json.Providers) {
    must(typeof p === 'object' && p !== null, "Each provider must be an object", 14);
    must(typeof p.name === 'string', "Provider name must be a string", 15);
    must(Array.isArray(p.models), "Provider models must be an array", 16);
    
    if (bannedProviders.has(p.name)) die(`BANNED provider: ${p.name}`, 20);
    if (!allowedProviders.has(p.name)) die(`Only ${[...allowedProviders]} allowed, found '${p.name}'`, 21);
    
    for (const m of p.models) {
        must(typeof m === 'string', "Model names must be strings", 17);
        if (!allowedModels.has(m)) die(`Model not allowed: ${m}`, 22);
    }
    
    // Validate transformer
    must(p.transformer && typeof p.transformer === 'object', "Provider must have transformer object", 18);
    must(Array.isArray(p.transformer.use), "Transformer.use must be an array", 19);
    must(p.transformer.use.length === 1 && p.transformer.use[0] === "anthropic", 
         "Transformer must use exactly ['anthropic']", 23);
}

// Validate routes
const r = json.Router;
for (const key of ["default", "background", "think", "longContext"]) {
    if (!r[key]) continue;
    const parts = String(r[key]).split(",");
    must(parts.length === 2, `Route '${key}' must be 'provider,model' format, got '${r[key]}'`, 30);
    
    const [prov, model] = parts;
    must(prov && model, `Route '${key}' must have non-empty provider and model`, 31);
    must(allowedProviders.has(prov), `Route '${key}' provider not allowed: '${prov}'`, 32);
    must(allowedModels.has(model), `Route '${key}' model not allowed: '${model}'`, 33);
}

console.log("✅ Router config OK. Local routing only. Anthropic only. Allowed models only.");
