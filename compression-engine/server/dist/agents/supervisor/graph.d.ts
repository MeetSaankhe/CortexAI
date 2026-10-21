/**
 * LangGraph-style Workflow Graph.
 * Manages agent execution order, conditional routing, parallel execution,
 * retry logic, failure recovery, and state management.
 */
import { WorkflowState, AgentNode } from '../types';
export type RouteCondition = (state: WorkflowState) => boolean;
export declare class WorkflowGraph {
    private nodes;
    private edges;
    private entryNode;
    addNode(node: AgentNode, options?: {
        retries?: number;
        parallel?: string[];
    }): this;
    addEdge(from: string, to: string, condition?: RouteCondition): this;
    setEntry(nodeName: string): this;
    private getNextNodes;
    execute(initialState: WorkflowState): Promise<WorkflowState>;
    private executeNodeWithRetry;
    private isNonCritical;
}
//# sourceMappingURL=graph.d.ts.map