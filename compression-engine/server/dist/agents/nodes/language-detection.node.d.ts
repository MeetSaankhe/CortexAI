/**
 * Language Detection Agent
 *
 * Responsibilities:
 * - Detect language of the document
 * - Supports: English, Hindi, Marathi, Gujarati, Spanish, French, German, etc.
 * - Route multilingual documents correctly
 */
import { AgentNode, WorkflowState } from '../types';
export declare class LanguageDetectionNode implements AgentNode {
    name: string;
    private profiles;
    shouldExecute(_state: WorkflowState): boolean;
    execute(state: WorkflowState): Promise<WorkflowState>;
    private detect;
    private distinguishDevanagari;
    private isLikelyCode;
}
//# sourceMappingURL=language-detection.node.d.ts.map