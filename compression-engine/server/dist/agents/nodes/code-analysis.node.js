"use strict";
/**
 * Code Analysis Agent
 *
 * Responsibilities:
 * - Parse source code
 * - Identify: Functions, Classes, Variables, Methods, Imports, Dependencies
 * - NEVER remove executable logic
 * - Only remove: Comments, Unused blank lines, Repeated imports, Duplicate comments
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeAnalysisNode = void 0;
class CodeAnalysisNode {
    name = 'code_analysis';
    shouldExecute(state) {
        return state.documentType === 'code';
    }
    async execute(state) {
        const text = state.processedText;
        const result = this.analyzeCode(text);
        return {
            ...state,
            codeAnalysisResult: result,
        };
    }
    analyzeCode(code) {
        const language = this.detectCodeLanguage(code);
        const functions = this.extractFunctions(code, language);
        const classes = this.extractClasses(code, language);
        const imports = this.extractImports(code, language);
        const comments = this.analyzeComments(code, language);
        const unusedBlankLines = this.findUnusedBlankLines(code);
        const duplicateImports = this.findDuplicateImports(imports);
        return {
            functions,
            classes,
            imports,
            comments,
            unusedBlankLines,
            duplicateImports,
            language,
        };
    }
    detectCodeLanguage(code) {
        const signals = {
            python: 0, javascript: 0, typescript: 0, java: 0, cpp: 0, go: 0, rust: 0,
        };
        if (/^def\s+\w+\s*\(/m.test(code))
            signals.python += 3;
        if (/^import\s+\w+$/m.test(code) && !/[{;]/.test(code.slice(0, 200)))
            signals.python += 2;
        if (/self\.\w+/.test(code))
            signals.python += 2;
        if (/^\s*class\s+\w+.*:$/m.test(code))
            signals.python += 2;
        if (/\b(const|let|var)\b/.test(code))
            signals.javascript += 2;
        if (/=>\s*[{(]/.test(code))
            signals.javascript += 2;
        if (/\brequire\(/.test(code))
            signals.javascript += 2;
        if (/:\s*(string|number|boolean|void|any)\b/.test(code))
            signals.typescript += 3;
        if (/\binterface\s+\w+/.test(code))
            signals.typescript += 3;
        if (/\b(export|import)\s+{/.test(code))
            signals.typescript += 1;
        if (/\bpublic\s+(static\s+)?void\s+main/.test(code))
            signals.java += 5;
        if (/\bSystem\.(out|err)\.print/.test(code))
            signals.java += 3;
        if (/\bpackage\s+[\w.]+;/.test(code))
            signals.java += 3;
        if (/#include\s*[<"]/.test(code))
            signals.cpp += 3;
        if (/\bstd::/.test(code))
            signals.cpp += 3;
        if (/\bint\s+main\s*\(/.test(code))
            signals.cpp += 2;
        if (/^func\s+\w+/m.test(code))
            signals.go += 3;
        if (/\bfmt\./.test(code))
            signals.go += 2;
        if (/^package\s+\w+$/m.test(code))
            signals.go += 2;
        if (/^fn\s+\w+/m.test(code))
            signals.rust += 3;
        if (/\blet\s+mut\b/.test(code))
            signals.rust += 3;
        if (/\b(impl|trait|struct)\s+\w+/.test(code))
            signals.rust += 2;
        const sorted = Object.entries(signals).sort((a, b) => b[1] - a[1]);
        return sorted[0][1] > 0 ? sorted[0][0] : 'unknown';
    }
    extractFunctions(code, language) {
        const patterns = [];
        switch (language) {
            case 'python':
                patterns.push(/^\s*def\s+(\w+)/gm);
                break;
            case 'javascript':
            case 'typescript':
                patterns.push(/^\s*(?:export\s+)?(?:async\s+)?function\s+(\w+)/gm);
                patterns.push(/^\s*(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\(/gm);
                break;
            case 'java':
                patterns.push(/^\s*(?:public|private|protected)?\s*(?:static\s+)?\w+\s+(\w+)\s*\(/gm);
                break;
            case 'cpp':
                patterns.push(/^\s*(?:\w+\s+)+(\w+)\s*\([^)]*\)\s*\{?$/gm);
                break;
            case 'go':
                patterns.push(/^func\s+(\w+)/gm);
                break;
            case 'rust':
                patterns.push(/^(?:pub\s+)?fn\s+(\w+)/gm);
                break;
            default:
                patterns.push(/(?:function|def|fn)\s+(\w+)/gm);
        }
        const functions = [];
        for (const pattern of patterns) {
            let match;
            while ((match = pattern.exec(code)) !== null) {
                functions.push(match[1]);
            }
        }
        return [...new Set(functions)];
    }
    extractClasses(code, language) {
        const patterns = [];
        switch (language) {
            case 'python':
                patterns.push(/^\s*class\s+(\w+)/gm);
                break;
            case 'javascript':
            case 'typescript':
                patterns.push(/^\s*(?:export\s+)?(?:abstract\s+)?class\s+(\w+)/gm);
                patterns.push(/^\s*(?:export\s+)?interface\s+(\w+)/gm);
                break;
            case 'java':
                patterns.push(/^\s*(?:public\s+)?(?:abstract\s+)?class\s+(\w+)/gm);
                break;
            case 'cpp':
                patterns.push(/^\s*(?:class|struct)\s+(\w+)/gm);
                break;
            default:
                patterns.push(/\bclass\s+(\w+)/gm);
        }
        const classes = [];
        for (const pattern of patterns) {
            let match;
            while ((match = pattern.exec(code)) !== null) {
                classes.push(match[1]);
            }
        }
        return [...new Set(classes)];
    }
    extractImports(code, _language) {
        const importPatterns = [
            /^import\s+.+$/gm,
            /^from\s+.+\s+import\s+.+$/gm,
            /^(?:const|let|var)\s+.+\s*=\s*require\(.+\).*$/gm,
            /^using\s+.+;$/gm,
            /^#include\s+.+$/gm,
            /^use\s+.+;$/gm,
        ];
        const imports = [];
        for (const pattern of importPatterns) {
            const matches = code.match(pattern);
            if (matches)
                imports.push(...matches.map(m => m.trim()));
        }
        return imports;
    }
    analyzeComments(code, language) {
        const lines = code.split('\n');
        const comments = [];
        const importantMarkers = /\b(TODO|FIXME|HACK|BUG|NOTE|IMPORTANT|WARNING|SECURITY)\b/i;
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            let isComment = false;
            let commentText = '';
            // Single-line comments
            if (line.startsWith('//') || line.startsWith('#') && language !== 'cpp') {
                isComment = true;
                commentText = line;
            }
            else if (line.startsWith('/*') && line.endsWith('*/')) {
                isComment = true;
                commentText = line;
            }
            else if (line.startsWith('"""') || line.startsWith("'''")) {
                isComment = true;
                commentText = line;
            }
            if (isComment) {
                const removable = !importantMarkers.test(commentText);
                comments.push({ line: i, text: commentText, removable });
            }
        }
        return comments;
    }
    findUnusedBlankLines(code) {
        const lines = code.split('\n');
        const unusedLines = [];
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].trim() === '' && i > 0 && lines[i - 1].trim() === '') {
                unusedLines.push(i);
            }
        }
        return unusedLines;
    }
    findDuplicateImports(imports) {
        const seen = new Set();
        const duplicates = [];
        for (const imp of imports) {
            const normalized = imp.trim().replace(/\s+/g, ' ');
            if (seen.has(normalized)) {
                duplicates.push(imp);
            }
            else {
                seen.add(normalized);
            }
        }
        return duplicates;
    }
}
exports.CodeAnalysisNode = CodeAnalysisNode;
//# sourceMappingURL=code-analysis.node.js.map