/**
 * API Key Service.
 *
 * The ONLY place in the codebase that decrypts stored API keys.
 * Every LLM call goes through here so we can:
 *   - Decrypt just-in-time (key never lives in memory longer than needed)
 *   - Record usage (lastUsedAt, usageCount) for auditing
 *   - Enforce that a key belongs to the calling user
 *
 * Never return decrypted keys to route handlers directly — instead expose
 * `useKey(userId, provider, callback)` which passes the plaintext to the
 * callback and clears the reference afterward.
 */
export interface ResolvedApiKey {
    key: string;
    source: 'user' | 'system' | 'none';
}
export declare const ApiKeyService: {
    /**
     * Resolve the best API key for a (userId, provider) pair.
     * Priority: user's own active key → system env fallback → none.
     *
     * The plaintext key is returned only for the duration of the caller's use.
     * It is NEVER logged.
     */
    resolve(userId: string, provider: string): Promise<ResolvedApiKey>;
    /**
     * Convenience: check if a user has ANY active key for a provider,
     * without decrypting it. Useful for UI hints.
     */
    hasActiveKey(userId: string, provider: string): Promise<boolean>;
};
//# sourceMappingURL=api-key.service.d.ts.map