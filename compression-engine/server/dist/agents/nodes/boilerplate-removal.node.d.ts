/**
 * Boilerplate Removal Agent
 *
 * Responsibilities:
 * - Identify: Greetings, Closings, Repeated headers/footers,
 *   Standard templates
 * - Mark them for removal (does not remove directly)
 */
import { AgentNode, WorkflowState } from '../types';
export declare class BoilerplateRemovalNode implements AgentNode {
    name: string;
    private greetingPatterns;
    private closingPatterns;
    private headerPatterns;
    private templatePatterns;
    shouldExecute(_state: WorkflowState): boolean;
    execute(state: WorkflowState): Promise<WorkflowState>;
    private detectBoilerplate;
    private detectSignature;
}
//# sourceMappingURL=boilerplate-removal.node.d.ts.map