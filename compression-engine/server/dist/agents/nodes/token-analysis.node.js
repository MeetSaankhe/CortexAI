"use strict";
/**
 * Token Analysis Agent
 *
 * Responsibilities:
 * - Calculate: Characters, Words, Tokens, Estimated API Cost,
 *   Estimated Latency, Context Window Usage
 * - This agent NEVER modifies content. Only analyzes.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenAnalysisNode = void 0;
const COST_PER_1K_TOKENS = {
    openai: 0.03,
    gemini: 0.0025,
    claude: 0.025,
    llama: 0.001,
    deepseek: 0.002,
    mistral: 0.008,
    ollama: 0.0,
};
const CONTEXT_WINDOWS = {
    openai: 128000,
    gemini: 1000000,
    claude: 200000,
    llama: 128000,
    deepseek: 128000,
    mistral: 32000,
    ollama: 8192,
};
const LATENCY_PER_TOKEN_MS = {
    openai: 0.05,
    gemini: 0.04,
    claude: 0.06,
    llama: 0.08,
    deepseek: 0.07,
    mistral: 0.05,
    ollama: 0.1,
};
class TokenAnalysisNode {
    name = 'token_analysis';
    shouldExecute(_state) {
        return true;
    }
    async execute(state) {
        const text = state.processedText;
        const analysis = this.analyze(text);
        return {
            ...state,
            tokenAnalysis: analysis,
        };
    }
    analyze(text) {
        const characters = text.length;
        const words = text.split(/\s+/).filter(w => w.length > 0).length;
        const tokens = this.estimateTokens(text);
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
        const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length;
        const estimatedCost = {};
        const contextWindowUsage = {};
        for (const [provider, cost] of Object.entries(COST_PER_1K_TOKENS)) {
            estimatedCost[provider] = (tokens / 1000) * cost;
        }
        for (const [provider, window] of Object.entries(CONTEXT_WINDOWS)) {
            contextWindowUsage[provider] = Math.min((tokens / window) * 100, 100);
        }
        const avgLatency = Object.values(LATENCY_PER_TOKEN_MS)
            .reduce((sum, l) => sum + l, 0) / Object.keys(LATENCY_PER_TOKEN_MS).length;
        return {
            characters,
            words,
            tokens,
            sentences,
            paragraphs,
            estimatedCost,
            estimatedLatencyMs: Math.round(tokens * avgLatency),
            contextWindowUsage,
        };
    }
    estimateTokens(text) {
        // GPT-style tokenization approximation
        // English text: ~4 chars per token
        // Code: ~3.5 chars per token
        // CJK: ~1.5 chars per token
        const cjkChars = (text.match(/[\u3040-\u9FFF\uAC00-\uD7AF]/g) || []).length;
        const nonCjkLength = text.length - cjkChars;
        const cjkTokens = cjkChars / 1.5;
        const textTokens = nonCjkLength / 4;
        return Math.ceil(cjkTokens + textTokens);
    }
}
exports.TokenAnalysisNode = TokenAnalysisNode;
//# sourceMappingURL=token-analysis.node.js.map