export interface TextAnalysis {
    words: number;
    characters: number;
    sentences: number;
    paragraphs: number;
    avgWordsPerSentence: number;
    readabilityScore: number;
    keyPhrases: string[];
    redundancyLevel: number;
}
export declare class TextAnalyzer {
    analyze(text: string): TextAnalysis;
    private calculateReadability;
    private countSyllables;
    private extractKeyPhrases;
    private calculateRedundancy;
    private sentenceSimilarity;
}
//# sourceMappingURL=text.analyzer.d.ts.map