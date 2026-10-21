/**
 * Validation Agent
 * 
 * Responsibilities:
 * - Compare: Original Prompt ↔ Compressed Prompt
 * - Measure: Semantic Similarity, Compression %, Estimated Accuracy, Reasoning Retention
 * - Only approve if quality threshold is met
 */

import { AgentNode, WorkflowState, ValidationResult } from '../types';

export class ValidationNode implements AgentNode {
  name = 'validation';

  shouldExecute(_state: WorkflowState): boolean {
    return true;
  }

  async execute(state: WorkflowState): Promise<WorkflowState> {
    const validation = this.validate(state.originalText, state.compressedText, state.compressionLevel);

    return {
      ...state,
      validation,
    };
  }

  private validate(original: string, compressed: string, level: string): ValidationResult {
    const semanticSimilarity = this.computeSemanticSimilarity(original, compressed, level);
    const compressionRatio = 1 - (compressed.length / original.length);
    const reasoningRetention = this.assessReasoningRetention(original, compressed);
    const entityRetention = this.namedEntityPreservation(original, compressed);

    const lengthEfficiency = compressed.length > 0
      ? Math.min(1, Math.max(0.5, semanticSimilarity + 0.1))
      : 0;
    const estimatedAccuracy = Math.min(1,
      (reasoningRetention * 0.35) +
      (semanticSimilarity * 0.30) +
      (entityRetention * 0.25) +
      (lengthEfficiency * 0.10)
    );

    const thresholds: Record<string, number> = {
      low: 0.85,
      medium: 0.80,
      high: 0.75,
      extreme: 0.70,
    };

    const threshold = thresholds[level] || 0.75;
    const approved = estimatedAccuracy >= threshold;

    const issues: string[] = [];
    if (semanticSimilarity < 0.5) issues.push('Very low semantic similarity');
    if (reasoningRetention < 0.6) issues.push('Potential reasoning loss');
    if (compressionRatio < 0.05) issues.push('Minimal compression achieved');
    if (compressionRatio > 0.95) issues.push('Excessive compression may lose meaning');

    return {
      semanticSimilarity,
      compressionRatio: Math.max(0, Math.min(compressionRatio, 0.95)),
      estimatedAccuracy,
      reasoningRetention,
      approved,
      issues,
    };
  }

  private computeSemanticSimilarity(original: string, compressed: string, level: string): number {
    // Multi-factor semantic similarity assessment
    const keyTermScore = this.keyTermPreservation(original, compressed);
    const entityScore = this.namedEntityPreservation(original, compressed);
    const structureScore = this.structuralPreservation(original, compressed, level);
    const densityScore = this.semanticDensity(original, compressed);

    return (keyTermScore * 0.4) + (entityScore * 0.25) + (structureScore * 0.2) + (densityScore * 0.15);
  }

  private keyTermPreservation(original: string, compressed: string): number {
    // Filler words are intentionally removed by compression — they carry
    // no information, so removing them should not reduce accuracy.
    const stopWords = new Set([
      // Grammatical function words
      'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has',
      'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
      'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'and', 'or',
      'but', 'if', 'not', 'so', 'this', 'that', 'it', 'its',
      // Filler / hedging words (removed by compression, shouldn't count)
      'basically', 'essentially', 'actually', 'literally', 'obviously', 'clearly',
      'certainly', 'definitely', 'undoubtedly', 'honestly', 'frankly', 'arguably',
      'presumably', 'apparently', 'seemingly', 'quite', 'rather', 'somewhat',
      'fairly', 'really', 'very', 'just', 'simply', 'merely', 'only',
      // Filler phrase constituents
      'fact', 'note', 'mentioned', 'previously', 'earlier', 'above', 'goes',
      'saying', 'said', 'needless', 'honest', 'matter', 'account', 'considered',
      'taking', 'having', 'given', 'account', 'worth', 'mentioning', 'noting',
    ]);

    const tokenize = (text: string): string[] =>
      text.toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 3 && !stopWords.has(w));

    const originalWords = tokenize(original);
    const compressedWords = tokenize(compressed);

    if (originalWords.length === 0) return 1;

    // Build frequency maps
    const originalFreq = new Map<string, number>();
    for (const w of originalWords) originalFreq.set(w, (originalFreq.get(w) || 0) + 1);
    const compressedSet = new Set(compressedWords);

    /*
     * Weighted preservation:
     * - Each unique term contributes a weight based on rarity (1 / frequency)
     * - This rewards preserving rare, distinctive terms (names, technical concepts)
     * - And doesn't penalize removing repeated fluff
     */
    let totalWeight = 0;
    let preservedWeight = 0;

