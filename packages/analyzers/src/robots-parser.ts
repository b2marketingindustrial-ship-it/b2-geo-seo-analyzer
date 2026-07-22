/**
 * Robots.txt Parser — Analisa arquivo robots.txt
 *
 * @see docs/05_CRAWLER_E_ANALISADORES.md — Robots.txt
 */

import type { RobotsFact, RobotsRuleFact } from "@b2/contracts";

export function parseRobotsTxt(
  content: string,
  url: string,
  fetchDurationMs: number
): RobotsFact {
  const lines = content.split(/\r?\n/);
  const rules: RobotsRuleFact[] = [];
  const sitemapUrls: string[] = [];
  let currentUserAgent = "*";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!.trim();
    const lineNumber = i + 1;

    // Skip comments and empty lines
    if (line === "" || line.startsWith("#")) continue;

    const colonIndex = line.indexOf(":");
    if (colonIndex === -1) continue;

    const directive = line.substring(0, colonIndex).trim().toLowerCase();
    const value = line.substring(colonIndex + 1).trim();

    switch (directive) {
      case "user-agent":
        currentUserAgent = value;
        break;
      case "allow":
        rules.push({
          userAgent: currentUserAgent,
          directive: "allow",
          path: value,
          lineNumber,
        });
        break;
      case "disallow":
        rules.push({
          userAgent: currentUserAgent,
          directive: "disallow",
          path: value,
          lineNumber,
        });
        break;
      case "sitemap":
        sitemapUrls.push(value);
        break;
    }
  }

  return {
    url,
    status: "present",
    fetchDurationMs,
    rules,
    sitemapUrls,
    rawContentHash: null,
  };
}