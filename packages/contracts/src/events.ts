/**
 * Eventos internos do sistema
 *
 * Padrão de nomes e payloads mínimos para comunicação assíncrona.
 *
 * @see docs/03_ARQUITETURA.md — Eventos internos
 */

export type EventType =
  | 'analysis.run.created'
  | 'analysis.module.started'
  | 'analysis.module.completed'
  | 'analysis.module.failed'
  | 'analysis.run.scored'
  | 'analysis.run.completed'
  | 'analysis.run.cancelled'
  | 'finding.created'
  | 'action_item.created'
  | 'integration.connected'
  | 'integration.revoked'
  | 'ai_visibility.prompt.completed';

export interface BaseEvent {
  eventId: string;
  eventType: EventType;
  occurredAt: string; // ISO 8601 UTC
  tenantId: string;
  correlationId: string;
  analysisRunId?: string;
  payloadVersion: string;
}

export interface AnalysisRunCreatedEvent extends BaseEvent {
  eventType: 'analysis.run.created';
  analysisRunId: string;
  projectId: string;
  url: string;
  source: 'extension' | 'dashboard' | 'schedule' | 'api';
}

export interface AnalysisModuleStartedEvent extends BaseEvent {
  eventType: 'analysis.module.started';
  analysisRunId: string;
  moduleKey: string;
  moduleVersion: string;
}

export interface AnalysisModuleCompletedEvent extends BaseEvent {
  eventType: 'analysis.module.completed';
  analysisRunId: string;
  moduleKey: string;
  moduleVersion: string;
  durationMs: number;
  findingsCount: number;
  coverage: number;
}

export interface AnalysisModuleFailedEvent extends BaseEvent {
  eventType: 'analysis.module.failed';
  analysisRunId: string;
  moduleKey: string;
  moduleVersion: string;
  errorCode: string;
  errorMessage: string;
  attempt: number;
}

export interface AnalysisRunScoredEvent extends BaseEvent {
  eventType: 'analysis.run.scored';
  analysisRunId: string;
  seoScore: number | null;
  geoScore: number | null;
  aiVisibilityScore: number | null;
  coverage: number;
  confidence: number;
  rulesetVersion: string;
}

export interface AnalysisRunCompletedEvent extends BaseEvent {
  eventType: 'analysis.run.completed';
  analysisRunId: string;
  totalDurationMs: number;
  completedModules: string[];
  partialModules: string[];
  failedModules: string[];
}

export interface AnalysisRunCancelledEvent extends BaseEvent {
  eventType: 'analysis.run.cancelled';
  analysisRunId: string;
  requestedBy: string;
}

export type DomainEvent =
  | AnalysisRunCreatedEvent
  | AnalysisModuleStartedEvent
  | AnalysisModuleCompletedEvent
  | AnalysisModuleFailedEvent
  | AnalysisRunScoredEvent
  | AnalysisRunCompletedEvent
  | AnalysisRunCancelledEvent;

export type ModuleStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled' | 'skipped';

export interface ModuleProgress {
  moduleKey: string;
  moduleVersion: string;
  status: ModuleStatus;
  progress: number; // 0-100
  errorCode?: string;
  errorMessage?: string;
  startedAt?: string;
  completedAt?: string;
  attempt: number;
}

export type RunStatus =
  | 'queued'
  | 'running'
  | 'partial_complete'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface RunSummary {
  runId: string;
  status: RunStatus;
  progress: number;
  modules: ModuleProgress[];
  scores?: {
    seo: number | null;
    geo: number | null;
    aiVisibility: number | null;
    coverage: number;
    confidence: number;
  };
}