/**
 * Token estimation utilities.
 * Uses approximation: ~4 characters per token for English text.
 * For code, uses ~3.5 characters per token.
 */
export declare function estimateTokens(text: string, type?: string): number;
export declare function estimateCost(tokens: number, provider?: string): number;
export declare function countWords(text: string): number;
export declare function countCharacters(text: string): number;
export declare function detectDocumentType(text: string, filename?: string): string;
export declare function detectLanguage(text: string): string;
//# sourceMappingURL=tokens.d.ts.map