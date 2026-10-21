/**
 * Log Analysis Agent
 *
 * Responsibilities:
 * - Identify log levels: INFO, WARNING, ERROR, TRACE
 * - Detect repeated messages
 * - Summarize repetitive logs
 * - NEVER remove unique errors
 */
import { AgentNode, WorkflowState } from '../types';
export declare class LogAnalysisNode implements AgentNode {
    name: string;
    shouldExecute(state: WorkflowState): boolean;
    execute(state: WorkflowState): Promise<WorkflowState>;
    private analyzeLogs;
    private countLogLevels;
    private findRepeatedMessages;
    private extractUniqueErrors;
    private generateSummary;
}
//# sourceMappingURL=log-analysis.node.d.ts.map