// scripts/router-install.js
const fs = require("fs");
const os = require("os");
const path = require("path");

const src = path.join(process.cwd(), ".claude-code-router", "config.json");
const dstDir = path.join(os.homedir(), ".claude-code-router");
const dst = path.join(dstDir, "config.json");

if (!fs.existsSync(src)) {
    console.error("Missing .claude-code-router/config.json in repo");
    process.exit(1);
}

fs.mkdirSync(dstDir, { recursive: true });

if (fs.existsSync(dst)) {
    console.log(`Found existing ${dst}. Leaving it as is.`);
    process.exit(0);
}

fs.copyFileSync(src, dst);
console.log(`Wrote ${dst}`);

console.log("\nSet env vars before running the router:");
if (process.platform === "win32") {
    console.log('  PowerShell:  setx ANTHROPIC_API_KEY "<your_key>"');
    console.log('               setx CCR_APIKEY "<a_local_secret>"');
} else {
    console.log('  export ANTHROPIC_API_KEY="<your_key>"');
    console.log('  export CCR_APIKEY="<a_local_secret>"');
}
