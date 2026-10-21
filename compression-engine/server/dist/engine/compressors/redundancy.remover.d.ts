export interface RedundancyResult {
    text: string;
    removed: string[];
}
export declare class RedundancyRemover {
    remove(text: string, target: number): RedundancyResult;
    private removeRepeatedPhrases;
    private removeFillerWords;
    private removeRedundantModifiers;
    private removeRepeatedInformation;
}
//# sourceMappingURL=redundancy.remover.d.ts.map