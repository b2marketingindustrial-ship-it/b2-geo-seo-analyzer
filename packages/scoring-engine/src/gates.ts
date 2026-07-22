/**
 * Critical Gates — Limita o score máximo quando há falhas críticas
 *
 * @see docs/06_MODELO_DE_PONTUACAO.md — Critical gates
 */

import type { CriticalGate, FindingEvaluation } from '@b2/contracts';

/**
 * Verifica e ativa os gates críticos baseado nos findings
 */
export function applyCriticalGates(
  gates: CriticalGate[],
  findings: FindingEvaluation[]
): CriticalGate[] {
  return gates.map((gate) => {
    const active = checkGateCondition(gate.condition, findings);
    return { ...gate, active };
  });
}

function checkGateCondition(condition: string, findings: FindingEvaluation[]): boolean {
  // Parser simples de condições para gates críticos
  // Formato: "rule:KEY=status" ou "rule:KEY exists"

  if (condition.startsWith('rule:')) {
    const ruleCondition = condition.slice(5); // remove "rule:"
    const [ruleKey, expectedStatus] = ruleCondition.split('=');

    const finding = findings.find((f) => f.ruleKey === ruleKey);
    if (!finding) return false;

    if (expectedStatus) {
      // Verificar status específico
      const statuses = expectedStatus.split(',');
      return statuses.includes(finding.status);
    }

    // Apenas verificar se existe
    return true;
  }

  // Condição: "any_critical" — qualquer finding crítico
  if (condition === 'any_critical') {
    return findings.some((f) => f.severity === 'critical' && f.status === 'FAIL');
  }

  // Condição: "coverage_below_X"
  if (condition.startsWith('coverage_below_')) {
    const threshold = parseFloat(condition.slice('coverage_below_'.length)!) / 100;
    const testedCount = findings.filter(
      (f) => f.status !== 'NOT_TESTED' && f.status !== 'ERROR'
    ).length;
    const total = findings.length;
    const coverage = total > 0 ? testedCount / total : 0;
    return coverage < threshold;
  }

  return false;
}