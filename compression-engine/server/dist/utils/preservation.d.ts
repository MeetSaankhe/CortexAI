/**
 * Preservation rules — decides how strongly to protect each sentence
 * from removal during compression.
 *
 * Uses a STRENGTH-based system rather than binary protection so we can still
 * achieve strong compression on rich prompts while never dropping the most
 * critical content:
 *
 *   - STRONG (1.0): question, critical keyword, error content, code block
 *     → Never remove, regardless of compression level.
 *   - MEDIUM (0.6): unique named entity, numeric data, URL/path
 *     → Removed only under aggressive compression.
 *   - WEAK (0.3): reasoning marker alone, code identifier
 *     → Freely compressible if importance is low.
 *   - NONE (0): no protective markers
 *     → Always eligible for removal.
 *
 * This is combined with the importance-scoring layer to decide final filtering.
 */
export type PreservationStrength = 'strong' | 'medium' | 'weak' | 'none';
export interface PreservationVerdict {
    strength: PreservationStrength;
    score: number;
    reasons: string[];
}
/**
 * Analyze a sentence and rank its protection strength.
 * The strongest signal wins; multiple weak signals don't stack up to strong.
 */
export declare function evaluatePreservation(sentence: string): PreservationVerdict;
/**
 * Decide whether a sentence should be preserved at a given compression target.
 * Higher target = more aggressive compression = fewer sentences preserved.
 *
 * Rules:
 *   - Strong → always preserved
 *   - Medium → preserved unless target > 0.75 (aggressive) AND importance is low
 *   - Weak   → preserved only if target < 0.5 AND importance is moderate
 *   - None   → never preserved by this layer (relies on importance alone)
 */
export declare function shouldPreserve(strength: PreservationStrength, target: number, importance?: number): boolean;
//# sourceMappingURL=preservation.d.ts.map