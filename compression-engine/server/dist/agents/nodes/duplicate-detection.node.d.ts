/**
 * Duplicate Detection Agent
 *
 * Responsibilities:
 * - Detect: Duplicate Sentences, Duplicate Paragraphs,
 *   Duplicate Imports, Repeated Documentation, Repeated Functions
 * - Generate removal candidates
 */
import { AgentNode, WorkflowState } from '../types';
export declare class DuplicateDetectionNode implements AgentNode {
    name: string;
    shouldExecute(_state: WorkflowState): boolean;
    execute(state: WorkflowState): Promise<WorkflowState>;
    private detectDuplicates;
    private findDuplicateSentences;
    private findDuplicateParagraphs;
    private findDuplicateImports;
    private findRepeatedFunctions;
    private jaccardSimilarity;
}
//# sourceMappingURL=duplicate-detection.node.d.ts.map