/**
 * LLM Provider Routes.
 *
 * GET  /llm/providers   - List all available LLM providers with metadata
 * POST /llm/test        - Test connection to an LLM provider (uses stored key)
 * POST /llm/compress    - Compress a prompt and send it to the target LLM
 * POST /llm/chat        - Direct chat with an LLM provider
 *
 * All key resolution goes through ApiKeyService which decrypts just-in-time
 * and enforces per-user ownership.
 */
export declare const llmRouter: import("express-serve-static-core").Router;
//# sourceMappingURL=llm.routes.d.ts.map