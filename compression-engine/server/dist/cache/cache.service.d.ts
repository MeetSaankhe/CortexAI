/**
 * Cache Service
 *
 * In-memory LRU cache for compression results.
 * Avoids reprocessing identical inputs.
 * Can be replaced with Redis in production.
 */
export declare class CacheService<T = unknown> {
    private cache;
    private maxSize;
    private ttlMs;
    constructor(maxSize?: number, ttlMs?: number);
    get(key: string): T | null;
    set(key: string, value: T): void;
    has(key: string): boolean;
    delete(key: string): boolean;
    clear(): void;
    getStats(): {
        size: number;
        maxSize: number;
        hitRate: number;
    };
    private evict;
    /**
     * Generate a cache key from compression parameters.
     * Uses a hash of the input text + compression level.
     */
    static generateKey(text: string, level: string): string;
}
export declare const compressionCache: CacheService<{
    compressedText: string;
    compressionRatio: number;
    semanticScore: number;
}>;
//# sourceMappingURL=cache.service.d.ts.map