/**
 * Rule Evaluator — Avalia uma regra contra fatos normalizados
 *
 * @see docs/06_MODELO_DE_PONTUACAO.md — Cálculo por regra
 */

import type { NormalizedFacts } from '@b2/contracts';
import type { ScoringRule, RuleCondition } from '@b2/contracts';
import type { FindingEvaluation, FindingState } from '@b2/contracts';

/**
 * Avalia uma regra individual contra fatos normalizados
 *
 * Retorna FindingEvaluation com quality_ratio entre 0 e 1:
 * - 1.00: totalmente atendida
 * - 0.75: atendida com pequena oportunidade
 * - 0.50: parcialmente atendida
 * - 0.25: baixa qualidade
 * - 0.00: falha
 */
export function evaluateRule(
  rule: ScoringRule,
  facts: NormalizedFacts,
  evaluatorFn?: (rule: ScoringRule, facts: NormalizedFacts) => {
    qualityRatio: number;
    status: FindingState;
    evidences: Array<{ type: string; excerpt?: string; selector?: string }>;
  }
): FindingEvaluation {
  // Verificar pré-condições
  const preconditionsMet = checkPreconditions(rule.preconditions, facts);
  if (!preconditionsMet) {
    return createEvaluation(rule, 'NOT_APPLICABLE', 1.0, []);
  }

  // Se houver avaliador customizado, usá-lo
  if (evaluatorFn) {
    const result = evaluatorFn(rule, facts);
    return createEvaluation(rule, result.status, result.qualityRatio, result.evidences);
  }

  // Fallback: avaliação determinística básica baseada nas pré-condições
  return createEvaluation(rule, 'NOT_TESTED', 0, []);
}

function checkPreconditions(conditions: RuleCondition[], facts: NormalizedFacts): boolean {
  if (conditions.length === 0) return true;

  return conditions.every((condition) => {
    const value = getFactValue(facts, condition.fact);
    return evaluateCondition(condition, value);
  });
}

function getFactValue(facts: NormalizedFacts, path: string): unknown {
  // Suporte a caminhos com dot notation: "metadata.title", "http.statusCode"
  const parts = path.split('.');
  let current: unknown = facts;

  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    if (typeof current === 'object' && part in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }

  return current;
}

function evaluateCondition(condition: RuleCondition, value: unknown): boolean {
  switch (condition.operator) {
    case 'exists':
      return value !== null && value !== undefined;
    case 'not_exists':
      return value === null || value === undefined;
    case 'equals':
      return value === condition.value;
    case 'not_equals':
      return value !== condition.value;
    case 'greater_than':
      return typeof value === 'number' && typeof condition.value === 'number'
        ? value > condition.value
        : false;
    case 'less_than':
      return typeof value === 'number' && typeof condition.value === 'number'
        ? value < condition.value
        : false;
    case 'contains':
      return typeof value === 'string' && typeof condition.value === 'string'
        ? value.includes(condition.value)
        : false;
    default:
      return false;
  }
}

function createEvaluation(
  rule: ScoringRule,
  status: FindingState,
  qualityRatio: number,
  evidences: Array<{ type: string; excerpt?: string; selector?: string }>
): FindingEvaluation {
  const pointsEarned = status === 'NOT_APPLICABLE' || status === 'NOT_TESTED' || status === 'UNKNOWN' || status === 'ERROR'
    ? 0
    : rule.pointsAvailable * qualityRatio;

  return {
    ruleKey: rule.key,
    ruleVersion: rule.version,
    scoreType: rule.scoreType,
    categoryKey: rule.categoryKey,
    status,
    severity: rule.severity,
    title: rule.title,
    explanation: rule.description,
    impactText: '',
    remediationText: '',
    acceptanceCriteria: '',
    qualityRatio,
    pointsAvailable: status === 'NOT_APPLICABLE' ? 0 : rule.pointsAvailable,
    pointsEarned,
    confidence: calculateFindingConfidence(rule, qualityRatio),
    effort: 3, // default medio
    priority: 'P2', // será recalculado pelo action-generator
    causeGroup: rule.exclusionGroup,
    evaluationType: rule.evaluationType,
    evidences: evidences.map((e) => ({
      type: (e.type as any) || 'DOM_ELEMENT',
      source: 'backend',
      excerpt: e.excerpt,
      selector: e.selector,
    })),
  };
}

function calculateFindingConfidence(rule: ScoringRule, qualityRatio: number): number {
  const baseConfidence = rule.confidenceBase;
  // Ajustar por qualityRatio (resultados extremos têm mais certeza)
  const qualityFactor = qualityRatio <= 0.1 || qualityRatio >= 0.9 ? 1.0 : 0.9;
  return Math.min(1.0, Math.max(0, baseConfidence * qualityFactor));
}