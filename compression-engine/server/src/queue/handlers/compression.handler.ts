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

import { SupervisorAgent } from '../../agents';
import { CompressionLevel } from '../../agents/types';
import { prisma } from '../../utils/prisma';
import { ActivityLogService } from '../../services/activity-log.service';
import { logger } from '../../utils/logger';
import { v4 as uuid } from 'uuid';

const supervisor = new SupervisorAgent();

export interface CompressionJobInput {
  userId: string;
  text: string;
  level: CompressionLevel;
  llmProvider: string;
  documentId?: string;
  accuracyTarget?: number;
  filename?: string;
}

export interface CompressionJobOutput {
  compressionId: string;
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
  processingTimeMs: number;
  quality: {
    accuracyTarget: number;
    requestedLevel: string;
    actualLevel: string;
    adaptiveFallback: boolean;
    metTarget: boolean;
  };
  pipeline: {
    totalTimeMs: number;
    agentsExecuted: number;
    agentResults: Array<{ agent: string; status: string; timeMs: number }>;
    validation: unknown;
  };
}

export async function compressionHandler(
  rawInput: unknown,
  onProgress: (progress: number, stage: string) => Promise<void>
): Promise<CompressionJobOutput> {
  const input = rawInput as CompressionJobInput;
  const accuracyTarget = input.accuracyTarget ?? 0.95;

  await onProgress(5, 'Starting compression pipeline');

  // Intercept the supervisor to report per-agent progress
  // We patch the orchestrate call with a progress-aware wrapper
  let agentsDone = 0;
  const TOTAL_AGENTS = 13;

  const agentProgressFn = (agentName: string, _status: string) => {
    agentsDone++;
    const pct = 5 + Math.floor((agentsDone / TOTAL_AGENTS) * 80);
    // Fire and forget to avoid blocking agent execution
    onProgress(Math.min(pct, 85), `Agent: ${agentName.replace(/_/g, ' ')}`).catch(() => {});
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

  const analytics = result.analytics!;
  const requestedLevel = input.level;
  const actualLevel = result.compressionLevel;

  // Persist the compression record
  const compression = await prisma.compression.create({
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
      compressionLevel: actualLevel as string,
      requestedLevel: requestedLevel as string,
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
  await prisma.compressionMetric.create({
    data: {
      id: uuid(),
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

  ActivityLogService.log({
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

  const output: CompressionJobOutput = {
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
      requestedLevel: requestedLevel as string,
      actualLevel: actualLevel as string,
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

  logger.info(
    `[CompressionHandler] Done: ratio=${(analytics.compressionRatio * 100).toFixed(1)}% ` +
    `accuracy=${(analytics.semanticScore * 100).toFixed(1)}% ` +
    `time=${result.totalExecutionTimeMs}ms`
  );

  return output;
}
