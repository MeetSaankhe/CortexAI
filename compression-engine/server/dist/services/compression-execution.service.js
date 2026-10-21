"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compressAndPersist = compressAndPersist;
const agents_1 = require("../agents");
const prisma_1 = require("../utils/prisma");
const uuid_1 = require("uuid");
function sanitizeString(str) {
    if (!str)
        return '';
    return str.replace(/\u0000/g, '');
}
const supervisor = new agents_1.SupervisorAgent();
async function compressAndPersist(input) {
    const cleanText = sanitizeString(input.text);
    const accuracyTarget = input.accuracyTarget ?? 0.95;
    const workflowResult = await supervisor.orchestrate({
        text: cleanText,
        userId: input.userId,
        compressionLevel: input.compressionLevel,
        llmProvider: input.llmProvider,
        filename: input.filename,
        accuracyTarget,
    });
    if (workflowResult.status === 'failed') {
        throw new Error(workflowResult.error || 'Compression pipeline failed');
    }
    const analytics = workflowResult.analytics;
    const requestedLevel = input.compressionLevel;
    const actualLevel = workflowResult.compressionLevel;
    const adaptiveFallback = requestedLevel !== actualLevel;
    const compression = await prisma_1.prisma.compression.create({
        data: {
            id: workflowResult.id,
            userId: input.userId,
            documentId: input.documentId || null,
            originalText: cleanText,
            compressedText: sanitizeString(workflowResult.compressedText),
            originalTokens: analytics.originalTokens,
            compressedTokens: analytics.compressedTokens,
            compressionRatio: analytics.compressionRatio,
            semanticScore: analytics.semanticScore,
            compressionLevel: workflowResult.compressionLevel,
            requestedLevel: requestedLevel,
            llmProvider: input.llmProvider,
            documentType: (input.documentType || workflowResult.documentType),
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
            adaptiveFallback,
        },
    });
    await prisma_1.prisma.compressionMetric.create({
        data: {
            id: (0, uuid_1.v4)(),
            compressionId: compression.id,
            tokensSaved: analytics.originalTokens - analytics.compressedTokens,
            wordsSaved: cleanText.split(/\s+/).length - workflowResult.compressedText.split(/\s+/).length,
            charactersSaved: cleanText.length - workflowResult.compressedText.length,
            moneySaved: analytics.costSavings,
            latencyReduced: analytics.latencyImprovement,
            semanticSimilarity: workflowResult.validation?.semanticSimilarity ?? analytics.semanticScore,
            reasoningRetention: workflowResult.validation?.reasoningRetention ?? 1,
            estimatedAccuracy: workflowResult.validation?.estimatedAccuracy ?? analytics.semanticScore,
            approved: workflowResult.validation?.approved ?? true,
            agentCount: workflowResult.agentResults.length,
        },
    });
    return {
        compressionId: compression.id,
        apiResult: {
            id: compression.id,
            originalText: input.text,
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
    };
}
//# sourceMappingURL=compression-execution.service.js.map