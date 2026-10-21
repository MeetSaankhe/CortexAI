/**
 * LLM Connector Service.
 *
 * Real HTTP integration for OpenAI, Gemini, Claude, Ollama.
 * Others fall back to simulated responses (until keys/SDKs are wired up).
 *
 * Key precedence:
 *   1. User's own API key (from ApiKey table via caller)
 *   2. System-level fallback key from environment
 *   3. Fail with a clear message
 */
export interface LLMProvider {
    id: string;
    name: string;
    model: string;
    models: string[];
    maxTokens: number;
    costPer1kInput: number;
    costPer1kOutput: number;
    estimatedLatencyPerToken: number;
}
export interface LLMRequest {
    prompt: string;
    maxTokens?: number;
    temperature?: number;
    provider: string;
    model?: string;
    apiKey?: string;
}
export interface LLMResponse {
    text: string;
    tokens: number;
    inputTokens: number;
    provider: string;
    model: string;
    latencyMs: number;
    cost: number;
    usedUserKey: boolean;
    simulated: boolean;
}
export declare class LLMConnectorService {
    getProvider(name: string): LLMProvider | null;
    getAllProviders(): LLMProvider[];
    getProviderNames(): string[];
    getModels(providerId: string): string[];
    estimateCost(tokens: number, provider: string, direction?: 'input' | 'output'): number;
    estimateLatency(tokens: number, provider: string): number;
    getContextWindow(provider: string): number;
    private resolveKey;
    send(request: LLMRequest): Promise<LLMResponse>;
    private callOpenAI;
    private callGemini;
    private callClaude;
    private callOllama;
    private simulated;
}
export declare const llmConnector: LLMConnectorService;
//# sourceMappingURL=llm-connector.service.d.ts.map