/**
 * Images Extractor — Extrai informações de imagens do HTML
 */

import type { ImageFact } from "@b2/contracts";

export function extractImages(html: string): ImageFact[] {
  const images: ImageFact[] = [];
  const regex = /<img[^>]+>/gi;
  let match;

  while ((match = regex.exec(html)) !== null) {
    const tag = match[0];

    const src = extractAttr(tag, "src") ?? "";
    const alt = extractAttr(tag, "alt");
    const width = parseIntSafe(extractAttr(tag, "width"));
    const height = parseIntSafe(extractAttr(tag, "height"));
    const loading = (extractAttr(tag, "loading") as ImageFact["loading"]) ?? "auto";
    const srcset = extractAttr(tag, "srcset");

    // Infer format from src extension
    const formatMatch = src.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)(\?|$)/i);
    const format = formatMatch?.[1]?.toLowerCase() ?? null;

    // Infer decorative from alt (empty alt on img with no ARIA role is decorative)
    const isDecorative = alt === "" ? true : alt === null ? null : false;

    images.push({
      src,
      resolvedSrc: src,
      alt: alt ?? null,
      altLength: alt?.length ?? 0,
      width: width ?? null,
      height: height ?? null,
      renderedWidth: width ?? null,
      renderedHeight: height ?? null,
      loading,
      srcset: srcset ?? null,
      format,
      isDecorative,
      isVisible: true, // Cannot determine from raw HTML
    });
  }

  return images;
}

function extractAttr(tag: string, attr: string): string | undefined {
  const regex = new RegExp(`${attr}=["']([^"']*)["']`, "i");
  const match = tag.match(regex);
  return match?.[1] ?? undefined;
}

function parseIntSafe(value: string | undefined): number | undefined {
  if (value === undefined) return undefined;
  const n = parseInt(value, 10);
  return isNaN(n) ? undefined : n;
}