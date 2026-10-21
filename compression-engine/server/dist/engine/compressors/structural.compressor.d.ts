export interface StructuralResult {
    text: string;
    modifications: Array<{
        original: string;
        modified: string;
    }>;
}
export declare class StructuralCompressor {
    compress(text: string, documentType: string, target: number): StructuralResult;
    private compressJson;
    private deepTruncateJson;
    private compressMarkdown;
    private compressLogs;
    private compressEmail;
    private compressLegal;
    private compressCsv;
    private compressGenericText;
}
//# sourceMappingURL=structural.compressor.d.ts.map