/**
 * Dashboard Agent
 *
 * Responsibilities:
 * - Generate analytics from compression results
 * - Compression Ratio, Cost Saved, Latency Saved,
 *   Accuracy, Document Type, History, Trend Graphs
 */
import { AgentNode, WorkflowState } from '../types';
export declare class DashboardNode implements AgentNode {
    name: string;
    shouldExecute(_state: WorkflowState): boolean;
    execute(state: WorkflowState): Promise<WorkflowState>;
    private estimateTokens;
}
//# sourceMappingURL=dashboard.node.d.ts.map