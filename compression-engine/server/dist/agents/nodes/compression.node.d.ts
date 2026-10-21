/**
 * Compression Agent
 *
 * This is the ONLY agent allowed to rewrite content.
 *
 * Responsibilities:
 * - Compress prompt
 * - Reduce redundancy
 * - Rewrite sentences
 * - Maintain semantic meaning
 * - Preserve important information (via preservation rules)
 * - Target: 70% token reduction
 *
 * Uses intelligence gathered from all previous agents to make
 * informed compression decisions. Sentences flagged by the
 * preservation-rules layer are NEVER removed regardless of
 * compression level.
 */
import { AgentNode, WorkflowState } from '../types';
export declare class CompressionNode implements AgentNode {
    name: string;
    shouldExecute(_state: WorkflowState): boolean;
    execute(state: WorkflowState): Promise<WorkflowState>;
    private compress;
    private removeBoilerplate;
    private removeDuplicates;
    private applyTypeSpecificCompression;
    private compressCode;
    private compressLogs;
    private compressJson;
    private truncateJson;
    private compressCsv;
    private compressEmail;
    private compressLegal;
    private compressMarkdown;
    private applySemanticCompression;
    private filterByImportance;
    private optimizeTokens;
}
//# sourceMappingURL=compression.node.d.ts.map