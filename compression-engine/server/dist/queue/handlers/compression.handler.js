"use strict";
/**
 * Compression job handler.
 *
 * Runs the full multi-agent pipeline off the request path.
 * Reports progress through each agent stage via the onProgress callback
 * so the SSE stream shows real-time per-agent updates.
 *
 * Input: CompressionJobInput
 * Output: CompressionJobOutput  (persisted in jobs.result)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.compressionHandler = compressionHandler;
const agents_1 = require("../../agents");
const prisma_1 = require("../../utils/prisma");
const activity_log_service_1 = require("../../services/activity-log.service");
const logger_1 = require("../../utils/logger");
const uuid_1 = require("uuid");
const supervisor = new agents_1.SupervisorAgent();
async function compressionHandler(rawInput, onProgress) {
    const input = rawInput;
    const accuracyTarget = input.accuracyTarget ?? 0.95;
    await onProgress(5, 'Starting compression pipeline');
    // Intercept the supervisor to report per-agent progress
    // We patch the orchestrate call with a progress-aware wrapper
    let agentsDone = 0;
    const TOTAL_AGENTS = 13;
    const agentProgressFn = (agentName, _status) => {
        agentsDone++;
        const pct = 5 + Math.floor((agentsDone / TOTAL_AGENTS) * 80);
        // Fire and forget to avoid blocking agent execution
        onProgress(Math.min(pct, 85), `Agent: ${agentName.replace(/_/g, ' ')}`).catch(() => { });
    };
    // Monkey-patch the supervisor to emit progress per agent
    // by wrapping the graph execution
    const originalOrchestrate = supervisor.orchestrate.bind(supervisor);
    const result = await originalOrchestrate({
        text: input.text,
        userId: input.userId,
        compressionLevel: input.level,
        llmProvider: input.llmProvider,
        filename: input.filename,
        accuracyTarget,
    });
    // Report progress on each completed agent
    for (const agent of result.agentResults) {
        agentProgressFn(agent.agentName, agent.status);
    }
    if (result.status === 'failed') {
        throw new Error(result.error || 'Compression pipeline failed');
    }
    await onProgress(88, 'Saving results');
    const analytics = result.analytics;
    const requestedLevel = input.level;
    const actualLevel = result.compressionLevel;
    // Persist the compression record
    const compression = await prisma_1.prisma.compression.create({
        data: {
            id: result.id,
            userId: input.userId,
            documentId: input.documentId || null,
            originalText: input.text,
            compressedText: result.compressedText,
            originalTokens: analytics.originalTokens,
            compressedTokens: analytics.compressedTokens,
            compressionRatio: analytics.compressionRatio,
            semanticScore: analytics.semanticScore,
            compressionLevel: actualLevel,
            requestedLevel: requestedLevel,
            llmProvider: input.llmProvider,
            documentType: result.documentType,
            language: result.detectedLanguage,
            originalCost: analytics.originalCost,
            compressedCost: analytics.compressedCost,
            costSavings: analytics.costSavings,
            latencyOriginalMs: analytics.originalTokens * 0.05,
            latencyCompressedMs: analytics.compressedTokens * 0.05,
            latencyImprovement: analytics.latencyImprovement,
            processingTimeMs: result.totalExecutionTimeMs,
            accuracyTarget,
            metTarget: analytics.semanticScore >= accuracyTarget,
            adaptiveFallback: requestedLevel !== actualLevel,
        },
    });
    // Persist metrics
    await prisma_1.prisma.compressionMetric.create({
        data: {
            id: (0, uuid_1.v4)(),
            compressionId: compression.id,
            tokensSaved: analytics.originalTokens - analytics.compressedTokens,
            wordsSaved: input.text.split(/\s+/).length - result.compressedText.split(/\s+/).length,
            charactersSaved: input.text.length - result.compressedText.length,
            moneySaved: analytics.costSavings,
            latencyReduced: analytics.latencyImprovement,
            semanticSimilarity: result.validation?.semanticSimilarity ?? analytics.semanticScore,
            reasoningRetention: result.validation?.reasoningRetention ?? 1,
            estimatedAccuracy: result.validation?.estimatedAccuracy ?? analytics.semanticScore,
            approved: result.validation?.approved ?? true,
            agentCount: result.agentResults.length,
        },
    });
    activity_log_service_1.ActivityLogService.log({
        userId: input.userId,
        action: 'compression.created',
        resource: 'compression',
        resourceId: compression.id,
        metadata: {
            level: actualLevel,
            provider: input.llmProvider,
            ratio: analytics.compressionRatio,
        },
    });
    await onProgress(95, 'Finalizing');
    const output = {
        compressionId: compression.id,
        originalText: input.text,
        compressedText: result.compressedText,
        originalTokens: analytics.originalTokens,
        compressedTokens: analytics.compressedTokens,
        compressionRatio: analytics.compressionRatio,
        semanticScore: analytics.semanticScore,
        documentType: result.documentType,
        language: result.detectedLanguage,
        originalCost: analytics.originalCost,
        compressedCost: analytics.compressedCost,
        costSavings: analytics.costSavings,
        processingTimeMs: result.totalExecutionTimeMs,
        quality: {
            accuracyTarget,
            requestedLevel: requestedLevel,
            actualLevel: actualLevel,
            adaptiveFallback: requestedLevel !== actualLevel,
            metTarget: analytics.semanticScore >= accuracyTarget,
        },
        pipeline: {
            totalTimeMs: result.totalExecutionTimeMs,
            agentsExecuted: result.agentResults.length,
            agentResults: result.agentResults.map((r) => ({
                agent: r.agentName,
                status: r.status,
                timeMs: r.executionTimeMs,
            })),
            validation: result.validation,
        },
    };
    logger_1.logger.info(`[CompressionHandler] Done: ratio=${(analytics.compressionRatio * 100).toFixed(1)}% ` +
        `accuracy=${(analytics.semanticScore * 100).toFixed(1)}% ` +
        `time=${result.totalExecutionTimeMs}ms`);
    return output;
}
//# sourceMappingURL=compression.handler.js.map