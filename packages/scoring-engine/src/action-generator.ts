/**
 * Action Generator — Gera itens de ação a partir dos findings
 *
 * @see docs/02_ESCOPO_E_REGRAS_DE_NEGOCIO.md — Prioridade do plano de ação
 * @see docs/10_UX_UI.md — Plano de ação
 */

import type { FindingEvaluation } from '@b2/contracts';
import type { ActionItem, ActionPriority, Discipline, ActionItemStatus } from '@b2/contracts';

/**
 * Gera action items a partir de findings, deduplicados por causeGroup
 */
export function generateActionItems(
  findings: FindingEvaluation[],
  actionPlanId: string
): ActionItem[] {
  // Filtrar apenas findings que precisam de ação
  const actionableFindings = findings.filter(
    (f) => f.status === 'FAIL' || f.status === 'WARN'
  );

  // Deduplicar por causeGroup para evitar ações redundantes
  const deduplicated = deduplicateByCauseGroup(actionableFindings);

  // Criar action items
  const items: ActionItem[] = deduplicated.map((finding, index) => {
    const priority = calculateFindingPriority(finding);
    const discipline = inferDiscipline(finding);
    const impact = inferImpact(finding);
    const effort = finding.effort;
    const urgency = inferUrgency(finding);
    const confidence = finding.confidence;
    const estimatedScoreGain = finding.pointsAvailable - finding.pointsEarned;

    return {
      id: '', // Será preenchido pelo banco
      actionPlanId,
      findingId: finding.ruleKey,
      title: `Corrigir: ${finding.title}`,
      description: `${finding.explanation}\n\nImpacto: ${finding.impactText}\n\nComo corrigir: ${finding.remediationText}`,
      discipline,
      priority,
      impact,
      effort,
      urgency,
      confidence,
      estimatedScoreGain: Math.round(estimatedScoreGain * 100) / 100,
      status: 'open' as ActionItemStatus,
      acceptanceCriteria: finding.acceptanceCriteria,
      sourceType: 'finding',
      manualOrder: index,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });

  // Ordenar por prioridade (P0 > P1 > P2 > P3 > P4) e depois por score gain
  return items.sort((a, b) => {
    const priorityOrder = { P0: 0, P1: 1, P2: 2, P3: 3, P4: 4 };
    const pDiff = (priorityOrder[a.priority] ?? 4) - (priorityOrder[b.priority] ?? 4);
    if (pDiff !== 0) return pDiff;
    return b.estimatedScoreGain - a.estimatedScoreGain;
  });
}

function deduplicateByCauseGroup(findings: FindingEvaluation[]): FindingEvaluation[] {
  const seenGroups = new Set<string>();
  const result: FindingEvaluation[] = [];

  for (const finding of findings) {
    if (finding.causeGroup) {
      if (seenGroups.has(finding.causeGroup)) continue;
      seenGroups.add(finding.causeGroup);
    }
    result.push(finding);
  }

  return result;
}

function calculateFindingPriority(finding: FindingEvaluation): ActionPriority {
  // Críticos de indexabilidade são sempre P0
  if (
    finding.severity === 'critical' &&
    finding.categoryKey === 'indexability' &&
    finding.status === 'FAIL'
  ) {
    return 'P0';
  }

  const score = (finding.severity === 'critical' ? 5 : finding.severity === 'high' ? 4 : finding.severity === 'medium' ? 3 : 2) * finding.confidence / Math.max(finding.effort, 1);

  if (score >= 3.5) return 'P1';
  if (score >= 2.0) return 'P2';
  if (score >= 0.75) return 'P3';
  return 'P4';
}

function inferDiscipline(finding: FindingEvaluation): Discipline {
  const cat = finding.categoryKey;
  if (cat.includes('index') || cat.includes('robot') || cat.includes('sitemap') || cat.includes('redirect')) {
    return 'seo_technical';
  }
  if (cat.includes('metadata') || cat.includes('heading')) {
    return 'seo_technical';
  }
  if (cat.includes('content') || cat.includes('entity') || cat.includes('claim') || cat.includes('completeness')) {
    return 'content';
  }
  if (cat.includes('performance') || cat.includes('mobile')) {
    return 'performance';
  }
  if (cat.includes('image') || cat.includes('media')) {
    return 'design_ux';
  }
  if (cat.includes('link') || cat.includes('structure')) {
    return 'development';
  }
  if (cat.includes('authority') || cat.includes('evidence') || cat.includes('citation')) {
    return 'authority_reputation';
  }
  if (cat.includes('schema') || cat.includes('integration')) {
    return 'data_integrations';
  }
  if (cat.includes('local') || cat.includes('commercial')) {
    return 'commercial_strategy';
  }
  return 'development';
}

function inferImpact(finding: FindingEvaluation): number {
  switch (finding.severity) {
    case 'critical': return 5;
    case 'high': return 4;
    case 'medium': return 3;
    case 'low': return 2;
    default: return 1;
  }
}

function inferUrgency(finding: FindingEvaluation): number {
  switch (finding.severity) {
    case 'critical': return 5;
    case 'high': return 4;
    case 'medium': return 3;
    case 'low': return 2;
    default: return 1;
  }
}