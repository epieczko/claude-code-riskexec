import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

interface SessionData {
  session_id: string;
  prompts: string[];
  agent_name?: string;
  [key: string]: any;
}

function logUserPrompt(sessionId: string, inputData: any) {
  const logDir = path.join(process.cwd(), 'logs');
  fs.mkdirSync(logDir, { recursive: true });
  const logFile = path.join(logDir, 'user_prompt_submit.json');
  let logData: any[] = [];
  if (fs.existsSync(logFile)) {
    try { logData = JSON.parse(fs.readFileSync(logFile, 'utf8')); } catch { logData = []; }
  }
  logData.push(inputData);
  fs.writeFileSync(logFile, JSON.stringify(logData, null, 2));
}

function manageSessionData(sessionId: string, prompt: string, nameAgent = false) {
  const sessionsDir = path.join(process.cwd(), '.claude', 'data', 'sessions');
  fs.mkdirSync(sessionsDir, { recursive: true });
  const sessionFile = path.join(sessionsDir, `${sessionId}.json`);
  let sessionData: SessionData = { session_id: sessionId, prompts: [] };
  if (fs.existsSync(sessionFile)) {
    try { sessionData = JSON.parse(fs.readFileSync(sessionFile, 'utf8')); } catch { sessionData = { session_id: sessionId, prompts: [] }; }
  }
  sessionData.prompts = sessionData.prompts || [];
  sessionData.prompts.push(prompt);
  if (nameAgent && !sessionData.agent_name) {
    try {
      const result = execSync('uv run .claude/hooks/utils/llm/ollama.py --agent-name', { encoding: 'utf8', timeout: 5000 }).trim();
      if (result && /^[A-Za-z0-9]+$/.test(result) && !result.includes(' ')) sessionData.agent_name = result;
      else throw new Error('invalid');
    } catch {
      try {
        const result = execSync('uv run .claude/hooks/utils/llm/anth.py --agent-name', { encoding: 'utf8', timeout: 10000 }).trim();
        if (result && /^[A-Za-z0-9]+$/.test(result) && !result.includes(' ')) sessionData.agent_name = result;
      } catch { /* ignore */ }
    }
  }
  try { fs.writeFileSync(sessionFile, JSON.stringify(sessionData, null, 2)); } catch { /* ignore */ }
}

function validatePrompt(prompt: string): { valid: boolean; reason?: string } {
  const blocked: Array<[RegExp, string]> = [];
  const lower = prompt.toLowerCase();
  for (const [pattern, reason] of blocked) {
    if (pattern.test(lower)) return { valid: false, reason };
  }
  return { valid: true };
}

function main() {
  try {
    const args = process.argv.slice(2);
    const hasFlag = (f: string) => args.includes(f);
    const inputData = JSON.parse(fs.readFileSync(0, 'utf8'));
    const sessionId = inputData.session_id || 'unknown';
    const prompt = inputData.prompt || '';

    logUserPrompt(sessionId, inputData);

    if (hasFlag('--store-last-prompt') || hasFlag('--name-agent')) {
      manageSessionData(sessionId, prompt, hasFlag('--name-agent'));
    }

    if (hasFlag('--validate') && !hasFlag('--log-only')) {
      const { valid, reason } = validatePrompt(prompt);
      if (!valid) {
        console.error(`Prompt blocked: ${reason}`);
        process.exit(2);
      }
    }

    process.exit(0);
  } catch {
    process.exit(0);
  }
}

main();
