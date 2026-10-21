/**
 * Vector Store
 *
 * In-memory vector store for sentence embeddings.
 * Used by the Semantic Similarity Agent for fast nearest-neighbor search.
 * Can be replaced with Pinecone/Weaviate/ChromaDB in production.
 */
export interface VectorEntry {
    id: string;
    vector: number[];
    metadata: Record<string, unknown>;
}
export declare class VectorStore {
    private entries;
    add(entry: VectorEntry): void;
    addBatch(entries: VectorEntry[]): void;
    search(queryVector: number[], topK?: number): Array<VectorEntry & {
        score: number;
    }>;
    clear(): void;
    size(): number;
    private cosineSimilarity;
}
/**
 * Simple TF-IDF based vectorizer for text.
 * Converts text into a numerical vector for similarity comparison.
 */
export declare class TextVectorizer {
    private vocabulary;
    private idf;
    fit(documents: string[]): void;
    transform(text: string): number[];
    private tokenize;
}
//# sourceMappingURL=index.d.ts.map