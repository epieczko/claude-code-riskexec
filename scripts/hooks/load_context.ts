import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';

function logSessionStart(inputData: any) {
  const logDir = path.join(process.cwd(), 'logs');
  fs.mkdirSync(logDir, { recursive: true });
  const logFile = path.join(logDir, 'session_start.json');
  let logData: any[] = [];
  if (fs.existsSync(logFile)) {
    try { logData = JSON.parse(fs.readFileSync(logFile, 'utf8')); } catch { logData = []; }
  }
  logData.push(inputData);
  fs.writeFileSync(logFile, JSON.stringify(logData, null, 2));
}

function getGitStatus(): [string|null, number|null] {
  try {
    const branch = spawnSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { encoding: 'utf8', timeout: 5000 });
    const currentBranch = branch.status === 0 ? branch.stdout.trim() : 'unknown';
    const status = spawnSync('git', ['status', '--porcelain'], { encoding: 'utf8', timeout: 5000 });
    let uncommitted = 0;
    if (status.status === 0 && status.stdout.trim()) {
      uncommitted = status.stdout.trim().split('\n').length;
    }
    return [currentBranch, uncommitted];
  } catch {
    return [null, null];
  }
}

function getRecentIssues(): string | null {
  try {
    const ghCheck = spawnSync('which', ['gh']);
    if (ghCheck.status !== 0) return null;
    const result = spawnSync('gh', ['issue', 'list', '--limit', '5', '--state', 'open'], { encoding: 'utf8', timeout: 10000 });
    if (result.status === 0 && result.stdout.trim()) return result.stdout.trim();
  } catch { /* ignore */ }
  return null;
}

function loadDevelopmentContext(source: string): string {
  const contextParts: string[] = [];
  contextParts.push(`Session started at: ${new Date().toISOString().replace('T',' ').split('.')[0]}`);
  contextParts.push(`Session source: ${source}`);
  const [branch, changes] = getGitStatus();
  if (branch) {
    contextParts.push(`Git branch: ${branch}`);
    if (changes && changes > 0) contextParts.push(`Uncommitted changes: ${changes} files`);
  }
  const contextFiles = [
    '.claude/CONTEXT.md',
    '.claude/TODO.md',
    'TODO.md',
    '.github/ISSUE_TEMPLATE.md'
  ];
  for (const filePath of contextFiles) {
    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf8').trim();
        if (content) {
          contextParts.push(`\n--- Content from ${filePath} ---`);
          contextParts.push(content.slice(0,1000));
        }
      } catch { /* ignore */ }
    }
  }
  const issues = getRecentIssues();
  if (issues) {
    contextParts.push('\n--- Recent GitHub Issues ---');
    contextParts.push(issues);
  }
  return contextParts.join('\n');
}

function main() {
  try {
    const args = process.argv.slice(2);
    const loadCtx = args.includes('--load-context');
    const announce = args.includes('--announce');
    const inputData = JSON.parse(fs.readFileSync(0, 'utf8'));
    const source = inputData.source || 'unknown';

    logSessionStart(inputData);

    if (loadCtx) {
      const context = loadDevelopmentContext(source);
      if (context) {
        const output = {
          hookSpecificOutput: {
            hookEventName: 'SessionStart',
            additionalContext: context
          }
        };
        console.log(JSON.stringify(output));
      }
    }

    if (announce) {
      try {
        const script = path.join(__dirname, 'utils', 'tts', 'pyttsx3_tts.py');
        if (fs.existsSync(script)) {
          const messages: Record<string,string> = {
            startup: 'Claude Code session started',
            resume: 'Resuming previous session',
            clear: 'Starting fresh session'
          };
          const msg = messages[source] || 'Session started';
          spawnSync('uv', ['run', script, msg], { timeout: 5000 });
        }
      } catch { /* ignore */ }
    }

    process.exit(0);
  } catch {
    process.exit(0);
  }
}

main();
