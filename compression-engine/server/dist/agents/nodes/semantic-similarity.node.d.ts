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
import { AgentNode, WorkflowState } from '../types';
export declare class SemanticSimilarityNode implements AgentNode {
    name: string;
    shouldExecute(state: WorkflowState): boolean;
    execute(state: WorkflowState): Promise<WorkflowState>;
    private extractSentences;
    private computeSimilarity;
    private buildTfidfVectors;
    private cosineSimilarity;
}
//# sourceMappingURL=semantic-similarity.node.d.ts.map