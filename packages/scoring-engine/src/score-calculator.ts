/**
 * Score Calculator — Calcula o score final a partir dos findings e categorias
 *
 * @see docs/06_MODELO_DE_PONTUACAO.md — Cálculo final
 *
 * score = Σ weighted_category, limitado entre 0 e 100
 */

import type { FindingEvaluation, ScoreResult, ScoreCategory, ScoreType, CriticalGate } from '@b2/contracts';
import type { CategoryInput } from './category-calculator';
import { calculateCategoryScore } from './category-calculator';
import { calculateConfidence } from './confidence';
import { applyCriticalGates } from './gates';

export interface ScoreCalculationInput {
  scoreType: ScoreType;
  rulesetVersion: string;
  categories: CategoryInput[];
  findings: FindingEvaluation[];
  gates: CriticalGate[];
}

/**
 * Calcula o score completo para um tipo (SEO, GEO ou AI Visibility)
 */
export function calculateScore(input: ScoreCalculationInput): ScoreResult {
  const { scoreType, rulesetVersion, categories, findings, gates } = input;

  // Calcular scores de cada categoria
  const categoryScores: ScoreCategory[] = categories.map((cat) =>
    calculateCategoryScore(cat, findings)
  );

  // Somar weighted scores
  const totalWeightedScore = categoryScores.reduce(
    (sum, cat) => sum + cat.weightedScore,
    0
  );

  // Aplicar critical gates
  const activatedGates = applyCriticalGates(gates, findings);
  const maxGateLimit = Math.min(
    ...activatedGates.filter((g) => g.active).map((g) => g.maxScore),
    100
  );

  // Score final: min entre score calculado e gate limit
  const finalScore = Math.min(totalWeightedScore, maxGateLimit);

  // Calcular cobertura e confiança gerais
  const coverage = calculateCoverage(categoryScores);
  const confidence = calculateConfidence(categoryScores);

  return {
    scoreType,
    rulesetVersion,
    score: Math.max(0, Math.min(100, Math.round(finalScore))),
    coverage: Math.round(coverage * 1000) / 1000,
    confidence: Math.round(confidence * 1000) / 1000,
    categories: categoryScores,
    gates: activatedGates,
    calculatedAt: new Date().toISOString(),
  };
}

function calculateCoverage(categories: ScoreCategory[]): number {
  if (categories.length === 0) return 0;
  const totalWeight = categories.reduce((sum, c) => sum + c.weight, 0);
  if (totalWeight === 0) return 0;

  const weightedCoverage = categories.reduce(
    (sum, c) => sum + c.coverage * c.weight,
    0
  );
  return weightedCoverage / totalWeight;
}