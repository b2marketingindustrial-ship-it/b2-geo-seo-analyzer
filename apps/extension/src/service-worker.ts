/**
 * B2 GEO/SEO Analyzer — Service Worker (Chrome Manifest V3)
 *
 * Responsável por: abrir side panel, gerenciar autenticação (stub),
 * coordenar mensagens com content script e API backend.
 */

// ──── Side Panel ────

chrome.action.onClicked.addListener((tab) => {
  if (!tab.id) return;
  chrome.sidePanel.open({ windowId: tab.windowId });
});

// ──── Message Handler ────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const msg = message as { type: string; payload?: unknown };

  switch (msg.type) {
    case 'CAPTURE_PAGE_REQUEST':
      handleCapturePage(sender.tab?.id ?? null)
        .then(sendResponse)
        .catch((err) => sendResponse({ error: err.message }));
      return true; // Keep channel open for async response

    case 'SEND_TO_BACKEND': {
      const payload = (msg.payload ?? {}) as {
        url: string;
        snapshot: unknown;
      };
      handleSendToBackend(payload.url, payload.snapshot)
        .then(sendResponse)
        .catch((err) => sendResponse({ error: err.message }));
      return true;
    }

    default:
      return false;
  }
});

// ──── Capture Page via Content Script ────

async function handleCapturePage(tabId: number | null) {
  if (!tabId) {
    return { error: 'No active tab' };
  }

  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: collectPageFacts,
    });

    return results[0]?.result ?? { error: 'Failed to collect facts' };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { error: message };
  }
}

// ──── Send to Backend API ────

async function handleSendToBackend(url: string, snapshot: unknown) {
  const API_URL = 'http://localhost:3001';

  try {
    const res = await fetch(`${API_URL}/v1/extension/page-captures`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url,
        snapshot,
        schemaVersion: '1.0',
      }),
    });

    const data = await res.json();

    // Start analysis
    const analysisRes = await fetch(
      `${API_URL}/v1/extension/page-captures/${data.id}/analysis`,
      { method: 'POST' }
    );
    const analysisData = await analysisRes.json();

    return { id: analysisData.id, status: 'queued' };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Network error';
    return { error: `Backend connection failed: ${message}` };
  }
}

// ──── Page Facts Collector (executado no contexto da página) ────

function collectPageFacts() {
  const facts: Record<string, unknown> = {};

  // Document info
  facts.url = window.location.href;
  facts.title = document.title;
  facts.language = document.documentElement.lang || null;

  // Meta tags
  const metaDescription = document.querySelector('meta[name="description"]');
  const metaRobots = document.querySelector('meta[name="robots"]');
  const canonical = document.querySelector('link[rel="canonical"]');

  facts.metaDescription = metaDescription?.getAttribute('content') ?? null;
  facts.metaRobots = metaRobots?.getAttribute('content') ?? null;
  facts.canonical = canonical?.getAttribute('href') ?? null;

  // Headings (no content — apenas contagem e primeiros textos por razões de privacidade)
  const h1s = Array.from(document.querySelectorAll('h1')).map((h) =>
    h.textContent?.trim().substring(0, 200) ?? ''
  );
  facts.h1 = h1s;
  facts.h1Count = h1s.length;

  // Images (apenas alt text, sem src para evitar dados sensíveis)
  const imgs = Array.from(document.querySelectorAll('img'));
  facts.imageCount = imgs.length;
  facts.imagesWithoutAlt = imgs.filter(
    (img) => !img.hasAttribute('alt') || img.getAttribute('alt') === ''
  ).length;

  // JSON-LD
  const jsonLdScripts = Array.from(
    document.querySelectorAll('script[type="application/ld+json"]')
  );
  facts.jsonLdCount = jsonLdScripts.length;

  // Links
  facts.linkCount = document.querySelectorAll('a[href]').length;

  // Collection metadata
  facts.capturedAt = new Date().toISOString();
  facts.domSize = document.getElementsByTagName('*').length;

  return facts;
}