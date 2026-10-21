/**
 * Input Processing Agent
 *
 * Responsibilities:
 * - Read uploaded files
 * - Convert everything into normalized text
 * - Maintain original formatting where needed
 * - Handle: PDF, DOCX, TXT, CSV, Markdown, Logs, Source Code, JSON
 */
import { AgentNode, WorkflowState } from '../types';
export declare class InputProcessingNode implements AgentNode {
    name: string;
    shouldExecute(_state: WorkflowState): boolean;
    execute(state: WorkflowState): Promise<WorkflowState>;
}
//# sourceMappingURL=input-processing.node.d.ts.map