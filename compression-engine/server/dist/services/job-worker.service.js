"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processNextJob = processNextJob;
exports.processJobById = processJobById;
const prisma_1 = require("../utils/prisma");
const uuid_1 = require("uuid");
const compression_execution_service_1 = require("./compression-execution.service");
const instanceId = process.env.JOB_WORKER_INSTANCE_ID || (0, uuid_1.v4)();
async function setJobState(jobId, data) {
    await prisma_1.prisma.job.update({
        where: { id: jobId },
        data: {
            ...(data.status != null ? { status: data.status } : {}),
            ...(data.progress != null ? { progress: data.progress } : {}),
            ...(data.stage !== undefined && data.stage !== null ? { stage: data.stage } : {}),
            ...(data.result !== undefined ? { result: data.result } : {}),
            ...(data.errorMessage !== undefined ? { error: data.errorMessage } : {}),
            ...(data.startedAt !== undefined ? { startedAt: data.startedAt } : {}),
            ...(data.finishedAt !== undefined ? { completedAt: data.finishedAt } : {}),
        },
    });
}
async function claimNextPendingJob() {
    return prisma_1.prisma.$transaction(async (tx) => {
        const job = await tx.job.findFirst({
            where: { status: 'pending' },
            orderBy: { createdAt: 'asc' },
            select: {
                id: true,
                userId: true,
                type: true,
                input: true,
            },
        });
        if (!job)
            return null;
        const claimed = await tx.job.updateMany({
            where: { id: job.id, status: 'pending' },
            data: { status: 'running', progress: 1, stage: `claimed:${instanceId}`, startedAt: new Date() },
        });
        if (claimed.count === 0)
            return null;
        // parse the JSON input into the expected fields
        const parsed = (() => {
            try {
                return JSON.parse(job.input || '{}');
            }
            catch (e) {
                return {};
            }
        })();
        return {
            ...job,
            inputText: parsed.text ?? null,
            inputFilename: parsed.filename ?? null,
            inputMimeType: parsed.mimeType ?? null,
            inputImageBase64: parsed.imageBase64 ?? null,
            language: parsed.language ?? parsed.lang ?? null,
            compressionLevel: parsed.compressionLevel ?? null,
            llmProvider: parsed.llmProvider ?? null,
            accuracyTarget: parsed.accuracyTarget ?? null,
        };
    });
}
async function processJob(job) {
    const { id: jobId } = job;
    try {
        if (job.type === 'compression') {
            if (!job.inputText)
                throw new Error('Missing input text');
            await setJobState(jobId, { progress: 5, stage: 'compress:start' });
            const { apiResult } = await (0, compression_execution_service_1.compressAndPersist)({
                text: job.inputText,
                userId: job.userId,
                compressionLevel: (job.compressionLevel || 'medium'),
                llmProvider: job.llmProvider || 'openai',
                filename: job.inputFilename || undefined,
                accuracyTarget: job.accuracyTarget ?? undefined,
            });
            await setJobState(jobId, { progress: 100, stage: 'completed', status: 'completed', result: apiResult, finishedAt: new Date() });
            return;
        }
        throw new Error(`Unsupported job type: ${job.type}`);
    }
    catch (e) {
        const message = e instanceof Error ? e.message : 'Job failed';
        await setJobState(jobId, {
            status: 'failed',
            progress: Math.max(1, Math.min(99, (await prisma_1.prisma.job.findUnique({ where: { id: jobId }, select: { progress: true } }))?.progress ?? 1)),
            stage: 'failed',
            errorMessage: message,
            finishedAt: new Date(),
        });
    }
}
async function processNextJob() {
    const job = await claimNextPendingJob();
    if (!job)
        return { processed: false };
    await processJob(job);
    return { processed: true, jobId: job.id };
}
async function processJobById(jobId) {
    const job = await prisma_1.prisma.job.findFirst({
        where: { id: jobId, status: { in: ['pending', 'running'] } },
        select: {
            id: true,
            userId: true,
            type: true,
            input: true,
            status: true,
        },
    });
    if (!job)
        return;
    if (job.status === 'pending') {
        await prisma_1.prisma.job.update({ where: { id: jobId }, data: { status: 'running', progress: 1, stage: `claimed:${instanceId}`, startedAt: new Date() } });
    }
    const parsed = (() => {
        try {
            return JSON.parse(job.input || '{}');
        }
        catch (e) {
            return {};
        }
    })();
    const mapped = {
        ...job,
        inputText: parsed.text ?? null,
        inputFilename: parsed.filename ?? null,
        inputMimeType: parsed.mimeType ?? null,
        inputImageBase64: parsed.imageBase64 ?? null,
        language: parsed.language ?? parsed.lang ?? null,
        compressionLevel: parsed.compressionLevel ?? null,
        llmProvider: parsed.llmProvider ?? null,
        accuracyTarget: parsed.accuracyTarget ?? null,
    };
    await processJob(mapped);
}
//# sourceMappingURL=job-worker.service.js.map