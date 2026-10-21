"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compressionRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const agents_1 = require("../agents");
const tokens_1 = require("../utils/tokens");
const prisma_1 = require("../utils/prisma");
const errorHandler_1 = require("../middleware/errorHandler");
const logger_1 = require("../utils/logger");
const activity_log_service_1 = require("../services/activity-log.service");
const uuid_1 = require("uuid");
const concurrency_1 = require("../utils/concurrency");
const limiters_1 = require("../utils/limiters");
exports.compressionRouter = (0, express_1.Router)();
const supervisor = new agents_1.SupervisorAgent();
function sanitizeString(str) {
    if (!str)
        return '';
    return str.replace(/\u0000/g, '');
}
/**
 * Core compression handler used by both /compress and /start.
 */
async function runCompression(req, res) {
    const { text, level = 'medium', documentType, llmProvider = 'openai', documentId, accuracyTarget = 0.95, } = req.body;
    if (!text || text.trim().length === 0) {
        throw new errorHandler_1.AppError('Text is required for compression', 400);
    }
    logger_1.logger.info(`[Compression] Starting pipeline: user=${req.userId} level=${level} target=${accuracyTarget}`);
    const cleanText = sanitizeString(text);
    const workflowResult = await supervisor.orchestrate({
        text: cleanText,
        userId: req.userId,
        compressionLevel: level,
        llmProvider,
        filename: req.body.filename,
        accuracyTarget,
    });
    if (workflowResult.status === 'failed') {
        throw new errorHandler_1.AppError(`Compression pipeline failed: ${workflowResult.error}`, 500);
    }
    const analytics = workflowResult.analytics;
    const compression = await prisma_1.prisma.compression.create({
        data: {
            id: workflowResult.id,
            userId: req.userId,
            documentId: documentId || null,
            originalText: cleanText,
            compressedText: sanitizeString(workflowResult.compressedText),
            originalTokens: analytics.originalTokens,
            compressedTokens: analytics.compressedTokens,
            compressionRatio: analytics.compressionRatio,
            semanticScore: analytics.semanticScore,
            compressionLevel: workflowResult.compressionLevel,
            requestedLevel: level,
            llmProvider: llmProvider,
            documentType: (documentType || workflowResult.documentType),
            language: workflowResult.detectedLanguage,
            originalCost: analytics.originalCost,
            compressedCost: analytics.compressedCost,
            costSavings: analytics.costSavings,
            latencyOriginalMs: analytics.originalTokens * 0.05,
            latencyCompressedMs: analytics.compressedTokens * 0.05,
            latencyImprovement: analytics.latencyImprovement,
            processingTimeMs: workflowResult.totalExecutionTimeMs,
            accuracyTarget,
            metTarget: analytics.semanticScore >= accuracyTarget,
            adaptiveFallback: level !== workflowResult.compressionLevel,
        },
    });
    // Persist detailed metrics
    await prisma_1.prisma.compressionMetric.create({
        data: {
            id: (0, uuid_1.v4)(),
            compressionId: compression.id,
            tokensSaved: analytics.originalTokens - analytics.compressedTokens,
            wordsSaved: text.split(/\s+/).length - workflowResult.compressedText.split(/\s+/).length,
            charactersSaved: text.length - workflowResult.compressedText.length,
            moneySaved: analytics.costSavings,
            latencyReduced: analytics.latencyImprovement,
            semanticSimilarity: workflowResult.validation?.semanticSimilarity ?? analytics.semanticScore,
            reasoningRetention: workflowResult.validation?.reasoningRetention ?? 1,
            estimatedAccuracy: workflowResult.validation?.estimatedAccuracy ?? analytics.semanticScore,
            approved: workflowResult.validation?.approved ?? true,
            agentCount: workflowResult.agentResults.length,
        },
    });
    activity_log_service_1.ActivityLogService.log({
        userId: req.userId,
        action: 'compression.created',
        resource: 'compression',
        resourceId: compression.id,
        metadata: {
            level, provider: llmProvider,
            ratio: analytics.compressionRatio,
            tokensSaved: analytics.originalTokens - analytics.compressedTokens,
        },
        ipAddress: req.ip,
    });
    logger_1.logger.info(`[Compression] Complete: ratio=${(analytics.compressionRatio * 100).toFixed(1)}% time=${workflowResult.totalExecutionTimeMs}ms`);
    const requestedLevel = level;
    const actualLevel = workflowResult.compressionLevel;
    const adaptiveFallback = requestedLevel !== actualLevel;
    res.json({
        success: true,
        data: {
            id: compression.id,
            originalText: text,
            compressedText: workflowResult.compressedText,
            originalTokens: analytics.originalTokens,
            compressedTokens: analytics.compressedTokens,
            compressionRatio: analytics.compressionRatio,
            semanticScore: analytics.semanticScore,
            documentType: workflowResult.documentType,
            language: workflowResult.detectedLanguage,
            originalCost: analytics.originalCost,
            compressedCost: analytics.compressedCost,
            costSavings: analytics.costSavings,
            latency: workflowResult.totalExecutionTimeMs,
            removedSections: [],
            modifiedSections: [],
            quality: {
                accuracyTarget,
                requestedLevel,
                actualLevel,
                adaptiveFallback,
                metTarget: analytics.semanticScore >= accuracyTarget,
            },
            pipeline: {
                totalTimeMs: workflowResult.totalExecutionTimeMs,
                agentsExecuted: workflowResult.agentResults.length,
                agentResults: workflowResult.agentResults.map((r) => ({
                    agent: r.agentName,
                    status: r.status,
                    timeMs: r.executionTimeMs,
                })),
                validation: workflowResult.validation,
            },
        },
    });
}
/**
 * POST /compression/compress - primary endpoint
 */
