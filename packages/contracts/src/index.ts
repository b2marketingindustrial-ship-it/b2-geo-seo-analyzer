/**
 * @b2/contracts — Contratos compartilhados do B2 GEO/SEO Analyzer
 */

// Facts
export type {
  HttpRequestFact,
  HttpHeaderFact,
  RobotsRuleFact,
  RobotsFact,
  SitemapEntryFact,
  SitemapFact,
  MetadataFact,
  HeadingFact,
  LinkFact,
  ImageFact,
  StructuredDataFact,
  TextBlockFact,
  ContactFact,
  LighthouseFact,
  EntityFact,
  ClaimFact,
  NormalizedFacts,
} from './facts';

// Findings
export type {
  FindingState,
  Severity,
  ScoreType,
  EvaluationType,
  EvidenceType,
  Evidence,
  Finding,
  FindingEvaluation,
  ComparisonState,
  FindingComparison,
} from './findings';

// Scores
export type {
  RuleCondition,
  ScoringRule,
  ScoreCategory,
  CriticalGate,
  ScoreResult,
  DiscoverabilityScore,
  Ruleset,
  ScoreComparison,
} from './scores';

// Events
export type {
  EventType,
  BaseEvent,
  AnalysisRunCreatedEvent,
  AnalysisModuleStartedEvent,
  AnalysisModuleCompletedEvent,
  AnalysisModuleFailedEvent,
  AnalysisRunScoredEvent,
  AnalysisRunCompletedEvent,
  AnalysisRunCancelledEvent,
  DomainEvent,
  ModuleStatus,
  ModuleProgress,
  RunStatus,
  RunSummary as EventRunSummary,
} from './events';

// Extension
export type {
  DocumentFacts,
  LocalFinding,
  ExtensionPageSnapshot,
  SelectorCandidate,
  ElementFingerprint,
  HighlightRequest,
  ExtensionMessage,
  RunSummary,
  AuthState,
  PanelState,
} from './extension';

// Action Plan
export type {
  Discipline,
  ActionPriority,
  ActionItemStatus,
  ActionItemSourceType,
  ActionPlan,
  ActionItem,
  ActionItemComment,
  PriorityInput,
  ActionPlanFilters,
} from './action-plan';
export { calculatePriorityScore, toActionPriority } from './action-plan';