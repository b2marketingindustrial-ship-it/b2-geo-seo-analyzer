/**
 * B2 Scoring Engine
 *
 * Motor de pontuação puro. Sem banco, sem rede, sem efeitos colaterais.
 *
 * Entrada: NormalizedFacts + Ruleset
 * Saída:  FindingEvaluation[] + ScoreResult
 *
 * @see docs/06_MODELO_DE_PONTUACAO.md
 */

export { evaluateRule } from './rule-evaluator';
export { calculateCategoryScore } from './category-calculator';
export { calculateScore } from './score-calculator';
export { calculateConfidence } from './confidence';
export { applyCriticalGates } from './gates';
export { compareScores } from './comparison';
export { generateActionItems } from './action-generator';
export { loadRuleset } from './ruleset-loader';