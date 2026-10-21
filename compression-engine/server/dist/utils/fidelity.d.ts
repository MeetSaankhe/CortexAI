/**
 * Reasoning Fidelity Score.
 *
 * Compares two LLM completions and returns a similarity score (0-1) representing
 * how semantically equivalent the two responses are. Used to verify that a
 * compressed prompt still produced substantially the same answer as the original.
 *
 * Uses TF-IDF cosine similarity over key terms, plus entity preservation
 * and structural comparison. No embeddings/external calls — runs locally.
 */
export interface FidelityBreakdown {
    score: number;
    cosineSimilarity: number;
    entityPreservation: number;
    lengthRatio: number;
    verdict: 'excellent' | 'good' | 'fair' | 'poor';
}
/**
 * Compute reasoning fidelity between two LLM outputs.
 * A high score means the compressed prompt produced the same answer.
 */
export declare function computeFidelity(originalOutput: string, compressedOutput: string): FidelityBreakdown;
//# sourceMappingURL=fidelity.d.ts.map