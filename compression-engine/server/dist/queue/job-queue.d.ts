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
export type JobType = 'compression';
export type JobStatus = 'queued' | 'running' | 'completed' | 'failed';
export interface JobProgress {
    jobId: string;
    status: JobStatus;
    progress: number;
    stage: string;
    result?: unknown;
    error?: string;
}
export type JobHandler = (input: unknown, onProgress: (progress: number, stage: string) => void) => Promise<unknown>;
export declare const jobEmitter: EventEmitter<[never]>;
export declare const JobQueue: {
    /**
     * Register a handler for a job type. Called once at startup.
     */
    register(type: JobType, handler: JobHandler): void;
    /**
     * Enqueue a new job. Returns the jobId immediately.
     * The job will be processed in the background.
     */
    enqueue(type: JobType, userId: string, input: unknown): Promise<string>;
    /**
     * Get the current state of a job. Used for polling.
     */
    getStatus(jobId: string): Promise<JobProgress | null>;
    /**
     * On startup: reset any jobs stuck in "running" state
     * (e.g., from a crashed server) back to "queued".
     */
    recoverStuckJobs(): Promise<void>;
};
//# sourceMappingURL=job-queue.d.ts.map