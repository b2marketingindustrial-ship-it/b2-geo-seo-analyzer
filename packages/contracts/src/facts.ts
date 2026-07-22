/**
 * Facts Layer — NormalizedFacts
 *
 * Os coletores produzem fatos padronizados antes das regras.
 * Cada fato representa uma dimensão observável da página/domínio.
 *
 * @see docs/03_ARQUITETURA.md — Facts layer
 * @see docs/05_CRAWLER_E_ANALISADORES.md — Extratores de facts
 */

// ──── HTTP ────

export interface HttpRequestFact {
  url: string;
  finalUrl: string;
  statusCode: number;
  statusText: string;
  redirectChain: string[];
  contentLength: number | null;
  contentType: string | null;
  compression: string | null;
  timingDnsMs: number | null;
  timingConnectMs: number | null;
  timingTlsMs: number | null;
  timingTtfbMs: number | null;
  timingTotalMs: number | null;
}

export interface HttpHeaderFact {
  name: string;
  value: string;
}

// ──── Robots ────

export interface RobotsRuleFact {
  userAgent: string;
  directive: 'allow' | 'disallow';
  path: string;
  lineNumber: number;
}

export interface RobotsFact {
  url: string;
  status: 'present' | 'absent' | 'error' | 'timeout';
  fetchDurationMs: number;
  rules: RobotsRuleFact[];
  sitemapUrls: string[];
  rawContentHash: string | null;
}

// ──── Sitemap ────

export interface SitemapEntryFact {
  url: string;
  lastModified: string | null;
  changeFrequency: string | null;
  priority: number | null;
}

export interface SitemapFact {
  urls: SitemapEntryFact[];
  sitemapUrls: string[];
  parseErrors: string[];
  totalEntries: number;
  discoverMethod: 'robots' | 'known_url' | 'user_provided';
}

// ──── Metadados ────

export interface MetadataFact {
  title: string | null;
  titleLength: number;
  description: string | null;
  descriptionLength: number;
  robots: string | null;
  viewport: string | null;
  canonical: string | null;
  hreflang: { lang: string; url: string }[];
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  ogType: string | null;
  twitterCard: string | null;
  favicon: string | null;
  themeColor: string | null;
  language: string | null;
  charset: string | null;
}

// ──── Headings ────

export interface HeadingFact {
  tag: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  text: string;
  textNormalized: string;
  textLength: number;
  order: number;
}

// ──── Links ────

export interface LinkFact {
  href: string;
  resolvedHref: string;
  anchorText: string;
  isInternal: boolean;
  isExternal: boolean;
  rel: string[];
  target: string | null;
  isVisible: boolean;
  element: 'a' | 'area' | 'link';
}

// ──── Imagens ────

export interface ImageFact {
  src: string;
  resolvedSrc: string;
  alt: string | null;
  altLength: number;
  width: number | null;
  height: number | null;
  renderedWidth: number | null;
  renderedHeight: number | null;
  loading: 'eager' | 'lazy' | 'auto';
  srcset: string | null;
  format: string | null;
  isDecorative: boolean | null;
  isVisible: boolean;
}

// ──── Schemas / JSON-LD ────

export interface StructuredDataFact {
  type: 'json-ld' | 'microdata' | 'rdfa';
  schemaType: string;
  properties: Record<string, unknown>;
  rawText: string;
  parseError: string | null;
  isValid: boolean;
}

// ──── Conteúdo visível ────

export interface TextBlockFact {
  section: string;
  text: string;
  textNormalized: string;
  textLength: number;
  wordCount: number;
  landmark: string | null;
}

// ──── Contato / Identidade ────

export interface ContactFact {
  type: 'phone' | 'email' | 'address' | 'whatsapp' | 'social' | 'form';
  value: string;
  context: string;
  isVisible: boolean;
}

// ──── Performance / Lighthouse ────

export interface LighthouseFact {
  device: 'mobile' | 'desktop';
  lighthouseVersion: string;
  performanceScore: number;
  accessibilityScore: number;
  bestPracticesScore: number;
  seoScore: number;
  lcp: number | null;
  fid: number | null;
  tbt: number | null;
  cls: number | null;
  si: number | null;
  ttfb: number | null;
  totalByteWeight: number | null;
  jsByteWeight: number | null;
  imageByteWeight: number | null;
  fontByteWeight: number | null;
  cssByteWeight: number | null;
}

// ──── Entidades ────

export interface EntityFact {
  type: 'organization' | 'brand' | 'product' | 'service' | 'region' | 'sector'
    | 'application' | 'norm' | 'person' | 'certification' | 'case_study';
  name: string;
  normalizedName: string;
  aliases: string[];
  occurrences: number;
  positions: string[];
}

// ──── Claims ────

export interface ClaimFact {
  text: string;
  classification: 'factual' | 'comparative' | 'quantitative' | 'certification_partnership' | 'commercial_opinion';
  hasEvidenceOnPage: boolean;
  evidenceExcerpts: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

// ──── Facts container ────

export interface NormalizedFacts {
  /** Schema version for forward/backward compatibility */
  schemaVersion: string;
  /** UTC ISO 8601 */
  collectedAt: string;
  /** Full URL analyzed */
  url: string;
  /** Origin scope (extension | backend) */
  captureSource: 'extension' | 'backend_http' | 'backend_rendered' | 'backend_lighthouse';

  // Core facts
  http: HttpRequestFact | null;
  httpHeaders: HttpHeaderFact[];
  robots: RobotsFact | null;
  sitemap: SitemapFact | null;
  metadata: MetadataFact;
  headings: HeadingFact[];
  textBlocks: TextBlockFact[];
  links: LinkFact[];
  images: ImageFact[];
  schemas: StructuredDataFact[];
  contacts: ContactFact[];
  lighthouse: LighthouseFact | null;

  // Semantic facts
  entities: EntityFact[];
  claims: ClaimFact[];

  // Warnings from collection process
  collectionWarnings: string[];

  // Raw checksums for reproducibility
  sourceHtmlHash: string | null;
  renderedDomHash: string | null;
}