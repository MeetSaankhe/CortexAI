import type { CompressionLevel } from '../agents/types';
export declare function compressAndPersist(input: {
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
        modifiedSections: Array<{
            original: string;
            modified: string;
        }>;
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
            agentResults: Array<{
                agent: string;
                status: string;
                timeMs: number;
            }>;
            validation?: unknown;
        };
    };
}>;
//# sourceMappingURL=compression-execution.service.d.ts.map