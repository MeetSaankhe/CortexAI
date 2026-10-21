"use strict";
/**
 * Language Detection Agent
 *
 * Responsibilities:
 * - Detect language of the document
 * - Supports: English, Hindi, Marathi, Gujarati, Spanish, French, German, etc.
 * - Route multilingual documents correctly
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LanguageDetectionNode = void 0;
class LanguageDetectionNode {
    name = 'language_detection';
    profiles = [
        {
            language: 'hindi',
            patterns: [/[\u0900-\u097F]/],
            commonWords: ['है', 'का', 'के', 'में', 'को', 'और', 'से', 'पर', 'यह', 'एक'],
        },
        {
            language: 'marathi',
            patterns: [/[\u0900-\u097F]/],
            commonWords: ['आहे', 'हा', 'या', 'ते', 'आणि', 'मध्ये', 'च्या', 'ला', 'केला', 'होता'],
        },
        {
            language: 'gujarati',
            patterns: [/[\u0A80-\u0AFF]/],
            commonWords: ['છે', 'અને', 'માં', 'ના', 'થી', 'પર', 'તે', 'એક', 'હતા', 'કે'],
        },
        {
            language: 'spanish',
            patterns: [/[áéíóúñ¿¡]/i],
            commonWords: ['el', 'la', 'de', 'que', 'en', 'los', 'del', 'las', 'por', 'con'],
        },
        {
            language: 'french',
            patterns: [/[àâçéèêëïîôùûüÿœæ]/i],
            commonWords: ['le', 'la', 'de', 'et', 'les', 'des', 'en', 'un', 'une', 'du'],
        },
        {
            language: 'german',
            patterns: [/[äöüß]/i],
            commonWords: ['der', 'die', 'das', 'und', 'ist', 'ein', 'für', 'mit', 'den', 'auf'],
        },
        {
            language: 'japanese',
            patterns: [/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/],
            commonWords: [],
        },
        {
            language: 'chinese',
            patterns: [/[\u4E00-\u9FFF]/],
            commonWords: [],
        },
        {
            language: 'korean',
            patterns: [/[\uAC00-\uD7AF]/],
            commonWords: [],
        },
        {
            language: 'arabic',
            patterns: [/[\u0600-\u06FF]/],
            commonWords: [],
        },
    ];
    shouldExecute(_state) {
        return true;
    }
    async execute(state) {
        const text = state.processedText;
        const language = this.detect(text);
        return {
            ...state,
            detectedLanguage: language,
        };
    }
    detect(text) {
        // Check for code first - code is language-agnostic
        if (this.isLikelyCode(text)) {
            return 'code';
        }
        // Check script-based languages first (highest confidence)
        for (const profile of this.profiles) {
            for (const pattern of profile.patterns) {
                const matches = text.match(new RegExp(pattern.source, 'g'));
                if (matches && matches.length > text.length * 0.1) {
                    // For Devanagari script, distinguish between Hindi and Marathi
                    if (profile.language === 'hindi' || profile.language === 'marathi') {
                        return this.distinguishDevanagari(text);
                    }
                    return profile.language;
                }
            }
        }
        // Check word-based detection for Latin-script languages
        const words = text.toLowerCase().split(/\s+/);
        for (const profile of this.profiles) {
            if (profile.commonWords.length === 0)
                continue;
            const matchCount = words.filter(w => profile.commonWords.includes(w)).length;
            const ratio = matchCount / words.length;
            if (ratio > 0.08) {
                return profile.language;
            }
        }
        return 'english';
    }
    distinguishDevanagari(text) {
        const marathiIndicators = ['आहे', 'आणि', 'च्या', 'मध्ये', 'केला', 'होता', 'नाही'];
        const hindiIndicators = ['है', 'और', 'का', 'में', 'से', 'नहीं', 'था'];
        const words = text.split(/\s+/);
        let marathiScore = 0;
        let hindiScore = 0;
        for (const word of words) {
            if (marathiIndicators.includes(word))
                marathiScore++;
            if (hindiIndicators.includes(word))
                hindiScore++;
        }
        return marathiScore > hindiScore ? 'marathi' : 'hindi';
    }
    isLikelyCode(text) {
        const codePatterns = [
            /^(import|from|require|using|package)\s/m,
            /[{}\[\]();]\s*$/m,
            /^\s*(def|function|class|interface)\s/m,
        ];
        const matches = codePatterns.filter(p => p.test(text)).length;
        return matches >= 2;
    }
}
exports.LanguageDetectionNode = LanguageDetectionNode;
//# sourceMappingURL=language-detection.node.js.map