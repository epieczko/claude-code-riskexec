import fs from 'fs';
import path from 'path';

function isDangerousRmCommand(command: string): boolean {
  const normalized = command.toLowerCase().split(/\s+/).join(' ');
  const patterns = [
    /\brm\s+.*-[a-z]*r[a-z]*f/, // rm -rf
    /\brm\s+.*-[a-z]*f[a-z]*r/, // rm -fr
    /\brm\s+--recursive\s+--force/,
    /\brm\s+--force\s+--recursive/,
    /\brm\s+-r\s+.*-f/,
    /\brm\s+-f\s+.*-r/
  ];
  for (const pattern of patterns) {
    if (pattern.test(normalized)) return true;
  }
  if (/\brm\s+.*-[a-z]*r/.test(normalized)) {
    const dangerousPaths = [
      '/', '/\*', '~', '~/','$HOME', '..','*','.', '.\s*$'
    ];
    for (const p of dangerousPaths) {
      if (new RegExp(p).test(normalized)) return true;
    }
  }
  return false;
}

function isEnvFileAccess(toolName: string, toolInput: any): boolean {
  if (['Read','Edit','MultiEdit','Write','Bash'].includes(toolName)) {
    if (['Read','Edit','MultiEdit','Write'].includes(toolName)) {
      const filePath = toolInput.file_path || '';
      if (filePath.includes('.env') && !filePath.endsWith('.env.sample')) return true;
    } else if (toolName === 'Bash') {
      const command = toolInput.command || '';
      const envPatterns = [
        /\b\.env\b(?!\.sample)/,
        /cat\s+.*\.env\b(?!\.sample)/,
        /echo\s+.*>\s*\.env\b(?!\.sample)/,
        /touch\s+.*\.env\b(?!\.sample)/,
        /cp\s+.*\.env\b(?!\.sample)/,
        /mv\s+.*\.env\b(?!\.sample)/
      ];
      for (const pattern of envPatterns) {
        if (pattern.test(command)) return true;
      }
    }
  }
  return false;
}

function main() {
  try {
    const inputData = JSON.parse(fs.readFileSync(0, 'utf8'));
    const toolName = inputData.tool_name || '';
    const toolInput = inputData.tool_input || {};

    if (isEnvFileAccess(toolName, toolInput)) {
      console.error('BLOCKED: Access to .env files containing sensitive data is prohibited');
      console.error('Use .env.sample for template files instead');
      process.exit(2);
    }

    if (toolName === 'Bash') {
      const command = toolInput.command || '';
      if (isDangerousRmCommand(command)) {
        console.error('BLOCKED: Dangerous rm command detected and prevented');
        process.exit(2);
      }
    }

    const logDir = path.join(process.cwd(), 'logs');
    fs.mkdirSync(logDir, { recursive: true });
    const logPath = path.join(logDir, 'pre_tool_use.json');
    let logData: any[] = [];
    if (fs.existsSync(logPath)) {
      try { logData = JSON.parse(fs.readFileSync(logPath, 'utf8')); } catch { logData = []; }
    }
    logData.push(inputData);
    fs.writeFileSync(logPath, JSON.stringify(logData, null, 2));
    process.exit(0);
  } catch {
    process.exit(0);
  }
}

main();
