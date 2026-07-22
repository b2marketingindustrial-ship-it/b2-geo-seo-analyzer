/**
 * Headings Extractor — Extrai headings (h1–h6) do HTML
 */

import type { HeadingFact } from "@b2/contracts";

export function extractHeadings(html: string): HeadingFact[] {
  const headings: HeadingFact[] = [];
  const regex = /<h([1-6])[^>]*>([^<]*)<\/h\1>/gi;
  let match;
  let order = 0;

  while ((match = regex.exec(html)) !== null) {
    const level = parseInt(match[1]!, 10);
    const text = match[2]!.replace(/<[^>]+>/g, "").trim();
    const normalized = text.toLowerCase().replace(/\s+/g, " ");

    headings.push({
      tag: `h${level}` as HeadingFact["tag"],
      text,
      textNormalized: normalized,
      textLength: text.length,
      order: order++,
    });
  }

  return headings;
}