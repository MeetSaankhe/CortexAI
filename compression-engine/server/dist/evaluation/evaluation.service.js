"use strict";
/**
 * Evaluation Service
 *
 * Provides batch evaluation capabilities for the compression engine.
 * Measures quality across multiple samples and generates reports.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvaluationService = void 0;
const agents_1 = require("../agents");
const logger_1 = require("../utils/logger");
class EvaluationService {
    supervisor;
    constructor() {
        this.supervisor = new agents_1.SupervisorAgent();
    }
    async evaluate(samples, level = 'medium', provider = 'openai') {
        logger_1.logger.info(`[Evaluation] Starting evaluation of ${samples.length} samples`);
        const results = [];
        for (const sample of samples) {
            try {
                const result = await this.supervisor.orchestrate({
                    text: sample.text,
                    userId: 'evaluation',
                    compressionLevel: level,
                    llmProvider: provider,
                });
                results.push(result);
            }
            catch (error) {
                logger_1.logger.error(`[Evaluation] Sample ${sample.id} failed: ${error.message}`);
            }
        }
        return this.generateReport(results, samples);
    }
    generateReport(results, samples) {
        const successful = results.filter(r => r.status === 'completed' && r.analytics);
        const failed = results.filter(r => r.status === 'failed');
        const avgCompressionRatio = successful.length > 0
            ? successful.reduce((sum, r) => sum + (r.analytics?.compressionRatio || 0), 0) / successful.length
            : 0;
        const avgSemanticScore = successful.length > 0
            ? successful.reduce((sum, r) => sum + (r.analytics?.semanticScore || 0), 0) / successful.length
            : 0;
        const avgProcessingTime = successful.length > 0
            ? successful.reduce((sum, r) => sum + r.totalExecutionTimeMs, 0) / successful.length
            : 0;
        // Group by document type
        const documentTypes = {};
        for (const r of successful) {
            documentTypes[r.documentType] = (documentTypes[r.documentType] || 0) + 1;
        }
        // Compression level stats (all at same level for now)
        const compressionLevels = {
            low: { avgRatio: 0, avgAccuracy: 0, avgTime: 0, samples: 0 },
            medium: { avgRatio: avgCompressionRatio, avgAccuracy: avgSemanticScore, avgTime: avgProcessingTime, samples: successful.length },
            high: { avgRatio: 0, avgAccuracy: 0, avgTime: 0, samples: 0 },
            extreme: { avgRatio: 0, avgAccuracy: 0, avgTime: 0, samples: 0 },
        };
        return {
            totalSamples: samples.length,
            successCount: successful.length,
            failCount: failed.length,
            averageCompressionRatio: avgCompressionRatio,
            averageSemanticScore: avgSemanticScore,
            averageProcessingTime: avgProcessingTime,
            compressionLevels,
            documentTypes,
            results: results.map((r, i) => ({
                id: samples[i]?.id || r.id,
                status: r.status,
                compressionRatio: r.analytics?.compressionRatio || 0,
                semanticScore: r.analytics?.semanticScore || 0,
                processingTime: r.totalExecutionTimeMs,
                documentType: r.documentType,
            })),
        };
    }
}
exports.EvaluationService = EvaluationService;
//# sourceMappingURL=evaluation.service.js.map