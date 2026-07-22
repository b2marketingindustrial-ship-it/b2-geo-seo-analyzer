/**
 * Contratos específicos da Extensão Chrome
 *
 * @see docs/04_EXTENSAO_CHROME.md
 */

import type { MetadataFact, HeadingFact, TextBlockFact, LinkFact, ImageFact, StructuredDataFact, ContactFact } from './facts';
import type { Finding } from './findings';

// ──── Page Snapshot (payload enviado pela extensão) ────

export interface DocumentFacts {
  url: string;
  origin: string;
  title: string;
  language: string | null;
  charset: string | null;
  viewport: string | null;
  capturedAt: string;
  readyState: string;
  domSize: number;
}

export interface LocalFinding {
  ruleKey: string;
  status: 'PASS' | 'FAIL' | 'WARN' | 'INFO';
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  evidenceSelector?: string;
  evidenceExcerpt?: string;
}

export interface ExtensionPageSnapshot {
  schemaVersion: '1.0';
  capturedAt: string;
  url: string;
  document: DocumentFacts;
  metadata: MetadataFact;
  headings: HeadingFact[];
  textBlocks: TextBlockFact[];
  links: LinkFact[];
  images: ImageFact[];
  schemas: StructuredDataFact[];
  contacts: ContactFact[];
  localFindings: LocalFinding[];
  collectionWarnings: string[];
}

// ──── Highlight ────

export interface SelectorCandidate {
  strategy: 'id' | 'attribute' | 'class_combination' | 'landmark_path' | 'nth_of_type';
  selector: string;
  priority: number;
}

export interface ElementFingerprint {
  tag: string;
  normalizedText: string;
  classes: string[];
  attributes: Record<string, string>;
  relativePosition: number;
}

export interface HighlightRequest {
  selectorCandidates: SelectorCandidate[];
  fingerprint: ElementFingerprint;
  findingId: string;
}

// ──── Extension Messages (tipos de mensagem entre service worker, side panel e content script) ────

export type ExtensionMessage =
  | { type: 'CAPTURE_PAGE_REQUEST' }
  | { type: 'CAPTURE_PAGE_RESULT'; payload: ExtensionPageSnapshot }
  | { type: 'HIGHLIGHT_ELEMENT'; payload: HighlightRequest }
  | { type: 'ANALYSIS_STATUS_CHANGED'; payload: RunSummary }
  | { type: 'AUTH_STATE_CHANGED'; payload: AuthState };

export interface RunSummary {
  runId: string;
  status: 'queued' | 'running' | 'partial_complete' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  seoScore: number | null;
  geoScore: number | null;
  aiVisibilityScore: number | null;
  findingsCount: number;
  criticalCount: number;
}

export interface AuthState {
  authenticated: boolean;
  organizationId: string | null;
  projectId: string | null;
  userEmail: string | null;
}

// ──── Side Panel UI State ────

export type PanelState =
  | 'not_authenticated'
  | 'no_project'
  | 'ready'
  | 'collecting'
  | 'local_result_available'
  | 'processing'
  | 'completed'
  | 'partial'
  | 'error'
  | 'unsupported';