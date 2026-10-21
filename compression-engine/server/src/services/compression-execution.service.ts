import { SupervisorAgent } from '../agents';
import type { CompressionLevel } from '../agents/types';
import { prisma } from '../utils/prisma';
import { v4 as uuid } from 'uuid';

function sanitizeString(str: string | null | undefined): string {
  if (!str) return '';
  return str.replace(/\u0000/g, '');
}

const supervisor = new SupervisorAgent();

export async function compressAndPersist(input: {
  text: string;
  userId: string;
  compressionLevel: CompressionLevel;
  llmProvider: string;
  filename?: string;
  documentType?: string;
  documentId?: string;
  accuracyTarget?: number;
}): Promise<{
  compressionId: string;
  apiResult: {
    id: string;
    originalText: string;
    compressedText: string;
    originalTokens: number;
    compressedTokens: number;
    compressionRatio: number;
    semanticScore: number;
    documentType: string;
    language: string;
    originalCost: number;
    compressedCost: number;
    costSavings: number;
    latency: number;
    removedSections: string[];
    modifiedSections: Array<{ original: string; modified: string }>;
    quality: {
      accuracyTarget: number;
      requestedLevel: string;
      actualLevel: string;
      adaptiveFallback: boolean;
      metTarget: boolean;
    };
    pipeline?: {
      totalTimeMs: number;
      agentsExecuted: number;
      agentResults: Array<{ agent: string; status: string; timeMs: number }>;
      validation?: unknown;
    };
  };
}> {
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

  const analytics = workflowResult.analytics!;
  const requestedLevel = input.compressionLevel;
  const actualLevel = workflowResult.compressionLevel;
  const adaptiveFallback = requestedLevel !== actualLevel;

  const compression = await prisma.compression.create({
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
      compressionLevel: workflowResult.compressionLevel as any,
      requestedLevel: requestedLevel as any,
      llmProvider: input.llmProvider as any,
      documentType: (input.documentType || workflowResult.documentType) as any,
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

  await prisma.compressionMetric.create({
    data: {
      id: uuid(),
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

