export interface CodeCompression {
    text: string;
    modifications: Array<{
        original: string;
        modified: string;
    }>;
}
export declare class CodeAnalyzer {
    compress(code: string, target: number): CodeCompression;
    private removeComments;
    private reduceWhitespace;
    private compressVerbosePatterns;
    private removeDocstrings;
    private abbreviateNames;
}
//# sourceMappingURL=code.analyzer.d.ts.map