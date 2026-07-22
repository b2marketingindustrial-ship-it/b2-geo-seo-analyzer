/**
 * Action Plan — Plano de ação priorizado
 *
 * @see docs/02_ESCOPO_E_REGRAS_DE_NEGOCIO.md — Prioridade do plano de ação
 * @see docs/10_UX_UI.md — Plano de ação
 */

// ──── Disciplines ────

export type Discipline =
  | 'development'
  | 'seo_technical'
  | 'content'
  | 'design_ux'
  | 'performance'
  | 'authority_reputation'
  | 'data_integrations'
  | 'commercial_strategy';

// ──── Priority ────

export type ActionPriority = 'P0' | 'P1' | 'P2' | 'P3' | 'P4';

export type ActionItemStatus = 'open' | 'in_progress' | 'completed' | 'ignored' | 'not_applicable';

export type ActionItemSourceType = 'finding' | 'manual' | 'suggestion';

// ──── Action Plan ────

export interface ActionPlan {
  id: string;
  projectId: string;
  sourceAnalysisRunId: string;
  name: string;
  status: 'active' | 'archived';
  generatedAt: string;
  generatedBy: string;
  settings: Record<string, unknown>;
  items: ActionItem[];
}

// ──── Action Item ────

export interface ActionItem {
  id: string;
  actionPlanId: string;
  /** Finding que originou (se aplicável) */
  findingId?: string;
  /** Título da tarefa */
  title: string;
  /** Descrição detalhada */
  description: string;
  /** Disciplina responsável */
  discipline: Discipline;
  /** Prioridade */
  priority: ActionPriority;
  /** Impacto (1-5) */
  impact: number;
  /** Esforço (1-5) */
  effort: number;
  /** Urgência (1-5) */
  urgency: number;
  /** Confiança (0.25-1.00) */
  confidence: number;
  /** Ganho estimado no score */
  estimatedScoreGain: number;
  /** Usuário responsável */
  ownerUserId?: string;
  /** Data limite */
  dueDate?: string;
  /** Status */
  status: ActionItemStatus;
  /** Critério de aceite */
  acceptanceCriteria: string;
  /** Origem: finding, manual ou sugestão */
  sourceType: ActionItemSourceType;
  /** Ordem manual (drag-and-drop) */
  manualOrder: number;
  /** Comentários */
  comments?: ActionItemComment[];
  createdAt: string;
  updatedAt: string;
}

export interface ActionItemComment {
  id: string;
  actionItemId: string;
  authorUserId: string;
  text: string;
  createdAt: string;
}

// ──── Priority Calculation ────

export interface PriorityInput {
  /** Impacto estimado (1-5) */
  impact: number;
  /** Urgência (1-5) */
  urgency: number;
  /** Confiança na correção (0.25-1.00) */
  confidence: number;
  /** Esforço estimado (1-5) */
  effort: number;
}

/**
 * Calcula a prioridade usando a fórmula:
 * priority_score = (impacto × urgência × confiança) / esforço
 *
 * @see docs/02_ESCOPO_E_REGRAS_DE_NEGOCIO.md
 */
export function calculatePriorityScore(input: PriorityInput): number {
  if (input.effort <= 0) throw new Error('Effort must be greater than 0');
  return (input.impact * input.urgency * input.confidence) / input.effort;
}

/**
 * Mapeia priority score para classificação P0-P4
 */
export function toActionPriority(
  score: number,
  isCriticalIndexability?: boolean
): ActionPriority {
  // Critical indexability issues são sempre P0
  if (isCriticalIndexability) return 'P0';

  if (score >= 3.5) return 'P1';
  if (score >= 2.0) return 'P2';
  if (score >= 0.75) return 'P3';
  return 'P4';
}

// ──── Action Plan Filters ────

export interface ActionPlanFilters {
  discipline?: Discipline[];
  priority?: ActionPriority[];
  status?: ActionItemStatus[];
  ownerUserId?: string;
  search?: string;
  sortBy?: 'priority' | 'impact' | 'effort' | 'due_date' | 'score_gain' | 'manual';
  sortOrder?: 'asc' | 'desc';
}