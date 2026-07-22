/**
 * Confidence Calculator — Calcula a confiança geral da análise
 *
 * @see docs/06_MODELO_DE_PONTUACAO.md — Confiança
 *
 * confidence = coverage × collection_quality × source_agreement × rule_reliability
 *
 * Faixas:
 * - 0–39: baixa
 * - 40–69: moderada
 * - 70–89: alta
 * - 90–100: muito alta
 */

import type { ScoreCategory } from '@b2/contracts';

export interface ConfidenceInput {
  coverage: number; // 0-1
  collectionQuality: number; // 0-1 (qualidade da coleta dos fatos)
  sourceAgreement: number; // 0-1 (concordância entre fontes)
  ruleReliability: number; // 0-1 (confiabilidade média das regras)
}

/**
 * Calcula a confiança geral da análise
 */
export function calculateConfidence(categories: ScoreCategory[]): number {
  // Calcular métricas a partir das categorias
  const coverage = calculateAverageCoverage(categories);
  const ruleReliability = calculateAverageConfidence(categories);

  // collectionQuality: baseado em se todos os módulos esperados foram executados
  const collectionQuality = categories.every((c) => c.coverage > 0) ? 1.0 : 0.7;

  // sourceAgreement: simplificado - baseado em concordância entre módulos
  const sourceAgreement = categories.length >= 4 ? 0.9 : 0.7;

  return confidenceFormula({
    coverage,
    collectionQuality,
    sourceAgreement,
    ruleReliability,
  });
}

export function confidenceFormula(input: ConfidenceInput): number {
  const raw = input.coverage * input.collectionQuality * input.sourceAgreement * input.ruleReliability;
  return Math.round(raw * 100);
}

function calculateAverageCoverage(categories: ScoreCategory[]): number {
  if (categories.length === 0) return 0;
  return categories.reduce((sum, c) => sum + c.coverage, 0) / categories.length;
}

function calculateAverageConfidence(categories: ScoreCategory[]): number {
  const categoriesWithData = categories.filter((c) => c.coverage > 0);
  if (categoriesWithData.length === 0) return 0.5;
  return categoriesWithData.reduce((sum, c) => sum + c.confidence, 0) / categoriesWithData.length;
}

/**
 * Retorna a classificação textual da confiança
 */
export function confidenceLabel(confidence: number): string {
  if (confidence >= 90) return 'Muito alta';
  if (confidence >= 70) return 'Alta';
  if (confidence >= 40) return 'Moderada';
  return 'Baixa';
}