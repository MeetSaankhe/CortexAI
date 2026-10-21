/**
 * Supervisor Agent - The Brain of the System.
 *
 * Responsibilities:
 * - Receive request
 * - Determine file type
 * - Determine workflow
 * - Choose compression strategy
 * - Invoke required agents
 * - Collect outputs
 * - Generate final workflow state
 *
 * The Supervisor NEVER performs compression directly.
 * It only orchestrates the multi-agent pipeline.
 */
import { WorkflowState, CompressionLevel } from '../types';
export declare class SupervisorAgent {
    private graph;
    constructor();
    private buildGraph;
    orchestrate(input: {
        text: string;
        userId: string;
        compressionLevel: CompressionLevel;
        llmProvider: string;
        filename?: string;
        /** Minimum estimated accuracy required (0-1). If a run falls below this,
         *  the supervisor automatically retries with a lighter compression level.
         *  Default 0.95 to satisfy the >95% accuracy requirement. */
        accuracyTarget?: number;
    }): Promise<WorkflowState>;
    private buildInitialState;
}
//# sourceMappingURL=supervisor.agent.d.ts.map