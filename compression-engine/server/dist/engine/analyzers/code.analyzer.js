"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeAnalyzer = void 0;
class CodeAnalyzer {
    compress(code, target) {
        const modifications = [];
        let result = code;
        // Remove single-line comments (preserve important ones)
        result = this.removeComments(result, target, modifications);
        // Remove excessive blank lines
        result = this.reduceWhitespace(result, modifications);
        // Compress verbose patterns
        if (target > 0.5) {
            result = this.compressVerbosePatterns(result, modifications);
        }
        // Remove docstrings for high compression
        if (target > 0.6) {
            result = this.removeDocstrings(result, modifications);
        }
        // Shorten variable names for extreme compression
        if (target > 0.8) {
            result = this.abbreviateNames(result, modifications);
        }
        return { text: result, modifications };
    }
    removeComments(code, target, modifications) {
        const lines = code.split('\n');
        const result = [];
        for (const line of lines) {
            const trimmed = line.trim();
            // Keep important comments (TODO, FIXME, NOTE, IMPORTANT)
            if (trimmed.startsWith('//') || trimmed.startsWith('#')) {
                const important = /todo|fixme|note|important|warning|hack|bug/i.test(trimmed);
                if (important && target < 0.8) {
                    result.push(line);
                }
                else {
                    modifications.push({ original: line, modified: '[removed comment]' });
                }
                continue;
            }
            // Remove inline comments for medium+ compression
            if (target > 0.4) {
                const inlineComment = line.match(/^(.+?)\s*(\/\/|#)\s*.+$/);
                if (inlineComment && !line.includes('://')) {
                    const cleaned = inlineComment[1].trimEnd();
                    if (cleaned !== line) {
                        modifications.push({ original: line, modified: cleaned });
                    }
                    result.push(cleaned);
                    continue;
                }
            }
            result.push(line);
        }
        return result.join('\n');
    }
    reduceWhitespace(code, modifications) {
        const original = code;
        // Reduce multiple blank lines to single
        let result = code.replace(/\n{3,}/g, '\n\n');
        // Remove trailing whitespace
        result = result.split('\n').map(l => l.trimEnd()).join('\n');
        if (result !== original) {
            modifications.push({ original: '[excessive whitespace]', modified: '[normalized whitespace]' });
        }
        return result;
    }
    compressVerbosePatterns(code, modifications) {
        let result = code;
        // Compress console.log/print statements
        const logPattern = /^\s*(console\.(log|info|debug|warn)|print|System\.out\.println)\s*\(.+\);\s*$/gm;
        const logMatches = result.match(logPattern);
        if (logMatches && logMatches.length > 3) {
            result = result.replace(logPattern, '');
            modifications.push({
                original: `[${logMatches.length} log statements]`,
                modified: '[removed debug logs]',
            });
        }
        // Compress repeated import patterns
        const importLines = result.split('\n').filter(l => l.trim().startsWith('import ') || l.trim().startsWith('from ') || l.trim().startsWith('require('));
        if (importLines.length > 10) {
            const summary = `// [${importLines.length} imports]`;
            const importSection = importLines.join('\n');
            result = result.replace(importSection, summary);
            modifications.push({
                original: `[${importLines.length} import statements]`,
                modified: summary,
            });
        }
        return result;
    }
    removeDocstrings(code, modifications) {
        let result = code;
        // Python docstrings
        const pythonDocstring = /"""[\s\S]*?"""/g;
        const pyMatches = result.match(pythonDocstring);
        if (pyMatches) {
            result = result.replace(pythonDocstring, '');
            modifications.push({
                original: `[${pyMatches.length} docstrings]`,
                modified: '[removed docstrings]',
            });
        }
        // JSDoc comments
        const jsdoc = /\/\*\*[\s\S]*?\*\//g;
        const jsMatches = result.match(jsdoc);
        if (jsMatches) {
            result = result.replace(jsdoc, '');
            modifications.push({
                original: `[${jsMatches.length} JSDoc blocks]`,
                modified: '[removed JSDoc]',
            });
        }
        // Multi-line comments
        const multiLine = /\/\*[\s\S]*?\*\//g;
        const mlMatches = result.match(multiLine);
        if (mlMatches) {
            result = result.replace(multiLine, '');
            modifications.push({
                original: `[${mlMatches.length} block comments]`,
                modified: '[removed block comments]',
            });
        }
        return result;
    }
    abbreviateNames(code, modifications) {
        // Only abbreviate very long variable names (>15 chars)
        const longNames = code.match(/\b[a-zA-Z_][a-zA-Z0-9_]{15,}\b/g);
        if (!longNames)
            return code;
        const unique = [...new Set(longNames)];
        let result = code;
        let count = 0;
        for (const name of unique.slice(0, 10)) {
            // Create abbreviated version
            const parts = name.replace(/([A-Z])/g, '_$1').split(/[_]+/).filter(Boolean);
            if (parts.length >= 3) {
                const abbreviated = parts.map(p => p.slice(0, 3).toLowerCase()).join('_');
                if (abbreviated.length < name.length * 0.6) {
                    result = result.split(name).join(abbreviated);
                    count++;
                }
            }
        }
        if (count > 0) {
            modifications.push({
                original: `[${count} long identifiers]`,
                modified: '[abbreviated identifiers]',
            });
        }
        return result;
    }
}
exports.CodeAnalyzer = CodeAnalyzer;
//# sourceMappingURL=code.analyzer.js.map