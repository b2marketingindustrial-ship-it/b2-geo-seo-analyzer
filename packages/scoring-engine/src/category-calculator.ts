/**
 * Category Calculator — Calcula o score de uma categoria
 *
 * @see docs/06_MODELO_DE_PONTUACAO.md — Cálculo de categoria
 *
 * category_score = 100 × earned_points / applicable_points
 * weighted_category = category_score × category_weight / 100
 */

import type { FindingEvaluation, ScoreCategory } from '@b2/contracts';

export interface CategoryInput {
  key: string;
  name: string;
  weight: number;
  penaltyCap: number;
  version: string;
}

/**
 * Calcula o score de uma categoria a partir dos findings avaliados
 */
export function calculateCategoryScore(
  category: CategoryInput,
  findings: FindingEvaluation[]
): ScoreCategory {
  // Filtrar findings desta categoria
  const categoryFindings = findings.filter((f) => f.categoryKey === category.key);

  // Separar findings aplicáveis (que afetam score) de não-aplicáveis
  const applicableFindings = categoryFindings.filter(
    (f) => f.status !== 'NOT_APPLICABLE' && f.status !== 'NOT_TESTED' && f.status !== 'ERROR'
  );

  const allApplicableFindings = categoryFindings.filter(
    (f) => f.status !== 'NOT_APPLICABLE'
  );

  // Pontos disponíveis e ganhos
  const applicablePoints = allApplicableFindings.reduce(
    (sum, f) => sum + f.pointsAvailable,
    0
  );

  const earnedPoints = applicableFindings.reduce(
    (sum, f) => sum + f.pointsEarned,
    0
  );

  // Se não há pontos aplicáveis, considerar score máximo com baixa cobertura
  if (applicablePoints === 0) {
    return {
      key: category.key,
      name: category.name,
      weight: category.weight,
      penaltyCap: category.penaltyCap,
      version: category.version,
      score: 100,
      coverage: 0,
      confidence: 0,
      earnedPoints: 0,
      applicablePoints: 0,
      weightedScore: (100 * category.weight) / 100,
    };
  }

  // Calcular score da categoria
  const categoryScore = (100 * earnedPoints) / applicablePoints;

  // Aplicar caps de penalidade
  const cappedScore = Math.max(categoryScore, 100 - category.penaltyCap);

  // Calcular cobertura (proporção de regras testadas)
  const testedCount = categoryFindings.filter(
    (f) => f.status !== 'NOT_TESTED' && f.status !== 'ERROR' && f.status !== 'UNKNOWN'
  ).length;
  const totalRules = categoryFindings.length;
  const coverage = totalRules > 0 ? testedCount / totalRules : 1;

  // Calcular confiança média
  const testedFindings = categoryFindings.filter(
    (f) => f.status !== 'NOT_APPLICABLE'
  );
  const confidence = testedFindings.length > 0
    ? testedFindings.reduce((sum, f) => sum + f.confidence, 0) / testedFindings.length
    : 0;

  // Score ponderado para o total
  const weightedScore = (cappedScore * category.weight) / 100;

  return {
    key: category.key,
    name: category.name,
    weight: category.weight,
    penaltyCap: category.penaltyCap,
    version: category.version,
    score: Math.round(cappedScore * 100) / 100,
    coverage: Math.round(coverage * 1000) / 1000,
    confidence: Math.round(confidence * 1000) / 1000,
    earnedPoints,
    applicablePoints,
    weightedScore: Math.round(weightedScore * 100) / 100,
  };
}