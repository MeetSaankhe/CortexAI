/**
 * Document Classification Agent
 *
 * Purpose: Determine document type.
 * The next workflow depends on this result.
 *
 * Possible outputs:
 * - code, logs, research_paper, email, technical_documentation
 * - chat_history, legal_document, json, markdown, csv, text
 */
import { AgentNode, WorkflowState } from '../types';
export declare class DocumentClassificationNode implements AgentNode {
    name: string;
    shouldExecute(_state: WorkflowState): boolean;
    execute(state: WorkflowState): Promise<WorkflowState>;
    private classify;
    private classifyByExtension;
    private checkCode;
    private checkLogs;
    private checkJson;
    private checkMarkdown;
    private checkCsv;
    private checkEmail;
    private checkLegal;
    private checkResearchPaper;
    private checkTechnicalDocs;
    private checkChatHistory;
}
//# sourceMappingURL=document-classification.node.d.ts.map