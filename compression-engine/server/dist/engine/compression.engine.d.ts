export type CompressionLevel = 'low' | 'medium' | 'high' | 'extreme';
export interface CompressionInput {
    text: string;
    level: CompressionLevel;
    documentType?: string;
    filename?: string;
}
export interface CompressionResult {
    originalText: string;
    compressedText: string;
    originalTokens: number;
    compressedTokens: number;
    compressionRatio: number;
    semanticScore: number;
    documentType: string;
    language: string;
    removedSections: string[];
    modifiedSections: Array<{
        original: string;
        modified: string;
    }>;
}
export declare class CompressionEngine {
    private textAnalyzer;
    private codeAnalyzer;
    private semanticCompressor;
    private structuralCompressor;
    private redundancyRemover;
    private tokenOptimizer;
    constructor();
    compress(input: CompressionInput): Promise<CompressionResult>;
    private calculateSemanticScore;
}
//# sourceMappingURL=compression.engine.d.ts.map