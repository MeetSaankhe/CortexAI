"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jobRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const errorHandler_1 = require("../middleware/errorHandler");
const prisma_1 = require("../utils/prisma");
const job_worker_service_1 = require("../services/job-worker.service");
exports.jobRouter = (0, express_1.Router)();
exports.jobRouter.get('/', auth_1.authenticate, async (req, res, next) => {
    try {
        const jobs = await prisma_1.prisma.job.findMany({
            where: { userId: req.userId },
            orderBy: { createdAt: 'desc' },
            take: 50,
            select: {
                id: true,
                type: true,
                status: true,
                progress: true,
                stage: true,
                error: true,
                createdAt: true,
                updatedAt: true,
                startedAt: true,
                completedAt: true,
            },
        });
        res.json({ success: true, data: jobs });
    }
    catch (error) {
        next(error);
    }
});
exports.jobRouter.get('/:id', auth_1.authenticate, async (req, res, next) => {
    try {
        const id = req.params.id;
        const job = await prisma_1.prisma.job.findFirst({
            where: { id, userId: req.userId },
            select: {
                id: true,
                type: true,
                status: true,
                progress: true,
                stage: true,
                result: true,
                error: true,
                createdAt: true,
                updatedAt: true,
                startedAt: true,
                completedAt: true,
            },
        });
        if (!job)
            throw new errorHandler_1.AppError('Job not found', 404);
        res.json({ success: true, data: job });
    }
    catch (error) {
        next(error);
    }
});
exports.jobRouter.post('/:id/run', auth_1.authenticate, async (req, res, next) => {
    try {
        const id = req.params.id;
        const job = await prisma_1.prisma.job.findFirst({ where: { id, userId: req.userId } });
        if (!job)
            throw new errorHandler_1.AppError('Job not found', 404);
        if (job.status !== 'pending')
            throw new errorHandler_1.AppError('Job is not pending', 400);
        await (0, job_worker_service_1.processJobById)(job.id);
        const updated = await prisma_1.prisma.job.findFirst({
            where: { id: job.id, userId: req.userId },
            select: {
                id: true,
                type: true,
                status: true,
                progress: true,
                stage: true,
                result: true,
                error: true,
                createdAt: true,
                updatedAt: true,
                startedAt: true,
                completedAt: true,
            },
        });
        res.json({ success: true, data: updated });
    }
    catch (error) {
        next(error);
    }
});
exports.jobRouter.post('/worker/run-once', async (req, res, next) => {
    try {
        const required = (process.env.WORKER_SECRET || '').trim();
        if (!required)
            throw new errorHandler_1.AppError('WORKER_SECRET is not configured', 500);
        const provided = req.headers['x-worker-secret'] || '';
        if (provided !== required)
            throw new errorHandler_1.AppError('Forbidden', 403);
        const result = await (0, job_worker_service_1.processNextJob)();
        res.json({ success: true, data: result });
    }
    catch (error) {
        next(error);
    }
});
//# sourceMappingURL=job.routes.js.map