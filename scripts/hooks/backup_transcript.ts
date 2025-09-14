import fs from 'fs';
import path from 'path';
import { copyFileSync } from 'fs';

function logPreCompact(inputData: any) {
  const logDir = path.join(process.cwd(), 'logs');
  fs.mkdirSync(logDir, { recursive: true });
  const logFile = path.join(logDir, 'pre_compact.json');
  let logData: any[] = [];
  if (fs.existsSync(logFile)) {
    try { logData = JSON.parse(fs.readFileSync(logFile, 'utf8')); } catch { logData = []; }
  }
  logData.push(inputData);
  fs.writeFileSync(logFile, JSON.stringify(logData, null, 2));
}

function backupTranscript(transcriptPath: string, trigger: string): string | null {
  try {
    if (!fs.existsSync(transcriptPath)) return null;
    const backupDir = path.join(process.cwd(), 'logs', 'transcript_backups');
    fs.mkdirSync(backupDir, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[-:T]/g,'').split('.')[0];
    const sessionName = path.parse(transcriptPath).name;
    const backupName = `${sessionName}_pre_compact_${trigger}_${timestamp}.jsonl`;
    const backupPath = path.join(backupDir, backupName);
    copyFileSync(transcriptPath, backupPath);
    return backupPath;
  } catch {
    return null;
  }
}

function main() {
  try {
    const args = process.argv.slice(2);
    const doBackup = args.includes('--backup');
    const verbose = args.includes('--verbose');
    const inputData = JSON.parse(fs.readFileSync(0, 'utf8'));
    const sessionId = inputData.session_id || 'unknown';
    const transcriptPath = inputData.transcript_path || '';
    const trigger = inputData.trigger || 'unknown';
    const custom = inputData.custom_instructions || '';

    logPreCompact(inputData);

    let backupPath: string | null = null;
    if (doBackup && transcriptPath) backupPath = backupTranscript(transcriptPath, trigger);

    if (verbose) {
      let message = trigger === 'manual'
        ? `Preparing for manual compaction (session: ${sessionId.slice(0,8)}...)`
        : `Auto-compaction triggered due to full context window (session: ${sessionId.slice(0,8)}...)`;
      if (trigger === 'manual' && custom) {
        message += `\nCustom instructions: ${custom.slice(0,100)}...`;
      }
      if (backupPath) message += `\nTranscript backed up to: ${backupPath}`;
      console.log(message);
    }

    process.exit(0);
  } catch {
    process.exit(0);
  }
}

main();