exports.compressionRouter.post('/compress', auth_1.authenticate, async (req, res, next) => {
    try {
        await limiters_1.compressionLimiter.run(() => runCompression(req, res));
    }
    catch (error) {
        if (error instanceof Error && error.message === concurrency_1.CONCURRENCY_QUEUE_FULL) {
            next(new errorHandler_1.AppError('Server is busy processing other compressions. Please try again in a moment.', 429));
            return;
        }
        next(error);
    }
});
/**
 * POST /compression/start - alias for /compress (spec-compliant naming)
 */
exports.compressionRouter.post('/start', auth_1.authenticate, async (req, res, next) => {
    try {
        await limiters_1.compressionLimiter.run(() => runCompression(req, res));
    }
    catch (error) {
        if (error instanceof Error && error.message === concurrency_1.CONCURRENCY_QUEUE_FULL) {
            next(new errorHandler_1.AppError('Server is busy processing other compressions. Please try again in a moment.', 429));
            return;
        }
        next(error);
    }
});
exports.compressionRouter.post('/jobs', auth_1.authenticate, async (req, res, next) => {
    try {
        const { text, level = 'medium', documentType, llmProvider = 'openai', documentId, accuracyTarget = 0.95, filename, } = req.body;
        if (!text || text.trim().length === 0) {
            throw new errorHandler_1.AppError('Text is required for compression', 400);
        }
        const jobInput = {
            text: sanitizeString(text),
            filename: filename || null,
            documentType: documentType || null,
            documentId: documentId || null,
            compressionLevel: level,
            llmProvider,
            accuracyTarget,
        };
        const job = await prisma_1.prisma.job.create({
            data: {
                userId: req.userId,
                type: 'compression',
                status: 'pending',
                progress: 0,
                stage: 'queued',
                input: JSON.stringify(jobInput),
                ...(documentType ? { stage: `queued:${documentType}` } : {}),
            },
        });
        res.status(202).json({ success: true, data: { jobId: job.id } });
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /compression/analyze - analyze without compressing
 */
exports.compressionRouter.post('/analyze', auth_1.authenticate, async (req, res, next) => {
    try {
        const { text, filename } = req.body;
        if (!text)
            throw new errorHandler_1.AppError('Text is required', 400);
        const documentType = (0, tokens_1.detectDocumentType)(text, filename);
        const tokens = (0, tokens_1.estimateTokens)(text, documentType);
        const words = text.split(/\s+/).filter((w) => w.length > 0).length;
        const characters = text.length;
        const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0).length;
        const avgWordsPerSentence = sentences > 0 ? words / sentences : 0;
        const readabilityScore = Math.max(0, Math.min(100, 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * 1.5)));
        const costs = {
            openai: (0, tokens_1.estimateCost)(tokens, 'openai'),
            gemini: (0, tokens_1.estimateCost)(tokens, 'gemini'),
            claude: (0, tokens_1.estimateCost)(tokens, 'claude'),
            llama: (0, tokens_1.estimateCost)(tokens, 'llama'),
            deepseek: (0, tokens_1.estimateCost)(tokens, 'deepseek'),
            mistral: (0, tokens_1.estimateCost)(tokens, 'mistral'),
        };
        let recommendation;
        if (tokens > 10000)
            recommendation = 'extreme';
        else if (tokens > 5000)
            recommendation = 'high';
        else if (tokens > 2000)
            recommendation = 'medium';
        else
            recommendation = 'low';
        res.json({
            success: true,
            data: {
                words, characters, tokens, sentences,
                documentType,
                readabilityScore: Math.round(readabilityScore),
                costs,
                recommendation,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /compression/compare - compare compression across multiple levels
 */
exports.compressionRouter.post('/compare', auth_1.authenticate, async (req, res, next) => {
    try {
        const { text, llmProvider = 'openai' } = req.body;
        if (!text)
            throw new errorHandler_1.AppError('Text is required', 400);
        const levels = ['low', 'medium', 'high', 'extreme'];
        const results = [];
        for (const level of levels) {
            const result = await limiters_1.compressionLimiter.run(() => supervisor.orchestrate({
                text,
                userId: req.userId,
                compressionLevel: level,
                llmProvider,
            }));
            results.push({
                level,
                status: result.status,
                compressedText: result.compressedText,
                originalTokens: result.analytics?.originalTokens ?? 0,
                compressedTokens: result.analytics?.compressedTokens ?? 0,
                compressionRatio: result.analytics?.compressionRatio ?? 0,
                semanticScore: result.analytics?.semanticScore ?? 0,
                costSavings: result.analytics?.costSavings ?? 0,
                processingTime: result.totalExecutionTimeMs,
                approved: result.validation?.approved ?? true,
            });
        }
        res.json({
            success: true,
            data: {
                original: {
                    text,
                    tokens: results[0].originalTokens,
                },
                comparisons: results,
                recommendation: recommendBestLevel(results),
            },
        });
    }
    catch (error) {
        if (error instanceof Error && error.message === concurrency_1.CONCURRENCY_QUEUE_FULL) {
            next(new errorHandler_1.AppError('Server is busy processing other compressions. Please try again in a moment.', 429));
            return;
        }
        next(error);
    }
});
function recommendBestLevel(results) {
    // Pick the highest compression that's still approved with >90% semantic score
    const approved = results.filter((r) => r.approved && r.semanticScore >= 0.9);
    if (approved.length === 0)
        return 'low';
    return approved.reduce((best, r) => (r.compressionRatio > best.compressionRatio ? r : best)).level;
}
/**
 * GET /compression/history - paginated compression history
 */
exports.compressionRouter.get('/history', auth_1.authenticate, async (req, res, next) => {
    try {
        const { page = '1', limit = '20', search, documentType, sortBy = 'createdAt', order = 'desc' } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        const where = { userId: req.userId };
        if (search) {
            where.OR = [
                { originalText: { contains: search } },
                { compressedText: { contains: search } },
            ];
        }
        if (documentType) {
            where.documentType = documentType;
        }
        const [compressions, total] = await Promise.all([
            prisma_1.prisma.compression.findMany({
                where,
                orderBy: { [sortBy]: order },
                skip,
                take: limitNum,
                select: {
                    id: true,
                    originalTokens: true,
                    compressedTokens: true,
                    compressionRatio: true,
                    semanticScore: true,
                    compressionLevel: true,
                    llmProvider: true,
                    documentType: true,
                    costSavings: true,
                    status: true,
                    createdAt: true,
                    originalText: true,
                    compressedText: true,
                },
            }),
            prisma_1.prisma.compression.count({ where }),
        ]);
        res.json({
            success: true,
            data: {
                compressions: compressions.map((c) => ({
                    ...c,
                    originalText: c.originalText.slice(0, 200),
                    compressedText: c.compressedText.slice(0, 200),
                })),
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    pages: Math.ceil(total / limitNum),
                },
            },
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /compression/:id - get a single compression with metrics
 */
exports.compressionRouter.get('/:id', auth_1.authenticate, async (req, res, next) => {
    try {
        const id = req.params.id;
        const compression = await prisma_1.prisma.compression.findFirst({
            where: { id, userId: req.userId },
            include: { metrics: true },
        });
        if (!compression)
            throw new errorHandler_1.AppError('Compression not found', 404);
        res.json({ success: true, data: compression });
    }
    catch (error) {
        next(error);
    }
});
/**
 * DELETE /compression/:id - remove a compression
 */
exports.compressionRouter.delete('/:id', auth_1.authenticate, async (req, res, next) => {
    try {
        const id = req.params.id;
        const existing = await prisma_1.prisma.compression.findFirst({
            where: { id, userId: req.userId },
        });
        if (!existing)
            throw new errorHandler_1.AppError('Compression not found', 404);
        await prisma_1.prisma.compression.delete({ where: { id } });
        activity_log_service_1.ActivityLogService.log({
            userId: req.userId,
            action: 'compression.deleted',
            resource: 'compression',
            resourceId: id,
            ipAddress: req.ip,
        });
        res.json({ success: true, message: 'Compression deleted' });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /compression/history/:id - get a history record (kept for backwards compat)
 */
exports.compressionRouter.get('/history/:id', auth_1.authenticate, async (req, res, next) => {
    try {
        const id = req.params.id;
        const compression = await prisma_1.prisma.compression.findFirst({
            where: { id, userId: req.userId },
        });
        if (!compression)
            throw new errorHandler_1.AppError('Compression not found', 404);
        res.json({ success: true, data: compression });
    }
    catch (error) {
        next(error);
    }
});
/**
 * DELETE /compression/history/:id - kept for backwards compat
 */
exports.compressionRouter.delete('/history/:id', auth_1.authenticate, async (req, res, next) => {
    try {
        const id = req.params.id;
        await prisma_1.prisma.compression.deleteMany({
            where: { id, userId: req.userId },
        });
        res.json({ success: true, message: 'Compression deleted' });
    }
    catch (error) {
        next(error);
    }
});
//# sourceMappingURL=compression.routes.js.map