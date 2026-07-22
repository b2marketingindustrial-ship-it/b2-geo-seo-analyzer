/**
 * Ruleset Loader — Carrega e valida rulesets a partir de JSON
 *
 * @see docs/06_MODELO_DE_PONTUACAO.md — Ruleset
 */

import type { ScoringRule, ScoreCategory, CriticalGate, Ruleset } from '@b2/contracts';

/**
 * Carrega um ruleset a partir de dados JSON (com validação)
 */
export function loadRuleset(json: unknown): Ruleset {
  if (!json || typeof json !== 'object') {
    throw new Error('Ruleset must be a valid JSON object');
  }

  const data = json as Record<string, unknown>;

  // Validações básicas
  if (!data.key || typeof data.key !== 'string') {
    throw new Error('Ruleset requires a string "key"');
  }
  if (!data.version || typeof data.version !== 'string') {
    throw new Error('Ruleset requires a string "version"');
  }
  if (!data.scoreType || typeof data.scoreType !== 'string') {
    throw new Error('Ruleset requires a string "scoreType"');
  }

  const rules: ScoringRule[] = Array.isArray(data.rules)
    ? data.rules.map(validateRule)
    : [];

  const categories: ScoreCategory[] = Array.isArray(data.categories)
    ? data.categories.map((c: any) => ({
        key: c.key ?? '',
        name: c.name ?? '',
        weight: c.weight ?? 0,
        penaltyCap: c.penaltyCap ?? 0,
        version: c.version ?? data.version,
        score: 0,
        coverage: 0,
        confidence: 0,
        earnedPoints: 0,
        applicablePoints: 0,
        weightedScore: 0,
      }))
    : [];

  const gates: CriticalGate[] = Array.isArray(data.gates)
    ? data.gates.map((g: any) => ({
        condition: g.condition ?? '',
        maxScore: g.maxScore ?? 100,
        explanation: g.explanation ?? '',
        active: false,
      }))
    : [];

  return {
    key: data.key as string,
    version: data.version as string,
    scoreType: data.scoreType as ScoringRule['scoreType'],
    status: (data.status as Ruleset['status']) ?? 'draft',
    effectiveAt: (data.effectiveAt as string) ?? new Date().toISOString(),
    categories,
    rules,
    gates,
    changelog: (data.changelog as string) ?? '',
  };
}

function validateRule(rule: unknown): ScoringRule {
  if (!rule || typeof rule !== 'object') {
    throw new Error('Rule must be a valid object');
  }
  const r = rule as Record<string, unknown>;

  return {
    key: (r.key as string) ?? '',
    version: (r.version as string) ?? '1.0.0',
    scoreType: (r.scoreType as ScoringRule['scoreType']) ?? 'seo',
    categoryKey: (r.categoryKey as string) ?? '',
    title: (r.title as string) ?? '',
    description: (r.description as string) ?? '',
    severity: (r.severity as ScoringRule['severity']) ?? 'medium',
    maxPenalty: (r.maxPenalty as number) ?? 10,
    pointsAvailable: (r.pointsAvailable as number) ?? 10,
    evaluationType: (r.evaluationType as ScoringRule['evaluationType']) ?? 'deterministic',
    preconditions: Array.isArray(r.preconditions) ? r.preconditions : [],
    evaluator: (r.evaluator as string) ?? 'default',
    confidenceBase: (r.confidenceBase as number) ?? 0.9,
    remediationTemplateKey: (r.remediationTemplateKey as string) ?? '',
    exclusionGroup: r.exclusionGroup as string | undefined,
    categoryPenaltyCap: r.categoryPenaltyCap as number | undefined,
  };
}