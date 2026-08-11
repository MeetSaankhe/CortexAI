/**
 * Telemetry Highway integration.
 *
 * Wraps the @telemetry-highway/node SDK for use in our CommonJS Express server.
 * Uses dynamic import() since the SDK is ESM.
 *
 * Never crashes the app — all telemetry is fire-and-forget.
 */

let monitorInstance: any = null;
let middlewareFn: any = null;
let initPromise: Promise<void> | null = null;

const TELEMETRY_API_KEY = process.env.TELEMETRY_API_KEY || 'th_18f6feac_bme6_vzZDmFpGtD6erNakRQMmJ4i20SRff3M7LCcBk8';
const TELEMETRY_ENDPOINT = process.env.TELEMETRY_ENDPOINT || 'http://localhost:8000';

async function init(): Promise<void> {
  if (monitorInstance) return;
  try {
    // Dynamic import for ESM module from our bundled lib
    const { Monitor, expressMiddleware } = await import('../../lib/telemetry-highway/index.js');
    monitorInstance = new Monitor({
      apiKey: TELEMETRY_API_KEY,
      endpoint: TELEMETRY_ENDPOINT,
      service: 'cortexai-server',
      environment: process.env.NODE_ENV || 'development',
      batchSize: 10,
      flushIntervalMs: 5000,
    });
    middlewareFn = expressMiddleware(monitorInstance);
    console.log('[Telemetry] Monitor initialized');
  } catch (err) {
    console.warn('[Telemetry] Failed to initialize (non-fatal):', (err as Error).message);
  }
}

// Start initialization immediately (non-blocking)
initPromise = init();

/**
 * Express middleware that logs every request.
 * Falls back to a no-op if telemetry isn't available.
 */
export function telemetryMiddleware(req: any, res: any, next: () => void): void {
  if (middlewareFn) {
    middlewareFn(req, res, next);
  } else {
    next();
  }
}

/**
 * Get the monitor instance for manual event logging.
 * Returns null if telemetry isn't initialized.
 */
export function getMonitor(): any {
  return monitorInstance;
}

/**
 * Log an info event.
 */
export function logInfo(message: string, metadata?: Record<string, unknown>): void {
  monitorInstance?.info(message, metadata);
}

/**
 * Log a warning event.
 */
export function logWarning(message: string, metadata?: Record<string, unknown>): void {
  monitorInstance?.warning(message, metadata);
}

/**
 * Log an error event.
 */
export function logError(message: string, metadata?: Record<string, unknown>): void {
  monitorInstance?.error(message, metadata);
}

/**
 * Log an exception.
 */
export function logException(err: Error, message?: string, metadata?: Record<string, unknown>): void {
  monitorInstance?.exception(err, message, metadata);
}
