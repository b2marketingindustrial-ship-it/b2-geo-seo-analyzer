/**
 * B2 GEO/SEO Analyzer — Worker Crawler
 *
 * Ponto de entrada do worker de crawl.
 *
 * Responsável por:
 * - Validar URLs (SSRF protection)
 * - Buscar HTML via HTTP (com redirects)
 * - Renderizar com Playwright (opcional)
 * - Extrair fatos normalizados (Facts Layer)
 * - Verificar robots.txt
 */

export { validateUrl, validateRedirect } from './ssrf-guard';
export { fetchHttp } from './http-fetcher';
export type { HttpFetchResult } from './http-fetcher';
export { collectPageFacts } from './page-collector';
export type { PageCollectionResult } from './page-collector';