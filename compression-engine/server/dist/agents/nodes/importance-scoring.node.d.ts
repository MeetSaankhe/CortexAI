/**
 * Importance Scoring Agent
 *
 * Responsibilities:
 * - Assign importance score to each sentence
 * - Score using: Semantic similarity, Named entities, Keywords,
 *   User questions, Error messages, Stack traces, Variable names,
 *   File names, API endpoints
 * - High score content → Always preserve
 */
import { AgentNode, WorkflowState } from '../types';
export declare class ImportanceScoringNode implements AgentNode {
    name: string;
    shouldExecute(_state: WorkflowState): boolean;
    execute(state: WorkflowState): Promise<WorkflowState>;
    private splitIntoScorableUnits;
    private scoreAll;
    private hasTechnicalKeywords;
    private isErrorRelated;
    private hasCodeIdentifiers;
    /**
     * Detects sentences that consist mostly of filler wrappers with little
     * actual content. Used to demote low-value sentences during importance
     * scoring so they become candidates for removal.
     */
    private isMostlyFiller;
}
//# sourceMappingURL=importance-scoring.node.d.ts.map