    const ABBR_MAP: Record<string, string> = {
      auth: 'authentication',
      reqs: 'requirements',
      mgmt: 'management',
      app: 'application',
      db: 'database',
      config: 'configuration',
      fe: 'frontend',
      be: 'backend',
      info: 'information',
      impl: 'implementation',
      dev: 'development',
      param: 'parameter',
    };

    for (const [term, freq] of originalFreq) {
      const rarityWeight = 1 / Math.sqrt(freq); // Rarer terms weighted higher
      totalWeight += rarityWeight;
      if (
        compressedSet.has(term) ||
        compressedWords.some(cw => ABBR_MAP[cw] === term || cw.startsWith(term) || term.startsWith(cw))
      ) {
        preservedWeight += rarityWeight;
      }
    }

    return totalWeight > 0 ? preservedWeight / totalWeight : 1;
  }

  private namedEntityPreservation(original: string, compressed: string): number {
    const extractEntities = (text: string): Set<string> => {
      const entities = new Set<string>();

      // Capitalized multi-word names
      const names = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/g);
      if (names) names.forEach(n => entities.add(n.toLowerCase()));

      // Technical identifiers (camelCase, PascalCase)
      const identifiers = text.match(/\b[a-z]+[A-Z]\w+\b|\b[A-Z][a-z]+[A-Z]\w+\b/g);
      if (identifiers) identifiers.forEach(i => entities.add(i.toLowerCase()));

      // File paths
      const files = text.match(/[\w./\\-]+\.\w{1,5}/g);
      if (files) files.forEach(f => entities.add(f.toLowerCase()));

      // URLs
      const urls = text.match(/https?:\/\/\S+/g);
      if (urls) urls.forEach(u => entities.add(u.toLowerCase()));

      return entities;
    };

    const originalEntities = extractEntities(original);
    const compressedEntities = extractEntities(compressed);

    if (originalEntities.size === 0) return 1;

    let preserved = 0;
    for (const entity of originalEntities) {
      if (compressedEntities.has(entity) || compressed.toLowerCase().includes(entity)) {
        preserved++;
      }
    }

    return preserved / originalEntities.size;
  }

  private structuralPreservation(original: string, compressed: string, level: string = 'medium'): number {
    const originalSentences = original.split(/[.!?\n]+/).filter(s => s.trim().length > 5).length;
    const compressedSentences = compressed.split(/[.!?\n]+/).filter(s => s.trim().length > 5).length;

    if (originalSentences === 0 || compressedSentences === 0) return compressedSentences === 0 ? 0 : 1;

    const targetMap: Record<string, number> = { low: 0.30, medium: 0.50, high: 0.70, extreme: 0.85 };
    const target = targetMap[level] || 0.50;
    const expectedRatio = Math.max(0.12, 1 - target);
    const actualRatio = compressedSentences / originalSentences;

    if (actualRatio >= expectedRatio * 0.7) return 1;
    return Math.min(1, actualRatio / (expectedRatio * 0.7));
  }

  private semanticDensity(original: string, compressed: string): number {
    // Ratio of "information" to total length
    const getInformationDensity = (text: string): number => {
      const words = text.split(/\s+/);
      const contentWords = words.filter(w => w.length > 3 && !/^(the|and|for|that|this|with|from|have|been)$/i.test(w));
      return words.length > 0 ? contentWords.length / words.length : 0;
    };

    const originalDensity = getInformationDensity(original);
    const compressedDensity = getInformationDensity(compressed);

    // Compressed text should have higher density (less filler)
    if (compressedDensity >= originalDensity) return 1;
    return compressedDensity / Math.max(originalDensity, 0.01);
  }

  private assessReasoningRetention(original: string, compressed: string): number {
    // Check if logical connectors and reasoning categories are preserved
    const reasoningCategories = [
      /\b(because|therefore|thus|hence|consequently|as a result)\b/i,
      /\b(if|then|when|unless|although|however|but)\b/i,
      /\b(first|second|third|finally|next|after)\b/i,
      /\b(must|should|need|require|required|important|critical|ensure)\b/i,
    ];

    let totalCategories = 0;
    let preservedCategories = 0;

    for (const pattern of reasoningCategories) {
      if (pattern.test(original)) {
        totalCategories++;
        if (pattern.test(compressed)) {
          preservedCategories++;
        }
      }
    }

    return totalCategories > 0 ? preservedCategories / totalCategories : 1;
  }
}
