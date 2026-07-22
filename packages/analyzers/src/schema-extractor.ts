/**
 * Schema Extractor — Extrai dados estruturados (JSON-LD, microdata, RDFa) do HTML
 */

import type { StructuredDataFact } from "@b2/contracts";

export function extractSchemas(html: string): StructuredDataFact[] {
  const schemas: StructuredDataFact[] = [];

  // Extract JSON-LD
  const jsonLdRegex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = jsonLdRegex.exec(html)) !== null) {
    const rawText = match[1]!.trim();
    try {
      const parsed = JSON.parse(rawText);
      const items = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of items) {
        schemas.push({
          type: "json-ld",
          schemaType: item["@type"] ?? "Unknown",
          properties: item,
          rawText,
          parseError: null,
          isValid: true,
        });
      }
    } catch {
      schemas.push({
        type: "json-ld",
        schemaType: "Unknown",
        properties: {},
        rawText,
        parseError: "Invalid JSON",
        isValid: false,
      });
    }
  }

  // Extract microdata (itemtype/itemprop)
  const microdataRegex = /<[^>]+itemtype=["']([^"']+)["'][^>]*>/gi;
  while ((match = microdataRegex.exec(html)) !== null) {
    const schemaType = match[1]!.split("/").pop() ?? match[1]!;
    const props: Record<string, unknown> = {};

    // Extract itemprops within scope (simplified)
    const itempropRegex = /itemprop=["']([^"']+)["'][^>]*>([^<]*)</gi;
    let propMatch;
    while ((propMatch = itempropRegex.exec(html)) !== null) {
      props[propMatch[1]!] = propMatch[2]!.trim();
    }

    schemas.push({
      type: "microdata",
      schemaType,
      properties: props,
      rawText: match[0],
      parseError: null,
      isValid: true,
    });
  }

  return schemas;
}