/**
 * Token Analysis Agent
 *
 * Responsibilities:
 * - Calculate: Characters, Words, Tokens, Estimated API Cost,
 *   Estimated Latency, Context Window Usage
 * - This agent NEVER modifies content. Only analyzes.
 */
import { AgentNode, WorkflowState } from '../types';
export declare class TokenAnalysisNode implements AgentNode {
    name: string;
    shouldExecute(_state: WorkflowState): boolean;
    execute(state: WorkflowState): Promise<WorkflowState>;
    private analyze;
    private estimateTokens;
}
//# sourceMappingURL=token-analysis.node.d.ts.map