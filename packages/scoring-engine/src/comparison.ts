/**
 * Score Comparison — Compara scores de análises diferentes
 *
 * @see docs/02_ESCOPO_E_REGRAS_DE_NEGOCIO.md — Reanálise
 * @see docs/06_MODELO_DE_PONTUACAO.md — Comparação
 */

import type { FindingEvaluation, FindingComparison, ComparisonState } from '@b2/contracts';
import type { ScoreResult, ScoreComparison } from '@b2/contracts';

/**
 * Compara dois conjuntos de findings e retorna a lista de comparações
 */
export function compareFindings(
  previousFindings: FindingEvaluation[],
  currentFindings: FindingEvaluation[]
): FindingComparison[] {
  const comparisonMap = new Map<string, FindingComparison>();

  // Indexar por ruleKey
  for (const prev of previousFindings) {
    comparisonMap.set(prev.ruleKey, {
      ruleKey: prev.ruleKey,
      previousStatus: prev.status,
      currentStatus: prev.status, // placeholder
      comparisonState: 'unchanged',
      previousQualityRatio: prev.qualityRatio,
      currentQualityRatio: prev.qualityRatio,
    });
  }

  for (const curr of currentFindings) {
    const existing = comparisonMap.get(curr.ruleKey);

    if (!existing) {
      // Novo finding
      comparisonMap.set(curr.ruleKey, {
        ruleKey: curr.ruleKey,
        previousStatus: 'NOT_TESTED',
        currentStatus: curr.status,
        comparisonState: 'new',
        previousQualityRatio: 0,
        currentQualityRatio: curr.qualityRatio,
      });
    } else {
      // Atualizar existing
      existing.currentStatus = curr.status;
      existing.currentQualityRatio = curr.qualityRatio;
      existing.comparisonState = determineComparisonState(
        existing.previousStatus,
        existing.currentStatus,
        existing.previousQualityRatio,
        existing.currentQualityRatio
      );
    }
  }

  // Checar findings que estavam presentes antes mas não agora
  for (const prev of previousFindings) {
    if (!currentFindings.some((c) => c.ruleKey === prev.ruleKey)) {
      const existing = comparisonMap.get(prev.ruleKey)!;
      existing.comparisonState = 'not_comparable';
    }
  }

  return Array.from(comparisonMap.values());
}

function determineComparisonState(
  prevStatus: FindingEvaluation['status'],
  currStatus: FindingEvaluation['status'],
  prevQuality: number,
  currQuality: number
): ComparisonState {
  // Resolvido: era FAIL/WARN e agora é PASS
  if ((prevStatus === 'FAIL' || prevStatus === 'WARN') && currStatus === 'PASS') {
    return 'resolved';
  }

  // Regressão: era PASS e agora é FAIL/WARN
  if (prevStatus === 'PASS' && (currStatus === 'FAIL' || currStatus === 'WARN')) {
    return 'regressed';
  }

  // Melhoria: quality ratio subiu significativamente
  if (currQuality - prevQuality >= 0.25) {
    return 'resolved';
  }

  // Piora: quality ratio caiu significativamente
  if (prevQuality - currQuality >= 0.25) {
    return 'regressed';
  }

  // Não comparável: status diferentes que não indicam mudança clara
  if (prevStatus !== currStatus) {
    return 'not_comparable';
  }

  return 'unchanged';
}

/**
 * Compara dois ScoreResult e retorna um ScoreComparison
 */
export function compareScores(
  previous: ScoreResult,
  current: ScoreResult
): ScoreComparison {
  const rulesetWarning =
    previous.rulesetVersion !== current.rulesetVersion
      ? `As metodologias são diferentes: ${previous.rulesetVersion} → ${current.rulesetVersion}. A comparação pode não refletir apenas mudanças na página.`
      : null;

  return {
    rulesetVersionPrevious: previous.rulesetVersion,
    rulesetVersionCurrent: current.rulesetVersion,
    rulesetWarning,
    previousScore: previous.score,
    currentScore: current.score,
    delta: current.score - previous.score,
    previousCoverage: previous.coverage,
    currentCoverage: current.coverage,
    previousConfidence: previous.confidence,
    currentConfidence: current.confidence,
  };
}