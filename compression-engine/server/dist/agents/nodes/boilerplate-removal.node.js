"use strict";
/**
 * Boilerplate Removal Agent
 *
 * Responsibilities:
 * - Identify: Greetings, Closings, Repeated headers/footers,
 *   Standard templates
 * - Mark them for removal (does not remove directly)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BoilerplateRemovalNode = void 0;
class BoilerplateRemovalNode {
    name = 'boilerplate_removal';
    greetingPatterns = [
        /^(hi|hello|hey|dear|good\s*(morning|afternoon|evening))\b[^.]*[,.!]?\s*/im,
        /^(hope this (finds you well|helps|email finds you|message finds))[^.]*[.!]?\s*/im,
        /^(i hope you('re| are) (doing|having))[^.]*[.!]?\s*/im,
        /^(thank you for (your|the) (email|message|reply|response))[^.]*[.!]?\s*/im,
    ];
    closingPatterns = [
        /^(best regards?|sincerely|cheers|thanks|thank you|regards|warm regards|kind regards)[,.]?\s*$/im,
        /^(looking forward to|please (let me know|don't hesitate))[^.]*[.!]?\s*$/im,
        /^(feel free to|if you (have|need) any)[^.]*[.!]?\s*$/im,
        /^(have a (great|nice|good|wonderful) (day|week|weekend))[^.]*[.!]?\s*$/im,
    ];
    headerPatterns = [
        /^[-=]{3,}\s*$/m,
        /^(disclaimer|confidentiality notice|legal notice):?\s*/im,
        /^this (email|message) (is|was) (intended|sent) (for|to)/im,
    ];
    templatePatterns = [
        /^(please find (attached|below|enclosed))[^.]*[.!]?\s*/im,
        /^(as (per|discussed|mentioned|agreed) (in|during|earlier))[^.]*[.!]?\s*/im,
        /^(further to (our|my|your) (earlier|previous|last))[^.]*[.!]?\s*/im,
        /^(this is (to|a) (confirm|follow[- ]up|remind))[^.]*[.!]?\s*/im,
    ];
    shouldExecute(_state) {
        return true;
    }
    async execute(state) {
        const text = state.processedText;
        const result = this.detectBoilerplate(text);
        return {
            ...state,
            boilerplateResult: result,
        };
    }
    detectBoilerplate(text) {
        const lines = text.split('\n');
        const greetings = [];
        const closings = [];
        const repeatedHeaders = [];
        const repeatedFooters = [];
        const templates = [];
        const removalCandidates = [];
        let charOffset = 0;
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineStart = charOffset;
            const lineEnd = charOffset + line.length;
            // Check greetings (usually first few lines)
            if (i < 5) {
                for (const pattern of this.greetingPatterns) {
                    if (pattern.test(line)) {
                        greetings.push(line.trim());
                        removalCandidates.push({ start: lineStart, end: lineEnd, reason: 'greeting' });
                        break;
                    }
                }
            }
            // Check closings (usually last few lines)
            if (i > lines.length - 10) {
                for (const pattern of this.closingPatterns) {
                    if (pattern.test(line)) {
                        closings.push(line.trim());
                        removalCandidates.push({ start: lineStart, end: lineEnd, reason: 'closing' });
                        break;
                    }
                }
            }
            // Check headers/footers
            for (const pattern of this.headerPatterns) {
                if (pattern.test(line)) {
                    repeatedHeaders.push(line.trim());
                    removalCandidates.push({ start: lineStart, end: lineEnd, reason: 'boilerplate_header' });
                    break;
                }
            }
            // Check templates
            for (const pattern of this.templatePatterns) {
                if (pattern.test(line)) {
                    templates.push(line.trim());
                    removalCandidates.push({ start: lineStart, end: lineEnd, reason: 'template_phrase' });
                    break;
                }
            }
            charOffset += line.length + 1; // +1 for newline
        }
        // Detect email signatures
        const signatureStart = this.detectSignature(text);
        if (signatureStart >= 0) {
            repeatedFooters.push('[email signature]');
            removalCandidates.push({
                start: signatureStart,
                end: text.length,
                reason: 'email_signature',
            });
        }
        return { greetings, closings, repeatedHeaders, repeatedFooters, templates, removalCandidates };
    }
    detectSignature(text) {
        // Common signature delimiters
        const sigPatterns = [
            /\n--\s*\n/,
            /\n_{3,}\n/,
            /\nSent from my/,
            /\nGet Outlook for/,
        ];
        for (const pattern of sigPatterns) {
            const match = text.match(pattern);
            if (match && match.index !== undefined) {
                // Only count as signature if it's in the last 30% of the text
                if (match.index > text.length * 0.7) {
                    return match.index;
                }
            }
        }
        return -1;
    }
}
exports.BoilerplateRemovalNode = BoilerplateRemovalNode;
//# sourceMappingURL=boilerplate-removal.node.js.map