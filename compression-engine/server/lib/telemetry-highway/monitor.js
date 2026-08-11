import { randomUUID } from "node:crypto";
const SEVERITIES = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"];
/**
 * Failure-isolated telemetry client.
 *
 * Monitoring must never take down the host application: all network paths
 * swallow errors and the buffer is bounded. Events are batched and flushed
 * from a timer so calls to `info/warning/error` return immediately.
 */
export class Monitor {
    constructor(opts) {
        this.buffer = [];
        this.timer = null;
        this.closed = false;
        this.apiKey = opts.apiKey;
        this.endpoint = (opts.endpoint ?? "http://localhost:8000").replace(/\/+$/, "");
        this.service = opts.service;
        this.environment = opts.environment;
        this.region = opts.region;
        this.sourceType = opts.sourceType ?? "application";
        this.batchSize = opts.batchSize ?? 20;
        this.flushIntervalMs = opts.flushIntervalMs ?? 5000;
        this.maxBuffer = opts.maxBuffer ?? 10000;
        this.timeoutMs = opts.timeoutMs ?? 5000;
        this.maxRetries = opts.maxRetries ?? 3;
        this.timer = setInterval(() => void this.flush(), this.flushIntervalMs);
        // Do not keep the event loop alive just for telemetry.
        if (this.timer.unref)
            this.timer.unref();
    }
    // ----------------------------------------------------------------- public
    log(severity, message, metadata = {}) {
        const sev = severity.toUpperCase();
        this.enqueue({
            event_id: `evt_${randomUUID().replace(/-/g, "")}`,
            service: this.service,
            source_type: this.sourceType,
            environment: this.environment,
            region: this.region,
            event_type: "log",
            severity: SEVERITIES.includes(sev) ? sev : "INFO",
            message,
            timestamp: new Date().toISOString(),
            metadata,
        });
    }
    debug(message, metadata) {
        this.log("DEBUG", message, metadata);
    }
    info(message, metadata) {
        this.log("INFO", message, metadata);
    }
    warning(message, metadata) {
        this.log("WARNING", message, metadata);
    }
    error(message, metadata) {
        this.log("ERROR", message, metadata);
    }
    critical(message, metadata) {
        this.log("CRITICAL", message, metadata);
    }
    exception(err, message, metadata = {}) {
        this.log("ERROR", message ?? err.message, {
            ...metadata,
            exception_type: err.name,
            traceback: err.stack,
        });
    }
    /** Emit an arbitrary event type (metric/trace/system/security). */
    event(eventType, severity = "INFO", message, metadata = {}) {
        this.enqueue({
            event_id: `evt_${randomUUID().replace(/-/g, "")}`,
            service: this.service,
            source_type: this.sourceType,
            environment: this.environment,
            region: this.region,
            event_type: eventType,
            severity: severity.toUpperCase(),
            message,
            timestamp: new Date().toISOString(),
            metadata,
        });
    }
    /** Send everything currently buffered. Never throws. */
    async flush() {
        if (this.buffer.length === 0)
            return;
        const events = this.buffer;
        this.buffer = [];
        await this.send(events);
    }
    /** Flush and stop the background timer. */
    async close() {
        if (this.closed)
            return;
        this.closed = true;
        if (this.timer)
            clearInterval(this.timer);
        await this.flush();
    }
    // ---------------------------------------------------------------- internal
    enqueue(event) {
        if (this.buffer.length >= this.maxBuffer) {
            this.buffer.shift(); // drop oldest to keep memory bounded
        }
        this.buffer.push(event);
        if (this.buffer.length >= this.batchSize) {
            void this.flush();
        }
    }
    async send(events) {
        const url = `${this.endpoint}/api/v1/telemetry/batch`;
        const body = JSON.stringify({ events });
        for (let attempt = 0; attempt < this.maxRetries; attempt++) {
            const controller = new AbortController();
            const t = setTimeout(() => controller.abort(), this.timeoutMs);
            try {
                const res = await fetch(url, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "X-API-Key": this.apiKey },
                    body,
                    signal: controller.signal,
                });
                clearTimeout(t);
                if (res.ok)
                    return;
                // Permanent client errors (except 429) are not retryable — drop.
                if (res.status !== 429 && res.status >= 400 && res.status < 500)
                    return;
            }
            catch {
                clearTimeout(t);
                // Network error — swallow and retry.
            }
            await new Promise((r) => setTimeout(r, Math.min(2 ** attempt * 200, 2000)));
        }
        // Give up silently; monitoring must never crash the app.
    }
}
