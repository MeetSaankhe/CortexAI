"use strict";
/**
 * Cache Service
 *
 * In-memory LRU cache for compression results.
 * Avoids reprocessing identical inputs.
 * Can be replaced with Redis in production.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.compressionCache = exports.CacheService = void 0;
const logger_1 = require("../utils/logger");
class CacheService {
    cache = new Map();
    maxSize;
    ttlMs;
    constructor(maxSize = 500, ttlMs = 30 * 60 * 1000) {
        this.maxSize = maxSize;
        this.ttlMs = ttlMs;
    }
    get(key) {
        const entry = this.cache.get(key);
        if (!entry)
            return null;
        // Check TTL
        if (Date.now() - entry.timestamp > this.ttlMs) {
            this.cache.delete(key);
            return null;
        }
        entry.accessCount++;
        return entry.value;
    }
    set(key, value) {
        // Evict if at capacity
        if (this.cache.size >= this.maxSize) {
            this.evict();
        }
        this.cache.set(key, {
            value,
            timestamp: Date.now(),
            accessCount: 1,
        });
    }
    has(key) {
        return this.get(key) !== null;
    }
    delete(key) {
        return this.cache.delete(key);
    }
    clear() {
        this.cache.clear();
        logger_1.logger.info('[Cache] Cache cleared');
    }
    getStats() {
        return {
            size: this.cache.size,
            maxSize: this.maxSize,
            hitRate: 0, // Would need hit/miss counters for real implementation
        };
    }
    evict() {
        // LRU eviction - remove least accessed entry
        let leastKey = null;
        let leastAccess = Infinity;
        for (const [key, entry] of this.cache) {
            if (entry.accessCount < leastAccess) {
                leastAccess = entry.accessCount;
                leastKey = key;
            }
        }
        if (leastKey) {
            this.cache.delete(leastKey);
        }
    }
    /**
     * Generate a cache key from compression parameters.
     * Uses a hash of the input text + compression level.
     */
    static generateKey(text, level) {
        // Simple hash for cache key
        let hash = 0;
        const str = `${text}::${level}`;
        for (let i = 0; i < Math.min(str.length, 500); i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return `comp_${Math.abs(hash).toString(36)}_${text.length}`;
    }
}
exports.CacheService = CacheService;
// Singleton instance for compression results
exports.compressionCache = new CacheService(500, 60 * 60 * 1000); // 1 hour TTL
//# sourceMappingURL=cache.service.js.map