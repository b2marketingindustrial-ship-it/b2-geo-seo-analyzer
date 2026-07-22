/**
 * Page Collector — Coleta completa de página via HTTP + Playwright render + facts
 *
 * @see docs/05_CRAWLER_E_ANALISADORES.md — Renderização Playwright
 */

import type { NormalizedFacts, HttpRequestFact, HttpHeaderFact, RobotsFact } from '@b2/contracts';
import { extractMetadata, extractHeadings, extractLinks, extractImages, extractSchemas, extractTextBlocks } from '@b2/analyzers';
import { fetchHttp, HttpFetchResult } from './http-fetcher';

export interface PageCollectionResult {
  facts: NormalizedFacts;
  httpResult: HttpFetchResult;
  warnings: string[];
}

const DEFAULT_VIEWPORT = { width: 1280, height: 720 };

export async function collectPageFacts(
  url: string,
  options?: {
    usePlaywright?: boolean; // No MVP, Playwright é opcional (requer browser instalado)
  }
): Promise<PageCollectionResult> {
  const warnings: string[] = [];

  // 1. HTTP fetch (obrigatório)
  const httpResult = await fetchHttp(url);
  if (httpResult.error) {
    return {
      facts: createEmptyFacts(url, 'backend_http'),
      httpResult,
      warnings: [`HTTP fetch failed: ${httpResult.error}`],
    };
  }

  const html = httpResult.body ?? '';

  // 2. Extrair fatos do HTML
  const metadata = extractMetadata(html, httpResult.finalUrl);
  const headings = extractHeadings(html);
  const links = extractLinks(html, { baseUrl: httpResult.finalUrl });
  const images = extractImages(html);
  const schemas = extractSchemas(html);
  const textBlocks = extractTextBlocks(html);

  // 3. Montar HttpRequestFact
  const httpFact: HttpRequestFact = {
    url,
    finalUrl: httpResult.finalUrl,
    statusCode: httpResult.statusCode,
    statusText: httpResult.statusText,
    redirectChain: httpResult.redirectChain,
    contentLength: httpResult.contentLength,
    contentType: httpResult.contentType,
    compression: httpResult.headers['content-encoding'] ?? null,
    timingDnsMs: httpResult.timingDnsMs,
    timingConnectMs: httpResult.timingConnectMs,
    timingTlsMs: httpResult.timingTlsMs,
    timingTtfbMs: httpResult.timingTtfbMs,
    timingTotalMs: httpResult.timingTotalMs,
  };

  const httpHeaders: HttpHeaderFact[] = Object.entries(httpResult.headers).map(
    ([name, value]) => ({ name, value })
  );

  // 4. Robots.txt (resolvido da origin, não incluído aqui — é um módulo separado)
  const robots: RobotsFact | null = null;

  // 5. Playwright render (opcional no MVP)
  if (options?.usePlaywright) {
    try {
      // Dynamic import para não quebrar quem não tem Playwright instalado
      const { chromium } = await import('playwright');
      const browser = await chromium.launch({ headless: true });
      const page = await browser.newPage();
      await page.setViewportSize(DEFAULT_VIEWPORT);

      await page.goto(httpResult.finalUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 45_000,
      });

      // Aguardar estabilização (network idle por 2s)
      try {
        await page.waitForLoadState('networkidle', { timeout: 10_000 });
      } catch {
        warnings.push('Playwright: network idle not reached within 10s');
      }

      const renderedHtml = await page.content();
      await browser.close();

      // Extrair fatos do DOM renderizado (complementa os fatos do HTML source)
      const renderedHeadings = extractHeadings(renderedHtml);

      // Merge: preferir rendered quando houver diferença (ex: conteúdo JS)
      if (renderedHeadings.length > headings.length) {
        warnings.push(`Playwright detected ${renderedHeadings.length - headings.length} additional headings after JS render`);
      }

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      warnings.push(`Playwright render failed: ${message}`);
    }
  }

  // 6. Montar NormalizedFacts
  const facts: NormalizedFacts = {
    schemaVersion: '1.0',
    collectedAt: new Date().toISOString(),
    url: httpResult.finalUrl,
    captureSource: 'backend_http',
    http: httpFact,
    httpHeaders,
    robots,
    sitemap: null,
    metadata,
    headings,
    textBlocks,
    links,
    images,
    schemas,
    contacts: [],
    lighthouse: null,
    entities: [],
    claims: [],
    collectionWarnings: warnings,
    sourceHtmlHash: null,
    renderedDomHash: null,
  };

  return { facts, httpResult, warnings };
}

function createEmptyFacts(
  url: string,
  captureSource: NormalizedFacts['captureSource']
): NormalizedFacts {
  return {
    schemaVersion: '1.0',
    collectedAt: new Date().toISOString(),
    url,
    captureSource,
    http: null,
    httpHeaders: [],
    robots: null,
    sitemap: null,
    metadata: {
      title: null, titleLength: 0, description: null, descriptionLength: 0,
      robots: null, viewport: null, canonical: null, hreflang: [],
      ogTitle: null, ogDescription: null, ogImage: null, ogType: null,
      twitterCard: null, favicon: null, themeColor: null,
      language: null, charset: null,
    },
    headings: [],
    textBlocks: [],
    links: [],
    images: [],
    schemas: [],
    contacts: [],
    lighthouse: null,
    entities: [],
    claims: [],
    collectionWarnings: [],
    sourceHtmlHash: null,
    renderedDomHash: null,
  };
}