import chalk from 'chalk';

export type LogLevel = 'info' | 'warn' | 'error';

function timestamp(): string {
  return new Date().toISOString();
}

function formatScope(scope: string): string {
  return scope.toUpperCase();
}

function formatMessage(level: LogLevel, scope: string, message: string): string {
  const prefix = `[${timestamp()}] [${formatScope(scope)}]`;
  switch (level) {
    case 'info':
      return `${chalk.cyan(prefix)} ${message}`;
    case 'warn':
      return `${chalk.yellow(prefix)} ${message}`;
    case 'error':
      return `${chalk.red(prefix)} ${message}`;
    default:
      return `${prefix} ${message}`;
  }
}

export function log(level: LogLevel, scope: string, message: string): void {
  const formatted = formatMessage(level, scope, message);
  if (level === 'error') {
    console.error(formatted);
  } else if (level === 'warn') {
    console.warn(formatted);
  } else {
    console.log(formatted);
  }
}

export interface PhaseLogger {
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
}

export function createLogger(scope: string): PhaseLogger {
  return {
    info: (message: string) => log('info', scope, message),
    warn: (message: string) => log('warn', scope, message),
    error: (message: string) => log('error', scope, message)
  };
}

export function createPhaseLogger(phaseName: string): PhaseLogger {
  return createLogger(`phase:${phaseName}`);
}

export function createWorkflowLogger(): PhaseLogger {
  return createLogger('workflow');
}
