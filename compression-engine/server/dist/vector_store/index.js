"use strict";
/**
 * Vector Store
 *
 * In-memory vector store for sentence embeddings.
 * Used by the Semantic Similarity Agent for fast nearest-neighbor search.
 * Can be replaced with Pinecone/Weaviate/ChromaDB in production.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextVectorizer = exports.VectorStore = void 0;
class VectorStore {
    entries = [];
    add(entry) {
        this.entries.push(entry);
    }
    addBatch(entries) {
        this.entries.push(...entries);
    }
    search(queryVector, topK = 5) {
        const scored = this.entries.map(entry => ({
            ...entry,
            score: this.cosineSimilarity(queryVector, entry.vector),
        }));
        return scored
            .sort((a, b) => b.score - a.score)
            .slice(0, topK);
    }
    clear() {
        this.entries = [];
    }
    size() {
        return this.entries.length;
    }
    cosineSimilarity(a, b) {
        if (a.length !== b.length)
            return 0;
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        for (let i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }
        const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
        return magnitude > 0 ? dotProduct / magnitude : 0;
    }
}
exports.VectorStore = VectorStore;
/**
 * Simple TF-IDF based vectorizer for text.
 * Converts text into a numerical vector for similarity comparison.
 */
class TextVectorizer {
    vocabulary = new Map();
    idf = new Map();
    fit(documents) {
        const df = new Map();
        const vocabSet = new Set();
        for (const doc of documents) {
            const words = this.tokenize(doc);
            const uniqueWords = new Set(words);
            for (const word of uniqueWords) {
                vocabSet.add(word);
                df.set(word, (df.get(word) || 0) + 1);
            }
        }
        // Build vocabulary index
        let idx = 0;
        for (const word of vocabSet) {
            this.vocabulary.set(word, idx++);
        }
        // Calculate IDF
        const numDocs = documents.length;
        for (const [word, count] of df) {
            this.idf.set(word, Math.log(numDocs / count));
        }
    }
    transform(text) {
        const words = this.tokenize(text);
        const vector = new Array(this.vocabulary.size).fill(0);
        // Calculate TF
        const tf = new Map();
        for (const word of words) {
            tf.set(word, (tf.get(word) || 0) + 1);
        }
        // Build TF-IDF vector
        for (const [word, count] of tf) {
            const idx = this.vocabulary.get(word);
            if (idx !== undefined) {
                const termFreq = count / words.length;
                const idfScore = this.idf.get(word) || 0;
                vector[idx] = termFreq * idfScore;
            }
        }
        return vector;
    }
    tokenize(text) {
        return text
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, ' ')
            .split(/\s+/)
            .filter(w => w.length > 2);
    }
}
exports.TextVectorizer = TextVectorizer;
//# sourceMappingURL=index.js.map