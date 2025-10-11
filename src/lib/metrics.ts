import type { RunMcpCommand } from './contextStore';

export interface AnalyticsMetrics {
  coveragePct: number;
  runtimeMs: number;
  success: boolean;
  details?: Record<string, unknown>;
}

export interface RecordMetricsOptions {
  command?: string;
  runner?: RunMcpCommand | null;
  feature?: string;
  phase?: string;
}

let registeredRunner: RunMcpCommand | null = null;

export function registerAnalyticsRunner(runner: RunMcpCommand | null): void {
  registeredRunner = runner;
}

type FetchFunction = (
  input: string,
  init: {
    method: string;
    headers: Record<string, string>;
    body: string;
  }
) => Promise<{ ok: boolean; status: number; statusText: string }>;

async function defaultAnalyticsRunner(command: string, payload: unknown): Promise<void> {
  const endpoint = process.env.ANALYTICS_MCP_ENDPOINT;
  if (!endpoint) {
    return;
  }

  const fetchFn: FetchFunction | undefined = (globalThis as { fetch?: FetchFunction }).fetch;
  if (!fetchFn) {
    console.warn('⚠️  Analytics MCP endpoint configured but fetch is unavailable in this runtime.');
    return;
  }

  const response = await fetchFn(endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-mcp-command': command
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Analytics MCP sync failed: ${response.status} ${response.statusText}`);
  }
}

function formatMetricsLog(metrics: AnalyticsMetrics, feature?: string, phase?: string): string {
  const parts = [
    `coverage=${metrics.coveragePct.toFixed(1)}%`,
    `runtime=${metrics.runtimeMs}ms`,
    `status=${metrics.success ? 'success' : 'failure'}`
  ];
  if (feature) {
    parts.push(`feature=${feature}`);
  }
  if (phase) {
    parts.push(`phase=${phase}`);
  }
  return `[metrics] ${parts.join(' ')}`;
}

export async function recordMetrics(
  metrics: AnalyticsMetrics,
  options: RecordMetricsOptions = {}
): Promise<AnalyticsMetrics & { timestamp: string }> {
  const timestamp = new Date().toISOString();
  const payload = {
    ...metrics,
    timestamp,
    feature: options.feature,
    phase: options.phase,
    details: metrics.details ?? {}
  };

  console.log(formatMetricsLog(metrics, options.feature, options.phase));

  const command = options.command || process.env.ANALYTICS_MCP_COMMAND || 'analytics.recordMetrics';
  const runner = options.runner ?? registeredRunner ?? (process.env.ANALYTICS_MCP_ENDPOINT ? defaultAnalyticsRunner : null);

  if (runner) {
    try {
      await runner(command, payload);
    } catch (error) {
      console.warn(`⚠️  Failed to push analytics metrics: ${(error as Error).message}`);
    }
  }

  return payload;
}
