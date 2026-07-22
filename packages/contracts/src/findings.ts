/**
 * Findings — Resultado de cada regra avaliada
 *
 * @see docs/02_ESCOPO_E_REGRAS_DE_NEGOCIO.md — Estados de verificabilidade
 * @see docs/06_MODELO_DE_PONTUACAO.md — Modelo de regra
 */

// ──── States ────

export type FindingState =
  | 'PASS'
  | 'FAIL'
  | 'WARN'
  | 'INFO'
  | 'NOT_APPLICABLE'
  | 'NOT_TESTED'
  | 'UNKNOWN'
  | 'ERROR';

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export type ScoreType = 'seo' | 'geo' | 'ai_visibility';

export type EvaluationType = 'deterministic' | 'semantic' | 'external';

// ──── Evidence ────

export type EvidenceType =
  | 'DOM_ELEMENT'
  | 'VISIBLE_TEXT'
  | 'HTML_SOURCE'
  | 'HTTP_HEADER'
  | 'HTTP_STATUS'
  | 'ROBOTS_RULE'
  | 'SITEMAP_ENTRY'
  | 'SCHEMA_NODE'
  | 'NETWORK_REQUEST'
  | 'LIGHTHOUSE_AUDIT'
  | 'EXTERNAL_SOURCE'
  | 'AI_RESPONSE'
  | 'CONNECTED_DATA';

export interface Evidence {
  /** Tipo de evidência */
  type: EvidenceType;
  /** Origem (extension | backend_http | backend_rendered | ...) */
  source: string;
  /** CSS selector para localização no DOM */
  selector?: string;
  /** Trecho de texto ou valor */
  excerpt?: string;
  /** Nome do atributo quando relevante */
  attributeName?: string;
  /** Valor do atributo quando relevante */
  attributeValue?: string;
  /** Referência a artefato em object storage */
  artifactId?: string;
  /** Dados adicionais específicos do tipo */
  data?: Record<string, unknown>;
}

// ──── Finding ────

export interface Finding {
  /** Chave única da regra que gerou o finding */
  ruleKey: string;
  /** Versão da regra */
  ruleVersion: string;
  /** Tipo de score ao qual pertence (seo | geo | ai_visibility) */
  scoreType: ScoreType;
  /** Categoria do score (ex: 'indexability', 'entity_offer_clarity') */
  categoryKey: string;
  /** Estado da verificação */
  status: FindingState;
  /** Severidade */
  severity: Severity;
  /** Título legível */
  title: string;
  /** Explicação detalhada do que foi verificado */
  explanation: string;
  /** Por que isso importa para SEO/GEO */
  impactText: string;
  /** Como corrigir */
  remediationText: string;
  /** Critério de aceite para considerar resolvido */
  acceptanceCriteria: string;
  /** Qualidade do atendimento (0 a 1) */
  qualityRatio: number;
  /** Pontos disponíveis para esta regra na categoria */
  pointsAvailable: number;
  /** Pontos efetivamente ganhos */
  pointsEarned: number;
  /** Confiança da avaliação (0 a 1) */
  confidence: number;
  /** Esforço estimado para correção (1 a 5) */
  effort: number;
  /** Prioridade calculada */
  priority: 'P0' | 'P1' | 'P2' | 'P3' | 'P4';
  /** Grupo de exclusão para evitar dupla penalização */
  causeGroup?: string;
  /** Tipo de avaliação */
  evaluationType: EvaluationType;
  /** Evidências coletadas */
  evidences: Evidence[];
  /** Dados adicionais da avaliação */
  data?: Record<string, unknown>;
}

// ──── Finding evaluation (saída do rule engine) ────

export interface FindingEvaluation {
  ruleKey: string;
  ruleVersion: string;
  scoreType: ScoreType;
  categoryKey: string;
  status: FindingState;
  severity: Severity;
  title: string;
  explanation: string;
  impactText: string;
  remediationText: string;
  acceptanceCriteria: string;
  qualityRatio: number;
  pointsAvailable: number;
  pointsEarned: number;
  confidence: number;
  effort: number;
  priority: 'P0' | 'P1' | 'P2' | 'P3' | 'P4';
  causeGroup?: string;
  evaluationType: EvaluationType;
  evidences: Evidence[];
  data?: Record<string, unknown>;
}

// ──── Comparison states ────

export type ComparisonState =
  | 'resolved'
  | 'new'
  | 'regressed'
  | 'unchanged'
  | 'not_comparable';

export interface FindingComparison {
  ruleKey: string;
  previousStatus: FindingState;
  currentStatus: FindingState;
  comparisonState: ComparisonState;
  previousQualityRatio: number;
  currentQualityRatio: number;
  previousFinding?: Finding;
  currentFinding?: Finding;
}