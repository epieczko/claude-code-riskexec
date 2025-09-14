import fs from 'fs';
import path from 'path';

function main() {
  try {
    const input = JSON.parse(fs.readFileSync(0, 'utf8'));
    const logDir = path.join(process.cwd(), 'logs');
    fs.mkdirSync(logDir, { recursive: true });
    const logPath = path.join(logDir, 'post_tool_use.json');
    let logData: any[] = [];
    if (fs.existsSync(logPath)) {
      try {
        logData = JSON.parse(fs.readFileSync(logPath, 'utf8'));
      } catch {
        logData = [];
      }
    }
    logData.push(input);
    fs.writeFileSync(logPath, JSON.stringify(logData, null, 2));
    process.exit(0);
  } catch {
    process.exit(0);
  }
}

main();
