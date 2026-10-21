/**
 * Validation Agent
 *
 * Responsibilities:
 * - Compare: Original Prompt ↔ Compressed Prompt
 * - Measure: Semantic Similarity, Compression %, Estimated Accuracy, Reasoning Retention
 * - Only approve if quality threshold is met
 */
import { AgentNode, WorkflowState } from '../types';
export declare class ValidationNode implements AgentNode {
    name: string;
    shouldExecute(_state: WorkflowState): boolean;
    execute(state: WorkflowState): Promise<WorkflowState>;
    private validate;
    private computeSemanticSimilarity;
    private keyTermPreservation;
    private namedEntityPreservation;
    private structuralPreservation;
    private semanticDensity;
    private assessReasoningRetention;
}
//# sourceMappingURL=validation.node.d.ts.map