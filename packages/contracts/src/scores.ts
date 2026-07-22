/**
 * Scores — Contratos de pontuação
 *
 * @see docs/06_MODELO_DE_PONTUACAO.md — Modelo de Pontuação
 */

import type { ScoreType } from './findings';

// ──── Scoring Rule ────

export interface RuleCondition {
  /** Chave do fato a ser verificado */
  fact: string;
  /** Operador de comparação */
  operator: 'exists' | 'equals' | 'greater_than' | 'less_than' | 'contains' | 'not_equals' | 'not_exists';
  /** Valor esperado */
  value?: unknown;
}

export interface ScoringRule {
  /** Chave única da regra (ex: 'seo.indexability.noindex') */
  key: string;
  /** Versão semântica no formato x.y.z */
  version: string;
  /** Tipo de score */
  scoreType: ScoreType;
  /** Categoria (ex: 'indexability', 'on_page_metadata') */
  categoryKey: string;
  /** Título legível */
  title: string;
  /** Descrição do que é avaliado */
  description: string;
  /** Severidade padrão */
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  /** Penalidade máxima em pontos na categoria */
  maxPenalty: number;
  /** Pontos disponíveis (se a regra for aplicável, quantos pontos valem) */
  pointsAvailable: number;
  /** Tipo de avaliação */
  evaluationType: 'deterministic' | 'semantic' | 'external';
  /** Pré-condições para a regra ser aplicável */
  preconditions: RuleCondition[];
  /** Identificador do avaliador (função ou serviço) */
  evaluator: string;
  /** Confiança base da regra (0 a 1) */
  confidenceBase: number;
  /** Chave do template de remediação */
  remediationTemplateKey: string;
  /** Grupo de exclusão (evita dupla penalização com outras regras) */
  exclusionGroup?: string;
  /** Cap de penalidade por categoria (quando > maxPenalty da regra individual) */
  categoryPenaltyCap?: number;
}

// ──── Category ────

export interface ScoreCategory {
  /** Chave da categoria */
  key: string;
  /** Nome legível */
  name: string;
  /** Peso da categoria no score total */
  weight: number;
  /** Cap de penalidade total na categoria */
  penaltyCap: number;
  /** Versão da definição da categoria */
  version: string;
  /** Score calculado (0-100) */
  score: number;
  /** Cobertura da categoria (0-1) */
  coverage: number;
  /** Confiança da categoria (0-1) */
  confidence: number;
  /** Pontos ganhos */
  earnedPoints: number;
  /** Pontos aplicáveis */
  applicablePoints: number;
  /** Score ponderado (score × weight / 100) */
  weightedScore: number;
}

// ──── Critical Gate ────

export interface CriticalGate {
  /** Condição que ativa o gate */
  condition: string;
  /** Limite máximo de score quando ativado */
  maxScore: number;
  /** Explicação do gate */
  explanation: string;
  /** Se está ativado nesta análise */
  active: boolean;
}

// ──── Score Result ────

export interface ScoreResult {
  /** Tipo de score */
  scoreType: ScoreType;
  /** Versão do ruleset utilizado */
  rulesetVersion: string;
  /** Score final (0-100) */
  score: number;
  /** Cobertura geral (0-1) */
  coverage: number;
  /** Confiança geral (0-1) */
  confidence: number;
  /** Categorias avaliadas */
  categories: ScoreCategory[];
  /** Gates críticos ativados */
  gates: CriticalGate[];
  /** Timestamp do cálculo */
  calculatedAt: string;
}

// ──── Discoverability Score ────

export interface DiscoverabilityScore {
  seoScore: number | null;
  geoScore: number | null;
  aiVisibilityScore: number | null;
  /** Consolidado opcional */
  dds: number | null;
  /** Fórmula utilizada */
  formula: 'seo_geo_ai' | 'seo_geo_only';
  calculatedAt: string;
}

// ──── Ruleset ────

export interface Ruleset {
  /** Chave única do ruleset */
  key: string;
  /** Versão semântica */
  version: string;
  /** Tipo de score */
  scoreType: ScoreType;
  /** Status */
  status: 'draft' | 'active' | 'deprecated';
  /** Data de efetivação */
  effectiveAt: string;
  /** Categorias */
  categories: ScoreCategory[];
  /** Regras */
  rules: ScoringRule[];
  /** Gates críticos */
  gates: CriticalGate[];
  /** Changelog */
  changelog: string;
}

// ──── Score comparison ────

export interface ScoreComparison {
  rulesetVersionPrevious: string;
  rulesetVersionCurrent: string;
  rulesetWarning: string | null; // Se versions diferem
  previousScore: number;
  currentScore: number;
  delta: number;
  previousCoverage: number;
  currentCoverage: number;
  previousConfidence: number;
  currentConfidence: number;
}