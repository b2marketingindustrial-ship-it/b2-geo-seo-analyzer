/**
 * Links Extractor — Extrai links de HTML
 */

import type { LinkFact } from "@b2/contracts";

export interface LinkExtractOptions {
  baseUrl: string;
}

export function extractLinks(html: string, options: LinkExtractOptions): LinkFact[] {
  const links: LinkFact[] = [];
  const regex = /<a[^>]+href=["']([^"']+)["']([^>]*)>/gi;
  let match;

  while ((match = regex.exec(html)) !== null) {
    const href = match[1]!;
    const attrs = match[2]!;

    // Extract anchor text
    const endTagPos = html.indexOf("</a>", regex.lastIndex);
    const innerContent = endTagPos > regex.lastIndex
      ? html.substring(regex.lastIndex, endTagPos)
      : "";
    const anchorText = innerContent.replace(/<[^>]+>/g, "").trim() || href;

    // Extract rel
    const relMatch = attrs.match(/rel=["']([^"']+)["']/i);
    const rel = relMatch?.[1]?.split(/\s+/) ?? [];

    // Extract target
    const targetMatch = attrs.match(/target=["']([^"']+)["']/i);
    const target = targetMatch?.[1] ?? null;

    // Determine if internal
    const resolvedHref = resolveUrl(href, options.baseUrl);
    const isInternal = isSameOrigin(resolvedHref, options.baseUrl);

    links.push({
      href,
      resolvedHref,
      anchorText,
      isInternal,
      isExternal: !isInternal,
      rel,
      target,
      isVisible: true, // Cannot determine from raw HTML; requires DOM
      element: "a",
    });
  }

  return links;
}

function resolveUrl(href: string, baseUrl: string): string {
  try {
    return new URL(href, baseUrl).href;
  } catch {
    return href;
  }
}

function isSameOrigin(url1: string, url2: string): boolean {
  try {
    const u1 = new URL(url1);
    const u2 = new URL(url2);
    return u1.origin === u2.origin;
  } catch {
    return false;
  }
}