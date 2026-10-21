"use strict";
/**
 * Semantic Similarity Agent
 *
 * Responsibilities:
 * - Convert every sentence into embeddings (TF-IDF based)
 * - Compare sentence similarity
 * - Generate similarity matrix
 * - Find redundant meaning
 * - NEVER deletes anything. Only reports similarity.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SemanticSimilarityNode = void 0;
class SemanticSimilarityNode {
    name = 'semantic_similarity';
    shouldExecute(state) {
        // Only run if text has enough sentences to compare
        const sentences = state.processedText.split(/[.!?\n]+/).filter(s => s.trim().length > 15);
        return sentences.length >= 3;
    }
    async execute(state) {
        const text = state.processedText;
        const sentences = this.extractSentences(text);
        const result = this.computeSimilarity(sentences);
        return {
            ...state,
            similarityResult: result,
        };
    }
    extractSentences(text) {
        return text
            .split(/[.!?\n]+/)
            .map(s => s.trim())
            .filter(s => s.length > 15);
    }
    computeSimilarity(sentences) {
        // Build TF-IDF vectors for each sentence
        const tfidfVectors = this.buildTfidfVectors(sentences);
        const sentencePairs = [];
        const redundantIndices = new Set();
        // Compare all sentence pairs
        for (let i = 0; i < sentences.length; i++) {
            for (let j = i + 1; j < sentences.length; j++) {
                const similarity = this.cosineSimilarity(tfidfVectors[i], tfidfVectors[j]);
                if (similarity > 0.5) {
                    sentencePairs.push({ indexA: i, indexB: j, similarity });
                }
                if (similarity > 0.7) {
                    // The later sentence is considered redundant
                    redundantIndices.add(j);
                }
            }
        }
        const overallRedundancy = sentences.length > 0
            ? redundantIndices.size / sentences.length
            : 0;
        return {
            sentencePairs: sentencePairs.sort((a, b) => b.similarity - a.similarity).slice(0, 50),
            redundantSentenceIndices: Array.from(redundantIndices).sort((a, b) => a - b),
            overallRedundancy,
        };
    }
    buildTfidfVectors(sentences) {
        const stopWords = new Set([
            'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
            'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
            'should', 'may', 'might', 'can', 'to', 'of', 'in', 'for', 'on', 'with',
            'at', 'by', 'from', 'as', 'into', 'through', 'during', 'before', 'after',
            'and', 'or', 'but', 'if', 'not', 'no', 'so', 'than', 'too', 'very',
            'just', 'this', 'that', 'these', 'those', 'it', 'its', 'i', 'we', 'you',
            'he', 'she', 'they', 'what', 'which', 'who', 'whom',
        ]);
        // Tokenize all sentences
        const tokenizedSentences = sentences.map(s => s.toLowerCase()
            .replace(/[^a-z0-9\s]/g, ' ')
            .split(/\s+/)
            .filter(w => w.length > 2 && !stopWords.has(w)));
        // Calculate document frequency
        const df = new Map();
        for (const tokens of tokenizedSentences) {
            const unique = new Set(tokens);
            for (const token of unique) {
                df.set(token, (df.get(token) || 0) + 1);
            }
        }
        // Build TF-IDF vectors
        const numDocs = sentences.length;
        return tokenizedSentences.map(tokens => {
            const vector = new Map();
            const tf = new Map();
            for (const token of tokens) {
                tf.set(token, (tf.get(token) || 0) + 1);
            }
            for (const [token, count] of tf) {
                const termFreq = count / tokens.length;
                const idf = Math.log(numDocs / (df.get(token) || 1));
                vector.set(token, termFreq * idf);
            }
            return vector;
        });
    }
    cosineSimilarity(vecA, vecB) {
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        for (const [key, valA] of vecA) {
            const valB = vecB.get(key) || 0;
            dotProduct += valA * valB;
            normA += valA * valA;
        }
        for (const [, valB] of vecB) {
            normB += valB * valB;
        }
        const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
        return magnitude > 0 ? dotProduct / magnitude : 0;
    }
}
exports.SemanticSimilarityNode = SemanticSimilarityNode;
//# sourceMappingURL=semantic-similarity.node.js.map