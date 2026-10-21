"use strict";
/**
 * Queue bootstrap — registers all job handlers and recovers stuck jobs.
 * Called once from app.ts on startup.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.jobEmitter = exports.JobQueue = void 0;
exports.initQueue = initQueue;
const job_queue_1 = require("./job-queue");
const compression_handler_1 = require("./handlers/compression.handler");
const logger_1 = require("../utils/logger");
async function initQueue() {
    job_queue_1.JobQueue.register('compression', compression_handler_1.compressionHandler);
    await job_queue_1.JobQueue.recoverStuckJobs();
    logger_1.logger.info('[Queue] Initialized with handlers: compression');
}
var job_queue_2 = require("./job-queue");
Object.defineProperty(exports, "JobQueue", { enumerable: true, get: function () { return job_queue_2.JobQueue; } });
Object.defineProperty(exports, "jobEmitter", { enumerable: true, get: function () { return job_queue_2.jobEmitter; } });
//# sourceMappingURL=index.js.map