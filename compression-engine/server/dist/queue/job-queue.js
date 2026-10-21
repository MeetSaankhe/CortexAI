"use strict";
/**
 * In-process Job Queue with Prisma persistence.
 *
 * Design:
 *   - No Redis or external broker required — jobs are persisted in the DB.
 *   - A fixed-size worker pool (default 2 concurrent slots) processes jobs FIFO.
 *   - SSE emitter broadcasts progress to connected clients in real-time.
 *   - Jobs survive server restart: on startup any "running" jobs are reset
 *     to "queued" so they get retried.
 *
 * Job lifecycle:
 *   queued → running → completed | failed
 *
 * Usage:
 *   const jobId = await JobQueue.enqueue('compression', userId, payload);
 *   // client polls GET /jobs/:jobId
 *   // or subscribes to GET /jobs/:jobId/stream (SSE)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobQueue = exports.jobEmitter = void 0;
const events_1 = require("events");
const prisma_1 = require("../utils/prisma");
const logger_1 = require("../utils/logger");
// ── Global SSE emitter (per-process) ──────────────────────────────────────
// One emitter for all jobs. Clients subscribe with event name = jobId.
exports.jobEmitter = new events_1.EventEmitter();
exports.jobEmitter.setMaxListeners(500);
// ── Queue state ────────────────────────────────────────────────────────────
const MAX_CONCURRENCY = 2;
let running = 0;
const handlers = new Map();
// ── Internal helpers ───────────────────────────────────────────────────────
async function emit(jobId, update) {
    const payload = {
        jobId,
        status: 'running',
        progress: 0,
        stage: '',
        ...update,
    };
    exports.jobEmitter.emit(jobId, payload);
}
async function markRunning(jobId) {
    await prisma_1.prisma.job.update({
        where: { id: jobId },
        data: { status: 'running', startedAt: new Date(), stage: 'starting', progress: 0 },
    });
    await emit(jobId, { status: 'running', progress: 0, stage: 'starting' });
}
async function markProgress(jobId, progress, stage) {
    await prisma_1.prisma.job.update({
        where: { id: jobId },
        data: { progress, stage },
    });
    await emit(jobId, { status: 'running', progress, stage });
}
async function markCompleted(jobId, result) {
    await prisma_1.prisma.job.update({
        where: { id: jobId },
        data: {
            status: 'completed',
            progress: 100,
            stage: 'completed',
            result: JSON.stringify(result),
            completedAt: new Date(),
        },
    });
    await emit(jobId, { status: 'completed', progress: 100, stage: 'completed', result });
}
async function markFailed(jobId, error) {
    await prisma_1.prisma.job.update({
        where: { id: jobId },
        data: {
            status: 'failed',
            stage: 'failed',
            error,
            completedAt: new Date(),
        },
    });
    await emit(jobId, { status: 'failed', progress: 0, stage: 'failed', error });
}
// ── Worker loop ────────────────────────────────────────────────────────────
async function processNext() {
    if (running >= MAX_CONCURRENCY)
        return;
    const job = await prisma_1.prisma.job.findFirst({
        where: { status: 'queued' },
        orderBy: { createdAt: 'asc' },
    });
    if (!job)
        return;
    running++;
    await markRunning(job.id);
    const handler = handlers.get(job.type);
    if (!handler) {
        await markFailed(job.id, `No handler registered for job type: ${job.type}`);
        running--;
        scheduleNext();
        return;
    }
    logger_1.logger.info(`[Queue] Processing job ${job.id} (type=${job.type})`);
    try {
        let input;
        try {
            input = JSON.parse(job.input);
        }
        catch {
            throw new Error('Invalid job input JSON');
        }
        const result = await handler(input, async (progress, stage) => {
            await markProgress(job.id, progress, stage);
        });
        await markCompleted(job.id, result);
        logger_1.logger.info(`[Queue] Job ${job.id} completed`);
    }
    catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        await markFailed(job.id, msg);
        logger_1.logger.error(`[Queue] Job ${job.id} failed: ${msg}`);
    }
    finally {
        running--;
        scheduleNext();
    }
}
function scheduleNext() {
    setImmediate(processNext);
}
// ── Public API ─────────────────────────────────────────────────────────────
exports.JobQueue = {
    /**
     * Register a handler for a job type. Called once at startup.
     */
    register(type, handler) {
        handlers.set(type, handler);
        logger_1.logger.info(`[Queue] Registered handler for job type: ${type}`);
    },
    /**
     * Enqueue a new job. Returns the jobId immediately.
     * The job will be processed in the background.
     */
    async enqueue(type, userId, input) {
        const job = await prisma_1.prisma.job.create({
            data: {
                userId,
                type,
                input: JSON.stringify(input),
                status: 'queued',
                stage: 'queued',
                progress: 0,
            },
        });
        scheduleNext();
        logger_1.logger.info(`[Queue] Enqueued job ${job.id} (type=${type})`);
        return job.id;
    },
    /**
     * Get the current state of a job. Used for polling.
     */
    async getStatus(jobId) {
        const job = await prisma_1.prisma.job.findUnique({ where: { id: jobId } });
        if (!job)
            return null;
        const result = job.result
            ? (() => { try {
                return JSON.parse(job.result);
            }
            catch {
                return null;
            } })()
            : undefined;
        return {
            jobId: job.id,
            status: job.status,
            progress: job.progress,
            stage: job.stage,
            result,
            error: job.error ?? undefined,
        };
    },
    /**
     * On startup: reset any jobs stuck in "running" state
     * (e.g., from a crashed server) back to "queued".
     */
    async recoverStuckJobs() {
        const { count } = await prisma_1.prisma.job.updateMany({
            where: { status: 'running' },
            data: { status: 'queued', stage: 'queued', progress: 0, startedAt: null },
        });
        if (count > 0) {
            logger_1.logger.warn(`[Queue] Recovered ${count} stuck jobs → queued`);
            scheduleNext();
        }
    },
};
//# sourceMappingURL=job-queue.js.map