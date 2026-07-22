/**
 * HTTP Fetcher — Busca HTTP simples com controle de redirects, headers e timing
 *
 * @see docs/05_CRAWLER_E_ANALISADORES.md — Coleta HTTP
 */

import { validateUrl, validateRedirect, withTimeout } from './ssrf-guard';

export interface HttpFetchResult {
  url: string;
  finalUrl: string;
  statusCode: number;
  statusText: string;
  redirectChain: string[];
  headers: Record<string, string>;
  body: string | null;
  contentLength: number | null;
  contentType: string | null;
  timingDnsMs: number | null;
  timingConnectMs: number | null;
  timingTlsMs: number | null;
  timingTtfbMs: number | null;
  timingTotalMs: number | null;
  error?: string;
}

const MAX_REDIRECTS = 10;
const MAX_RESPONSE_SIZE = 10 * 1024 * 1024; // 10 MB
const TIMEOUT_MS = 20_000; // 20 s
const USER_AGENT = 'B2GEOSEOAnalyzerBot/1.0 (+https://b2-geo-seo-analyzer.example/bot)';

export async function fetchHttp(url: string): Promise<HttpFetchResult> {
  const startTime = Date.now();
  const redirectChain: string[] = [];
  let currentUrl = url;

  // Validate initial URL
  const initialValidation = await validateUrl(currentUrl);
  if (!initialValidation.valid) {
    return createErrorResult(url, currentUrl, redirectChain, initialValidation.reason ?? 'SSRF blocked');
  }

  for (let i = 0; i <= MAX_REDIRECTS; i++) {
    const result = await fetchSingle(currentUrl);

    if (result.error) {
      return { ...result, redirectChain };
    }

    // Check for redirect
    if (isRedirect(result.statusCode) && result.headers['location']) {
      const redirectUrl = resolveRedirectUrl(currentUrl, result.headers['location']);

      // Validate redirect target
      const redirectValidation = await validateRedirect(url, redirectUrl, i, MAX_REDIRECTS);
      if (!redirectValidation.valid) {
        return createErrorResult(url, currentUrl, redirectChain, redirectValidation.reason ?? 'SSRF blocked redirect');
      }

      redirectChain.push(currentUrl);
      currentUrl = redirectUrl;
      continue;
    }

    // Final response
    const timingTotalMs = Date.now() - startTime;
    return {
      ...result,
      redirectChain,
      timingTotalMs,
    };
  }

  return createErrorResult(url, currentUrl, redirectChain, 'Too many redirects');
}

async function fetchSingle(url: string): Promise<HttpFetchResult> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await withTimeout(
      fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'pt-BR,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate',
        },
        redirect: 'manual', // We handle redirects ourselves for SSRF validation
        signal: controller.signal,
      }),
      TIMEOUT_MS
    );

    clearTimeout(timeout);

    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      // Remove sensitive headers
      if (['set-cookie', 'authorization'].includes(key.toLowerCase())) return;
      headers[key] = value;
    });

    let body: string | null = null;
    const contentType = headers['content-type'] ?? null;

    if (response.status < 300 || response.status >= 400) {
      // Only read body for non-redirect responses
      const text = await response.text();
      body = text.substring(0, MAX_RESPONSE_SIZE);
    }

    return {
      url,
      finalUrl: url,
      statusCode: response.status,
      statusText: response.statusText,
      redirectChain: [],
      headers,
      body,
      contentLength: parseInt(headers['content-length'] ?? '0', 10) || null,
      contentType,
      timingDnsMs: null,
      timingConnectMs: null,
      timingTlsMs: null,
      timingTtfbMs: null,
      timingTotalMs: null,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown fetch error';
    return {
      url,
      finalUrl: url,
      statusCode: 0,
      statusText: 'Error',
      redirectChain: [],
      headers: {},
      body: null,
      contentLength: null,
      contentType: null,
      timingDnsMs: null,
      timingConnectMs: null,
      timingTlsMs: null,
      timingTtfbMs: null,
      timingTotalMs: null,
      error: message,
    };
  }
}

function isRedirect(statusCode: number): boolean {
  return [301, 302, 303, 307, 308].includes(statusCode);
}

function resolveRedirectUrl(baseUrl: string, location: string): string {
  try {
    return new URL(location, baseUrl).href;
  } catch {
    return location;
  }
}

function createErrorResult(
  originalUrl: string,
  finalUrl: string,
  redirectChain: string[],
  error: string
): HttpFetchResult {
  return {
    url: originalUrl,
    finalUrl,
    statusCode: 0,
    statusText: 'Error',
    redirectChain,
    headers: {},
    body: null,
    contentLength: null,
    contentType: null,
    timingDnsMs: null,
    timingConnectMs: null,
    timingTlsMs: null,
    timingTtfbMs: null,
    timingTotalMs: null,
    error,
  };
}