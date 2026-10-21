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

import { EventEmitter } from 'events';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

// ── Types ─────────────────────────────────────────────────────────────────

export type JobType = 'compression';
export type JobStatus = 'queued' | 'running' | 'completed' | 'failed';

export interface JobProgress {
  jobId: string;
  status: JobStatus;
  progress: number;    // 0-100
  stage: string;       // current human-readable stage
  result?: unknown;
  error?: string;
}

export type JobHandler = (
  input: unknown,
  onProgress: (progress: number, stage: string) => void
) => Promise<unknown>;

// ── Global SSE emitter (per-process) ──────────────────────────────────────
// One emitter for all jobs. Clients subscribe with event name = jobId.
export const jobEmitter = new EventEmitter();
jobEmitter.setMaxListeners(500);

// ── Queue state ────────────────────────────────────────────────────────────
const MAX_CONCURRENCY = 2;
let running = 0;
const handlers = new Map<JobType, JobHandler>();

// ── Internal helpers ───────────────────────────────────────────────────────

async function emit(jobId: string, update: Partial<JobProgress>): Promise<void> {
  const payload: JobProgress = {
    jobId,
    status: 'running',
    progress: 0,
    stage: '',
    ...update,
  };
  jobEmitter.emit(jobId, payload);
}

async function markRunning(jobId: string): Promise<void> {
  await prisma.job.update({
    where: { id: jobId },
    data: { status: 'running', startedAt: new Date(), stage: 'starting', progress: 0 },
  });
  await emit(jobId, { status: 'running', progress: 0, stage: 'starting' });
}

async function markProgress(jobId: string, progress: number, stage: string): Promise<void> {
  await prisma.job.update({
    where: { id: jobId },
    data: { progress, stage },
  });
  await emit(jobId, { status: 'running', progress, stage });
}

async function markCompleted(jobId: string, result: unknown): Promise<void> {
  await prisma.job.update({
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

async function markFailed(jobId: string, error: string): Promise<void> {
  await prisma.job.update({
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

async function processNext(): Promise<void> {
  if (running >= MAX_CONCURRENCY) return;

  const job = await prisma.job.findFirst({
    where: { status: 'queued' },
    orderBy: { createdAt: 'asc' },
  });

  if (!job) return;

  running++;
  await markRunning(job.id);

  const handler = handlers.get(job.type as JobType);
  if (!handler) {
    await markFailed(job.id, `No handler registered for job type: ${job.type}`);
    running--;
    scheduleNext();
    return;
  }

  logger.info(`[Queue] Processing job ${job.id} (type=${job.type})`);

  try {
    let input: unknown;
    try {
      input = JSON.parse(job.input);
    } catch {
      throw new Error('Invalid job input JSON');
    }

    const result = await handler(input, async (progress, stage) => {
      await markProgress(job.id, progress, stage);
    });

    await markCompleted(job.id, result);
    logger.info(`[Queue] Job ${job.id} completed`);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    await markFailed(job.id, msg);
    logger.error(`[Queue] Job ${job.id} failed: ${msg}`);
  } finally {
    running--;
    scheduleNext();
  }
}

function scheduleNext(): void {
  setImmediate(processNext);
}

// ── Public API ─────────────────────────────────────────────────────────────

export const JobQueue = {
  /**
   * Register a handler for a job type. Called once at startup.
   */
  register(type: JobType, handler: JobHandler): void {
    handlers.set(type, handler);
    logger.info(`[Queue] Registered handler for job type: ${type}`);
  },

  /**
   * Enqueue a new job. Returns the jobId immediately.
   * The job will be processed in the background.
   */
  async enqueue(type: JobType, userId: string, input: unknown): Promise<string> {
    const job = await prisma.job.create({
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
    logger.info(`[Queue] Enqueued job ${job.id} (type=${type})`);
    return job.id;
  },

  /**
   * Get the current state of a job. Used for polling.
   */
  async getStatus(jobId: string): Promise<JobProgress | null> {
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) return null;

    const result = job.result
      ? (() => { try { return JSON.parse(job.result); } catch { return null; } })()
      : undefined;

    return {
      jobId: job.id,
      status: job.status as JobStatus,
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
  async recoverStuckJobs(): Promise<void> {
    const { count } = await prisma.job.updateMany({
      where: { status: 'running' },
      data: { status: 'queued', stage: 'queued', progress: 0, startedAt: null },
    });
    if (count > 0) {
      logger.warn(`[Queue] Recovered ${count} stuck jobs → queued`);
      scheduleNext();
    }
  },
};
