/**
 * SSRF Guard — Proteção contra Server-Side Request Forgery
 *
 * @see docs/05_CRAWLER_E_ANALISADORES.md — Segurança contra SSRF
 *
 * 8 validações antes de cada request:
 * 1. Validar esquema http ou https
 * 2. Normalizar hostname
 * 3. Resolver DNS
 * 4. Bloquear loopback, link-local, multicast, redes privadas, metadados de nuvem
 * 5. Repetir validação a cada redirect
 * 6. Limitar redirects
 * 7. Bloquear portas não permitidas
 * 8. Aplicar timeout
 */

import { resolve4, resolve6 } from 'dns/promises';
import { URL } from 'url';

// ──── Blocked IP ranges ────

const BLOCKED_IPV4_RANGES = [
  // Loopback
  { start: ipToInt('127.0.0.0'), end: ipToInt('127.255.255.255') },
  // Link-local
  { start: ipToInt('169.254.0.0'), end: ipToInt('169.254.255.255') },
  // Private
  { start: ipToInt('10.0.0.0'), end: ipToInt('10.255.255.255') },
  { start: ipToInt('172.16.0.0'), end: ipToInt('172.31.255.255') },
  { start: ipToInt('192.168.0.0'), end: ipToInt('192.168.255.255') },
  // Multicast
  { start: ipToInt('224.0.0.0'), end: ipToInt('239.255.255.255') },
  // Cloud metadata (AWS, GCP, Azure)
  { start: ipToInt('169.254.169.254'), end: ipToInt('169.254.169.254') },
];

const BLOCKED_IPV6_RANGES = [
  '::1',       // Loopback
  'fe80::',    // Link-local
  'fc00::',    // Unique local
  'fd00::',    // Unique local
  'ff00::',    // Multicast
];

// ──── Allowed ports ────

const ALLOWED_PORTS = new Set([80, 443, 8080, 8443]);

// ──── Types ────

export interface SsrfValidationResult {
  valid: boolean;
  reason?: string;
}

// ──── Core validation ────

export async function validateUrl(url: string): Promise<SsrfValidationResult> {
  // 1. Validar esquema
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { valid: false, reason: `Invalid URL: ${url}` };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { valid: false, reason: `Unsupported protocol: ${parsed.protocol}` };
  }

  // 2. Hostname
  const hostname = parsed.hostname.toLowerCase();

  // 7. Portas
  const port = parsed.port ? parseInt(parsed.port, 10) : parsed.protocol === 'https:' ? 443 : 80;
  if (!ALLOWED_PORTS.has(port)) {
    return { valid: false, reason: `Port not allowed: ${port}` };
  }

  // 3. Resolver DNS
  let ips: string[] = [];
  try {
    ips = await resolveDns(hostname);
  } catch {
    return { valid: false, reason: `DNS resolution failed for: ${hostname}` };
  }

  // 4. Validar IPs contra ranges bloqueados
  for (const ip of ips) {
    if (!isIpAllowed(ip)) {
      return { valid: false, reason: `IP blocked (private/reserved): ${ip}` };
    }
  }

  return { valid: true };
}

export async function validateRedirect(
  originalUrl: string,
  redirectUrl: string,
  redirectCount: number,
  maxRedirects: number
): Promise<SsrfValidationResult> {
  // 6. Limitar redirects
  if (redirectCount >= maxRedirects) {
    return { valid: false, reason: `Too many redirects: ${redirectCount}` };
  }

  // 5. Repetir validação a cada redirect
  return validateUrl(redirectUrl);
}

// ──── DNS resolution ────

async function resolveDns(hostname: string): Promise<string[]> {
  const ips: string[] = [];
  try {
    const v4 = await resolve4(hostname);
    ips.push(...v4);
  } catch { /* IPv4 may not be available */ }
  try {
    const v6 = await resolve6(hostname);
    ips.push(...v6);
  } catch { /* IPv6 may not be available */ }
  return ips;
}

// ──── IP validation ────

function isIpAllowed(ip: string): boolean {
  if (ip.includes(':')) {
    return isIpv6Allowed(ip);
  }
  return isIpv4Allowed(ip);
}

function isIpv4Allowed(ip: string): boolean {
  const ipInt = ipToInt(ip);
  for (const range of BLOCKED_IPV4_RANGES) {
    if (ipInt >= range.start && ipInt <= range.end) {
      return false;
    }
  }
  return true;
}

function isIpv6Allowed(ip: string): boolean {
  const normalized = ip.toLowerCase();
  for (const blocked of BLOCKED_IPV6_RANGES) {
    if (normalized.startsWith(blocked)) {
      return false;
    }
  }
  // Check ::1
  if (normalized === '::1') return false;
  // Check IPv4-mapped in IPv6
  if (normalized.startsWith('::ffff:')) {
    const v4Part = normalized.substring(7);
    return isIpv4Allowed(v4Part);
  }
  return true;
}

function ipToInt(ip: string): number {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4) return 0;
  return ((parts[0]! * 256 + parts[1]!) * 256 + parts[2]!) * 256 + parts[3]!;
}

// ──── Timing helper ────

export function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
    ),
  ]);
}