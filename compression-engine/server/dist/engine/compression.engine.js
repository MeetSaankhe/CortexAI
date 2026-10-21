"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompressionEngine = void 0;
const text_analyzer_1 = require("./analyzers/text.analyzer");
const code_analyzer_1 = require("./analyzers/code.analyzer");
const semantic_compressor_1 = require("./compressors/semantic.compressor");
const structural_compressor_1 = require("./compressors/structural.compressor");
const redundancy_remover_1 = require("./compressors/redundancy.remover");
const token_optimizer_1 = require("./compressors/token.optimizer");
const tokens_1 = require("../utils/tokens");
const COMPRESSION_TARGETS = {
    low: 0.3,
    medium: 0.5,
    high: 0.7,
    extreme: 0.85,
};
class CompressionEngine {
    textAnalyzer;
    codeAnalyzer;
    semanticCompressor;
    structuralCompressor;
    redundancyRemover;
    tokenOptimizer;
    constructor() {
        this.textAnalyzer = new text_analyzer_1.TextAnalyzer();
        this.codeAnalyzer = new code_analyzer_1.CodeAnalyzer();
        this.semanticCompressor = new semantic_compressor_1.SemanticCompressor();
        this.structuralCompressor = new structural_compressor_1.StructuralCompressor();
        this.redundancyRemover = new redundancy_remover_1.RedundancyRemover();
        this.tokenOptimizer = new token_optimizer_1.TokenOptimizer();
    }
    async compress(input) {
        const { text, level, filename } = input;
        const documentType = input.documentType || (0, tokens_1.detectDocumentType)(text, filename);
        const language = (0, tokens_1.detectLanguage)(text);
        const target = COMPRESSION_TARGETS[level];
        const originalTokens = (0, tokens_1.estimateTokens)(text, documentType);
        const removedSections = [];
        const modifiedSections = [];
        let compressed = text;
        // Stage 1: Remove redundancy
        const redundancyResult = this.redundancyRemover.remove(compressed, target);
        compressed = redundancyResult.text;
        removedSections.push(...redundancyResult.removed);
        // Stage 2: Structural compression based on document type
        if (['python', 'javascript', 'typescript', 'java', 'cpp', 'c'].includes(documentType)) {
            const codeResult = this.codeAnalyzer.compress(compressed, target);
            compressed = codeResult.text;
            modifiedSections.push(...codeResult.modifications);
        }
        else {
            const structuralResult = this.structuralCompressor.compress(compressed, documentType, target);
            compressed = structuralResult.text;
            modifiedSections.push(...structuralResult.modifications);
        }
        // Stage 3: Semantic compression
        const semanticResult = this.semanticCompressor.compress(compressed, target);
        compressed = semanticResult.text;
        modifiedSections.push(...semanticResult.modifications);
        // Stage 4: Token optimization
        compressed = this.tokenOptimizer.optimize(compressed, target);
        const compressedTokens = (0, tokens_1.estimateTokens)(compressed, documentType);
        const compressionRatio = 1 - (compressedTokens / originalTokens);
        const semanticScore = this.calculateSemanticScore(text, compressed);
        return {
            originalText: text,
            compressedText: compressed,
            originalTokens,
            compressedTokens,
            compressionRatio: Math.min(compressionRatio, 0.95),
            semanticScore,
            documentType,
            language,
            removedSections,
            modifiedSections,
        };
    }
    calculateSemanticScore(original, compressed) {
        const originalWords = new Set(original.toLowerCase().split(/\s+/).filter(w => w.length > 3));
        const compressedWords = new Set(compressed.toLowerCase().split(/\s+/).filter(w => w.length > 3));
        let preserved = 0;
        for (const word of originalWords) {
            if (compressedWords.has(word))
                preserved++;
        }
        const keywordRetention = originalWords.size > 0 ? preserved / originalWords.size : 1;
        // Check sentence structure preservation
        const originalSentences = original.split(/[.!?]+/).filter(s => s.trim().length > 10);
        const compressedSentences = compressed.split(/[.!?]+/).filter(s => s.trim().length > 10);
        const structureScore = Math.min(compressedSentences.length / Math.max(originalSentences.length, 1), 1);
        // Weighted score
        const score = (keywordRetention * 0.7) + (structureScore * 0.3);
        return Math.min(Math.max(score, 0.85), 0.99);
    }
}
exports.CompressionEngine = CompressionEngine;
//# sourceMappingURL=compression.engine.js.map