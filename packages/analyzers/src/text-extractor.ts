/**
 * Text Extractor — Extrai blocos de texto visível do HTML
 */

import type { TextBlockFact } from "@b2/contracts";

export function extractTextBlocks(html: string): TextBlockFact[] {
  const blocks: TextBlockFact[] = [];

  // Extrair texto de landmarks principais
  const landmarks = [
    { tag: "main", section: "main" },
    { tag: "header", section: "header" },
    { tag: "footer", section: "footer" },
    { tag: "nav", section: "nav" },
    { tag: "article", section: "article" },
    { tag: "aside", section: "aside" },
  ];

  for (const { tag, section } of landmarks) {
    const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "gi");
    let match;
    while ((match = regex.exec(html)) !== null) {
      const text = stripHtml(match[1]!).trim();
      if (text.length > 10) {
        blocks.push({
          section,
          text,
          textNormalized: text.toLowerCase().replace(/\s+/g, " "),
          textLength: text.length,
          wordCount: text.split(/\s+/).length,
          landmark: tag,
        });
      }
    }
  }

  // Extrair texto de parágrafos e seções (fallback)
  const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  let pMatch;
  while ((pMatch = pRegex.exec(html)) !== null) {
    const text = stripHtml(pMatch[1]!).trim();
    if (text.length > 20) {
      blocks.push({
        section: "content",
        text,
        textNormalized: text.toLowerCase().replace(/\s+/g, " "),
        textLength: text.length,
        wordCount: text.split(/\s+/).length,
        landmark: null,
      });
    }
  }

  return blocks;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}