/**
 * Metadata Extractor — Extrai metadados do HTML/DOM
 */

import type { MetadataFact } from "@b2/contracts";

export function extractMetadata(html: string, url: string): MetadataFact {
  const getMeta = (name: string, attr = "name"): string | null => {
    const regex = new RegExp(
      `<meta[^>]+${attr}=["']${name}["'][^>]+content=["']([^"']+)["']`,
      "i"
    );
    const match = html.match(regex);
    if (match) return match[1] ?? null;

    // Try content first, then name
    const regex2 = new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+${attr}=["']${name}["']`,
      "i"
    );
    const match2 = html.match(regex2);
    if (match2) return match2[1] ?? null;

    return null;
  };

  const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
  const title = titleMatch?.[1]?.trim() ?? null;

  const canonicalMatch = html.match(
    /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i
  );
  const canonical =
    canonicalMatch?.[1] ?? null;

  const langMatch = html.match(/<html[^>]+lang=["']([^"']+)["']/i);
  const language = langMatch?.[1] ?? null;

  const charsetMatch = html.match(/charset=["']?([^"'\s>]+)/i);
  const charset = charsetMatch?.[1] ?? null;

  const hreflangMatches = html.matchAll(
    /<link[^>]+rel=["']alternate["'][^>]+hreflang=["']([^"']+)["'][^>]+href=["']([^"']+)["']/gi
  );
  const hreflang: { lang: string; url: string }[] = [];
  for (const m of hreflangMatches) {
    if (m[1] && m[2]) hreflang.push({ lang: m[1], url: m[2] });
  }

  return {
    title,
    titleLength: title?.length ?? 0,
    description: getMeta("description"),
    descriptionLength: getMeta("description")?.length ?? 0,
    robots: getMeta("robots"),
    viewport: getMeta("viewport"),
    canonical,
    hreflang,
    ogTitle: getMeta("og:title", "property"),
    ogDescription: getMeta("og:description", "property"),
    ogImage: getMeta("og:image", "property"),
    ogType: getMeta("og:type", "property"),
    twitterCard: getMeta("twitter:card"),
    favicon: null,
    themeColor: getMeta("theme-color"),
    language,
    charset,
  };
}