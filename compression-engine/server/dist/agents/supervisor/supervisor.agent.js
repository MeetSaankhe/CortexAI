"use strict";
/**
 * Supervisor Agent - The Brain of the System.
 *
 * Responsibilities:
 * - Receive request
 * - Determine file type
 * - Determine workflow
 * - Choose compression strategy
 * - Invoke required agents
 * - Collect outputs
 * - Generate final workflow state
 *
 * The Supervisor NEVER performs compression directly.
 * It only orchestrates the multi-agent pipeline.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupervisorAgent = void 0;
const uuid_1 = require("uuid");
const graph_1 = require("./graph");
/** Ordered from most to least aggressive — used for adaptive fallback */
const LEVEL_LADDER = ['extreme', 'high', 'medium', 'low'];
const input_processing_node_1 = require("../nodes/input-processing.node");
const document_classification_node_1 = require("../nodes/document-classification.node");
const language_detection_node_1 = require("../nodes/language-detection.node");
const token_analysis_node_1 = require("../nodes/token-analysis.node");
const semantic_similarity_node_1 = require("../nodes/semantic-similarity.node");
const duplicate_detection_node_1 = require("../nodes/duplicate-detection.node");
const boilerplate_removal_node_1 = require("../nodes/boilerplate-removal.node");
const code_analysis_node_1 = require("../nodes/code-analysis.node");
const log_analysis_node_1 = require("../nodes/log-analysis.node");
const importance_scoring_node_1 = require("../nodes/importance-scoring.node");
const compression_node_1 = require("../nodes/compression.node");
const validation_node_1 = require("../nodes/validation.node");
const dashboard_node_1 = require("../nodes/dashboard.node");
const logger_1 = require("../../utils/logger");
class SupervisorAgent {
    graph;
    constructor() {
        this.graph = this.buildGraph();
    }
    buildGraph() {
        const graph = new graph_1.WorkflowGraph();
        // Register all agent nodes
        graph
            .addNode(new input_processing_node_1.InputProcessingNode(), { retries: 2 })
            .addNode(new document_classification_node_1.DocumentClassificationNode())
            .addNode(new language_detection_node_1.LanguageDetectionNode())
            .addNode(new token_analysis_node_1.TokenAnalysisNode())
            .addNode(new semantic_similarity_node_1.SemanticSimilarityNode(), { retries: 1 })
            .addNode(new duplicate_detection_node_1.DuplicateDetectionNode())
            .addNode(new boilerplate_removal_node_1.BoilerplateRemovalNode())
            .addNode(new code_analysis_node_1.CodeAnalysisNode())
            .addNode(new log_analysis_node_1.LogAnalysisNode())
            .addNode(new importance_scoring_node_1.ImportanceScoringNode())
            .addNode(new compression_node_1.CompressionNode(), { retries: 2 })
            .addNode(new validation_node_1.ValidationNode(), { retries: 2 })
            .addNode(new dashboard_node_1.DashboardNode());
        // Define execution flow
        graph.setEntry('input_processing');
        // Sequential core pipeline
        graph.addEdge('input_processing', 'document_classification');
        graph.addEdge('document_classification', 'language_detection');
        graph.addEdge('language_detection', 'token_analysis');
        graph.addEdge('token_analysis', 'semantic_similarity');
        graph.addEdge('semantic_similarity', 'duplicate_detection');
        graph.addEdge('duplicate_detection', 'boilerplate_removal');
        // Conditional routing based on document type
        graph.addEdge('boilerplate_removal', 'code_analysis', (state) => ['code'].includes(state.documentType));
        graph.addEdge('boilerplate_removal', 'log_analysis', (state) => state.documentType === 'logs');
        graph.addEdge('boilerplate_removal', 'importance_scoring', (state) => !['code', 'logs'].includes(state.documentType));
        // Converge back to importance scoring
        graph.addEdge('code_analysis', 'importance_scoring');
        graph.addEdge('log_analysis', 'importance_scoring');
        // Final compression and validation
        graph.addEdge('importance_scoring', 'compression');
        graph.addEdge('compression', 'validation');
        graph.addEdge('validation', 'dashboard');
        return graph;
    }
    async orchestrate(input) {
        const target = input.accuracyTarget ?? 0.95;
        logger_1.logger.info(`[Supervisor] Starting orchestration user=${input.userId} target=${target}`);
        // Build the fallback ladder starting from the requested level, then
        // progressively lighter levels. This guarantees the highest-compression
        // result that still meets the accuracy target.
        const requestedIdx = LEVEL_LADDER.indexOf(input.compressionLevel);
        const startIdx = requestedIdx >= 0 ? requestedIdx : 1; // default to 'high'
        const attempts = LEVEL_LADDER.slice(startIdx);
        let lastState = null;
        let bestState = null;
        for (let i = 0; i < attempts.length; i++) {
            const level = attempts[i];
            const state = this.buildInitialState(input, level);
            const result = await this.graph.execute(state);
            lastState = result;
            const accuracy = result.analytics?.semanticScore ?? 0;
            logger_1.logger.info(`[Supervisor] Attempt ${i + 1}/${attempts.length} @ ${level}: accuracy=${(accuracy * 100).toFixed(1)}%, ` +
                `ratio=${((result.analytics?.compressionRatio ?? 0) * 100).toFixed(1)}%`);
            // Track the highest-compression result that meets the target
            if (accuracy >= target && !bestState) {
                bestState = result;
                break; // early exit: found a result that satisfies the requirement
            }
            // Track the best available even if none meets target
            if (!bestState || accuracy > (bestState.analytics?.semanticScore ?? 0)) {
                bestState = result;
            }
        }
        const finalState = bestState || lastState;
        const finalAccuracy = finalState.analytics?.semanticScore ?? 0;
        const finalLevel = finalState.compressionLevel;
        if (finalLevel !== input.compressionLevel) {
            logger_1.logger.info(`[Supervisor] Adaptive fallback: requested "${input.compressionLevel}" ` +
                `→ used "${finalLevel}" to meet ${(target * 100).toFixed(0)}% accuracy target ` +
                `(final: ${(finalAccuracy * 100).toFixed(1)}%)`);
        }
        logger_1.logger.info(`[Supervisor] Complete. Status: ${finalState.status}, ` +
            `Agents executed: ${finalState.agentResults.length}, ` +
            `Total time: ${finalState.totalExecutionTimeMs}ms`);
        return finalState;
    }
    buildInitialState(input, level) {
        return {
            id: (0, uuid_1.v4)(),
            userId: input.userId,
            originalText: input.text,
            filename: input.filename,
            compressionLevel: level,
            llmProvider: input.llmProvider,
            processedText: '',
            documentType: 'text',
            detectedLanguage: 'english',
            tokenAnalysis: null,
            similarityResult: null,
            duplicateResult: null,
            boilerplateResult: null,
            codeAnalysisResult: null,
            logAnalysisResult: null,
            importanceScores: [],
            compressedText: '',
            validation: null,
            analytics: null,
            agentResults: [],
            currentAgent: 'supervisor',
            startTime: Date.now(),
            endTime: null,
            totalExecutionTimeMs: 0,
            status: 'running',
            error: null,
        };
    }
}
exports.SupervisorAgent = SupervisorAgent;
//# sourceMappingURL=supervisor.agent.js.map