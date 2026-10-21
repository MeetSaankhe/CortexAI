/**
 * Evaluation Service
 *
 * Provides batch evaluation capabilities for the compression engine.
 * Measures quality across multiple samples and generates reports.
 */
import { CompressionLevel } from '../agents/types';
export interface EvaluationSample {
    id: string;
    text: string;
    expectedType?: string;
    expectedLanguage?: string;
}
export interface EvaluationReport {
    totalSamples: number;
    successCount: number;
    failCount: number;
    averageCompressionRatio: number;
    averageSemanticScore: number;
    averageProcessingTime: number;
    compressionLevels: Record<CompressionLevel, {
        avgRatio: number;
        avgAccuracy: number;
        avgTime: number;
        samples: number;
    }>;
    documentTypes: Record<string, number>;
    results: Array<{
        id: string;
        status: string;
        compressionRatio: number;
        semanticScore: number;
        processingTime: number;
        documentType: string;
    }>;
}
export declare class EvaluationService {
    private supervisor;
    constructor();
    evaluate(samples: EvaluationSample[], level?: CompressionLevel, provider?: string): Promise<EvaluationReport>;
    private generateReport;
}
//# sourceMappingURL=evaluation.service.d.ts.map