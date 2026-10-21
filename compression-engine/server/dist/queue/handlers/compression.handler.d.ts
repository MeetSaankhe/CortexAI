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
import { CompressionLevel } from '../../agents/types';
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
        agentResults: Array<{
            agent: string;
            status: string;
            timeMs: number;
        }>;
        validation: unknown;
    };
}
export declare function compressionHandler(rawInput: unknown, onProgress: (progress: number, stage: string) => Promise<void>): Promise<CompressionJobOutput>;
//# sourceMappingURL=compression.handler.d.ts.map