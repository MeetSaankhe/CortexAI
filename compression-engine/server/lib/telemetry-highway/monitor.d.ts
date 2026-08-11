import type { MonitorOptions } from "./types.js";
/**
 * Failure-isolated telemetry client.
 *
 * Monitoring must never take down the host application: all network paths
 * swallow errors and the buffer is bounded. Events are batched and flushed
 * from a timer so calls to `info/warning/error` return immediately.
 */
export declare class Monitor {
    private readonly apiKey;
    private readonly endpoint;
    private readonly service?;
    private readonly environment?;
    private readonly region?;
    private readonly sourceType;
    private readonly batchSize;
    private readonly flushIntervalMs;
    private readonly maxBuffer;
    private readonly timeoutMs;
    private readonly maxRetries;
    private buffer;
    private timer;
    private closed;
    constructor(opts: MonitorOptions);
    log(severity: string, message: string, metadata?: Record<string, unknown>): void;
    debug(message: string, metadata?: Record<string, unknown>): void;
    info(message: string, metadata?: Record<string, unknown>): void;
    warning(message: string, metadata?: Record<string, unknown>): void;
    error(message: string, metadata?: Record<string, unknown>): void;
    critical(message: string, metadata?: Record<string, unknown>): void;
    exception(err: Error, message?: string, metadata?: Record<string, unknown>): void;
    /** Emit an arbitrary event type (metric/trace/system/security). */
    event(eventType: string, severity?: string, message?: string, metadata?: Record<string, unknown>): void;
    /** Send everything currently buffered. Never throws. */
    flush(): Promise<void>;
    /** Flush and stop the background timer. */
    close(): Promise<void>;
    private enqueue;
    private send;
}
