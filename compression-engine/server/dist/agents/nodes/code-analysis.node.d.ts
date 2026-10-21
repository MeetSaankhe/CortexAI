/**
 * Code Analysis Agent
 *
 * Responsibilities:
 * - Parse source code
 * - Identify: Functions, Classes, Variables, Methods, Imports, Dependencies
 * - NEVER remove executable logic
 * - Only remove: Comments, Unused blank lines, Repeated imports, Duplicate comments
 */
import { AgentNode, WorkflowState } from '../types';
export declare class CodeAnalysisNode implements AgentNode {
    name: string;
    shouldExecute(state: WorkflowState): boolean;
    execute(state: WorkflowState): Promise<WorkflowState>;
    private analyzeCode;
    private detectCodeLanguage;
    private extractFunctions;
    private extractClasses;
    private extractImports;
    private analyzeComments;
    private findUnusedBlankLines;
    private findDuplicateImports;
}
//# sourceMappingURL=code-analysis.node.d.ts.map