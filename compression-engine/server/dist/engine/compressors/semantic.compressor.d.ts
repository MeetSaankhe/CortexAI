export interface SemanticResult {
    text: string;
    modifications: Array<{
        original: string;
        modified: string;
    }>;
}
export declare class SemanticCompressor {
    private fillerPhrases;
    private replacements;
    compress(text: string, target: number): SemanticResult;
    private removeFillerPhrases;
    private deduplicateSentences;
    private simplifySentences;
    private similarity;
}
//# sourceMappingURL=semantic.compressor.d.ts.map