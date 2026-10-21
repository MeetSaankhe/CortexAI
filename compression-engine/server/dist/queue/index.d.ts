/**
 * Queue bootstrap — registers all job handlers and recovers stuck jobs.
 * Called once from app.ts on startup.
 */
export declare function initQueue(): Promise<void>;
export { JobQueue, jobEmitter } from './job-queue';
export type { JobType, JobStatus, JobProgress, JobHandler } from './job-queue';
//# sourceMappingURL=index.d.ts.map