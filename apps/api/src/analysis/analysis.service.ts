import { Injectable, Logger } from '@nestjs/common';
import { loadRuleset, evaluateRule, calculateScore, generateActionItems, compareScores } from '@b2/scoring-engine';
import { extractMetadata, extractHeadings, extractLinks, extractImages, extractSchemas, extractTextBlocks, parseRobotsTxt } from '@b2/analyzers';
import type { NormalizedFacts, FindingEvaluation, ScoreResult, ActionItem, ScoreComparison, FindingState, Evidence } from '@b2/contracts';
import { AISemanticService } from './ai-semantic.service';

// ── AI Bot Definitions ──
const AI_BOTS = [
  { name: 'GPTBot', userAgent: 'GPTBot', ruleKey: 'geo.access.gptbot_allowed' },
  { name: 'ChatGPT-User', userAgent: 'ChatGPT-User', ruleKey: 'geo.access.chatgpt_allowed' },
  { name: 'ClaudeBot', userAgent: 'ClaudeBot', ruleKey: 'geo.access.claudebot_allowed' },
  { name: 'PerplexityBot', userAgent: 'PerplexityBot', ruleKey: 'geo.access.perplexitybot_allowed' },
  { name: 'Google-Extended', userAgent: 'Google-Extended', ruleKey: 'geo.access.googleextended_allowed' },
  { name: 'Googlebot', userAgent: 'Googlebot', ruleKey: 'geo.access.googlebot_allowed' },
];

let fetchHttp: ((url: string) => Promise<any>) | null = null;
try { const crawler = require('@b2/worker-crawler'); fetchHttp = crawler.fetchHttp; Logger.log('🌐 Crawler HTTP real carregado'); } catch { Logger.warn('⚠️ Crawler indisponível'); }

interface AnalysisRun {
  id: string; projectId: string; type: string; url: string; source: string;
  status: 'queued' | 'running' | 'completed'; facts: NormalizedFacts | null;
  findings: FindingEvaluation[]; scores: { seo: ScoreResult | null; geo: ScoreResult | null };
  actionItems: ActionItem[]; createdAt: string;
}

@Injectable()
export class AnalysisService {
  private runs = new Map<string, AnalysisRun>();
  private aiSemantic = new AISemanticService();

  async create(dto: { projectId: string; type: string; url: string; source: string }) {
    const id = crypto.randomUUID();
    const run: AnalysisRun = { id, projectId: dto.projectId, type: dto.type, url: dto.url, source: dto.source, status: 'running', facts: null, findings: [], scores: { seo: null, geo: null }, actionItems: [], createdAt: new Date().toISOString() };
    this.runs.set(id, run);
    await this.processAnalysis(run);
    return { id, status: run.status, progress: 100, links: { self: `/v1/analysis-runs/${id}` } };
  }

  private async processAnalysis(run: AnalysisRun) {
    try {
      const facts = await this.collectFactsAsync(run.url);
      run.facts = facts;

      // SEO
      const seoRuleset = this.loadDefaultRuleset();
      const seoFindings = seoRuleset.rules.map((rule) => evaluateRule(rule, facts, (r, f) => this.customEvaluator(r.key, f)));
      run.scores.seo = calculateScore({ scoreType: 'seo', rulesetVersion: seoRuleset.version, categories: seoRuleset.categories.map((c) => ({ key: c.key, name: c.name, weight: c.weight, penaltyCap: c.penaltyCap, version: c.version })), findings: seoFindings, gates: seoRuleset.gates });

      // GEO — IA + bots + schema + visibility
      const semanticCache = await this.preComputeSemantic(facts);
      const geoRuleset = this.loadGeoRuleset();
      let geoFindings = geoRuleset.rules.map((rule) => evaluateRule(rule, facts, (r, f) => this.geoEvaluator(r.key, f, semanticCache)));

      // Adicionar findings de AI Bots (robots.txt)
      const botFindings = this.evaluateAiBots(facts);
      geoFindings = [...geoFindings, ...botFindings];

      // Adicionar findings de schemas específicos (FAQ, HowTo)
      const schemaFindings = this.evaluateSpecificSchemas(facts);
      geoFindings = [...geoFindings, ...schemaFindings];

      // AI Visibility — verificar se a marca é reconhecida por modelos de IA
      const visibilityFindings = await this.evaluateAiVisibility(facts);
      geoFindings = [...geoFindings, ...visibilityFindings];

      // Infraestrutura — HTTPS, sitemap, Lighthouse heurístico, performance
      const infraFindings = this.evaluateInfrastructure(facts);
      geoFindings = [...geoFindings, ...infraFindings];

      run.scores.geo = calculateScore({ scoreType: 'geo', rulesetVersion: geoRuleset.version, categories: geoRuleset.categories.map((c) => ({ key: c.key, name: c.name, weight: c.weight, penaltyCap: c.penaltyCap, version: c.version })), findings: geoFindings, gates: geoRuleset.gates });

      run.findings = [...seoFindings, ...geoFindings];
      run.actionItems = generateActionItems(run.findings, `plan-${run.id}`);
      run.status = 'completed';
    } catch (error) { console.error(error); run.status = 'completed'; }
  }

  // ── AI Bots evaluation via robots.txt ──
  private evaluateAiBots(facts: NormalizedFacts): FindingEvaluation[] {
    const findings: FindingEvaluation[] = [];
    const robotsFact = facts.robots;
    const httpHeaders = facts.httpHeaders ?? [];
    
    // Verificar meta robots
    const metaRobots = facts.metadata.robots ?? '';
    const hasNoindex = metaRobots.toLowerCase().includes('noindex');
    
    // Verificar x-robots-tag
    const xRobotsTag = httpHeaders.find((h: any) => h.name?.toLowerCase() === 'x-robots-tag');
    
    for (const bot of AI_BOTS) {
      let allowed = true;
      let evidence = 'Não verificado (robots.txt não disponível)';
      
      if (robotsFact?.rules) {
        const botRules = robotsFact.rules.filter((r: any) => 
          r.userAgent?.toLowerCase() === bot.userAgent.toLowerCase()
        );
        const disallowAll = botRules.some((r: any) => r.directive === 'disallow' && r.path === '/');
        allowed = !disallowAll;
        evidence = allowed 
          ? `robots.txt permite ${bot.userAgent}` 
          : `robots.txt bloqueia ${bot.userAgent} (Disallow: /)`;
      } else if (hasNoindex) {
        allowed = false;
        evidence = 'Meta robots: noindex';
      } else if (httpHeaders.length > 0) {
        evidence = 'robots.txt não verificado (não disponível)';
      }
      
      findings.push({
        ruleKey: bot.ruleKey, version: '1.0.0', scoreType: 'geo',
        categoryKey: 'access_recoverability',
        title: `${bot.name} Acesso`, description: `robots.txt permite ${bot.name}?`,
        severity: 'critical', maxPenalty: 2, pointsAvailable: 2,
        evaluationType: 'deterministic', evaluator: 'robots-txt',
        preconditions: [], confidenceBase: 0.90, remediationTemplateKey: 'allow_bot',
        status: allowed ? 'PASS' : 'FAIL' as FindingState,
        qualityRatio: allowed ? 1 : 0, pointsEarned: allowed ? 2 : 0,
        appliedPenalty: allowed ? 0 : 2,
        confidence: 0.90,
        explanation: evidence,
        remediationText: allowed ? 'OK' : `Adicionar "User-agent: ${bot.userAgent}" sem Disallow no robots.txt`,
        acceptanceCriteria: `${bot.userAgent} deve poder acessar o conteúdo`,
        priority: 'P1', effort: 'Baixo',
        evidences: [{ type: 'HTTP_HEADER' as const, source: 'robots-txt' as const, excerpt: evidence }],
      } as any);
    }
    return findings;
  }

  // ── Schema evaluation: FAQ, HowTo ──
  private evaluateSpecificSchemas(facts: NormalizedFacts): FindingEvaluation[] {
    const findings: FindingEvaluation[] = [];
    const schemas = facts.schemas ?? [];
    const jsonLdSchemas = schemas.filter((s: any) => s.type === 'json-ld' && s.isValid);
    
    // FAQ schema
    const faqSchemas = jsonLdSchemas.filter((s: any) => s.schemaType && s.schemaType.toLowerCase().includes('faq'));
    const faqExists = faqSchemas.length > 0;
    findings.push({
      ruleKey: 'seo.schemas.faq_schema', version: '1.0.0', scoreType: 'seo',
      categoryKey: 'schemas',
      title: 'FAQ Schema', description: 'Possui FAQPage schema?',
      severity: 'medium', maxPenalty: 2, pointsAvailable: 2,
      evaluationType: 'deterministic', evaluator: 'schema-check',
      preconditions: [], confidenceBase: 0.95, remediationTemplateKey: 'add_faq_schema',
      status: faqExists ? 'PASS' : 'NOT_APPLICABLE' as FindingState,
      qualityRatio: faqExists ? 1 : 0, pointsEarned: faqExists ? 2 : 0,
      appliedPenalty: faqExists ? 0 : 0,
      confidence: 0.95,
      explanation: faqExists ? 'FAQPage schema presente' : 'FAQPage schema não encontrado',
      remediationText: 'Adicionar FAQPage JSON-LD para rich results',
      acceptanceCriteria: 'FAQ schema deve ser válido e conter perguntas/respostas',
      priority: 'P3', effort: 'Médio',
      evidences: faqExists ? [{ type: 'DOM_ELEMENT' as const, source: 'schema-check' as const, excerpt: 'JSON-LD FAQPage encontrado' }] : [],
    } as any);

    // HowTo schema
    const howToSchemas = jsonLdSchemas.filter((s: any) => s.schemaType && s.schemaType.toLowerCase().includes('howto'));
    const howToExists = howToSchemas.length > 0;
    findings.push({
      ruleKey: 'seo.schemas.howto_schema', version: '1.0.0', scoreType: 'seo',
      categoryKey: 'schemas',
      title: 'HowTo Schema', description: 'Possui HowTo schema?',
      severity: 'medium', maxPenalty: 2, pointsAvailable: 2,
      evaluationType: 'deterministic', evaluator: 'schema-check',
      preconditions: [], confidenceBase: 0.95, remediationTemplateKey: 'add_howto_schema',
      status: howToExists ? 'PASS' : 'NOT_APPLICABLE' as FindingState,
      qualityRatio: howToExists ? 1 : 0, pointsEarned: howToExists ? 2 : 0,
      appliedPenalty: howToExists ? 0 : 0,
      confidence: 0.95,
      explanation: howToExists ? 'HowTo schema presente' : 'HowTo schema não encontrado',
      remediationText: 'Adicionar HowTo JSON-LD para instruções passo a passo',
      acceptanceCriteria: 'HowTo schema deve ser válido com passos definidos',
      priority: 'P3', effort: 'Médio',
      evidences: howToExists ? [{ type: 'DOM_ELEMENT' as const, source: 'schema-check' as const, excerpt: 'JSON-LD HowTo encontrado' }] : [],
    } as any);

    return findings;
  }

  // ── AI Visibility — Brand Recognition (Multi-Provedor) ──
  private async evaluateAiVisibility(facts: NormalizedFacts): Promise<FindingEvaluation[]> {
    const findings: FindingEvaluation[] = [];
    if (!this.aiSemantic.isAvailable()) return findings;

    // Extrair nome da marca/organização
    const brandName = facts.metadata.ogTitle
      || facts.metadata.title?.split('|')[0]?.trim()
      || facts.metadata.title?.split('-')[0]?.trim()
      || facts.metadata.title?.substring(0, 30)
      || 'esta empresa';

    // Provedores para AI Visibility (primário + fallback, ou config customizado)
    const providers = this.getVisibilityProviders();
    if (providers.length === 0) return findings;

    const prompt = `Você conhece a empresa/marca "${brandName}"? Se sim, o que sabe sobre ela? Descreva em 1-2 frases. Se não conhece, diga "Não conheço".`;

    // Consultar todos os provedores em paralelo
    const results = await Promise.allSettled(
      providers.map(async (provider) => {
        const response = await this.callLLMWithProvider(provider.apiKey, provider.baseUrl, provider.model, prompt);
        const mentioned = !response.toLowerCase().includes('não conheço') && !response.toLowerCase().includes('não conheco');
        let sentiment: 'positive' | 'neutral' | 'negative' | 'unknown' = 'unknown';
        if (mentioned) {
          if (/excelente|ótima|líder|renomada|confiável|boa|grande|qualidade/i.test(response)) sentiment = 'positive';
          else if (/ruim|problema|reclamação/i.test(response)) sentiment = 'negative';
          else sentiment = 'neutral';
        }
        return { provider: provider.name, mentioned, sentiment, response: response.substring(0, 300) };
      })
    );

    // Coletar resultados válidos
    const validResults = results
      .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
      .map(r => r.value);
    
    const mentionedCount = validResults.filter(r => r.mentioned).length;
    const totalCount = validResults.length;
    const positiveCount = validResults.filter(r => r.sentiment === 'positive').length;

    // Agregar respostas
    const aggregatedExcerpt = validResults
      .map(r => `[${r.provider}] ${r.mentioned ? 'SIM' : 'NÃO'} (${r.sentiment}): ${r.response.substring(0, 100)}`)
      .join(' | ');

    const recognizedRatio = mentionedCount / Math.max(totalCount, 1);
    const recognized = recognizedRatio >= 0.5;

    findings.push({
      ruleKey: 'geo.visibility.brand_recognized', version: '1.0.0', scoreType: 'geo',
      categoryKey: 'authority_evidence',
      title: 'Marca reconhecida por IA', description: 'Modelos de IA reconhecem esta marca?',
      severity: 'high', maxPenalty: 8, pointsAvailable: 8,
      evaluationType: 'semantic', evaluator: 'ai-visibility-multi',
      preconditions: [], confidenceBase: 0.75, remediationTemplateKey: 'build_brand',
      status: recognized ? 'PASS' : 'WARN' as FindingState,
      qualityRatio: recognizedRatio, pointsEarned: Math.round(8 * recognizedRatio),
      appliedPenalty: Math.round(8 * (1 - recognizedRatio)),
      confidence: 0.75,
      explanation: `Reconhecida por ${mentionedCount}/${totalCount} provedores IA. ${aggregatedExcerpt.substring(0, 200)}`,
      remediationText: recognized ? `${mentionedCount}/${totalCount} provedores reconhecem a marca` : `Apenas ${mentionedCount}/${totalCount} reconhecem — reforçar presença digital`,
      acceptanceCriteria: 'Marca deve ser mencionada pela maioria dos provedores de IA',
      priority: 'P2', effort: 'Alto',
      evidences: [{ type: 'AI_RESPONSE' as const, source: 'ai-visibility-multi' as const, excerpt: aggregatedExcerpt }],
    } as any);

    findings.push({
      ruleKey: 'geo.visibility.brand_sentiment', version: '1.0.0', scoreType: 'geo',
      categoryKey: 'authority_evidence',
      title: 'Sentimento da marca', description: 'Sentimento positivo em menções de IA?',
      severity: 'medium', maxPenalty: 4, pointsAvailable: 4,
      evaluationType: 'semantic', evaluator: 'ai-visibility-multi',
      preconditions: [], confidenceBase: 0.65, remediationTemplateKey: 'improve_sentiment',
      status: positiveCount > 0 ? 'PASS' : mentionedCount > 0 ? 'WARN' : 'NOT_APPLICABLE' as FindingState,
      qualityRatio: mentionedCount > 0 ? positiveCount / mentionedCount : 0.5,
      pointsEarned: Math.round(4 * (mentionedCount > 0 ? positiveCount / mentionedCount : 0.5)),
      appliedPenalty: 0,
      confidence: 0.65,
      explanation: `${positiveCount}/${mentionedCount} provedores com sentimento positivo. ${aggregatedExcerpt.substring(0, 200)}`,
      remediationText: positiveCount < mentionedCount ? 'Melhorar percepção da marca nos provedores' : 'Sentimento positivo majoritário',
      acceptanceCriteria: 'Maioria dos provedores deve ter sentimento positivo',
      priority: 'P3', effort: 'Médio',
      evidences: [{ type: 'AI_RESPONSE' as const, source: 'ai-visibility-multi' as const, excerpt: aggregatedExcerpt }],
    } as any);

    Logger.log(`👁️ AI Visibility (${totalCount} provedores): ${brandName} — ${mentionedCount}/${totalCount} reconhecem, ${positiveCount} positivos`);
    return findings;
  }

  /**
   * Obtém lista de provedores para AI Visibility.
   * Usa AI_VISIBILITY_PROVIDERS (JSON) se configurado, senão usa primary + fallback.
   */
  private getVisibilityProviders(): Array<{ name: string; apiKey: string; baseUrl: string; model: string }> {
    // Tenta carregar de AI_VISIBILITY_PROVIDERS (JSON array)
    const customProviders = process.env['AI_VISIBILITY_PROVIDERS'];
    if (customProviders) {
      try {
        const parsed = JSON.parse(customProviders);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((p: any, i: number) => ({
            name: p.name ?? `provider-${i + 1}`,
            apiKey: p.apiKey ?? '',
            baseUrl: p.baseUrl ?? 'https://api.openai.com/v1',
            model: p.model ?? 'gpt-4o-mini',
          })).filter(p => p.apiKey);
        }
      } catch { Logger.warn('AI_VISIBILITY_PROVIDERS JSON inválido'); }
    }

    // Fallback: usar primary + fallback do OPENAI_*
    const providers: Array<{ name: string; apiKey: string; baseUrl: string; model: string }> = [];
    const primaryKey = process.env['OPENAI_API_KEY'];
    const primaryUrl = process.env['OPENAI_BASE_URL'] ?? 'https://api.openai.com/v1';
    const primaryModel = process.env['OPENAI_MODEL'] ?? 'gpt-4o-mini';
    if (primaryKey) {
      providers.push({ name: 'primary', apiKey: primaryKey, baseUrl: primaryUrl, model: primaryModel });
    }
    const fallbackKey = process.env['OPENAI_FALLBACK_API_KEY'];
    const fallbackUrl = process.env['OPENAI_FALLBACK_BASE_URL'] ?? 'https://api.openai.com/v1';
    const fallbackModel = process.env['OPENAI_FALLBACK_MODEL'] ?? 'gpt-4o-mini';
    if (fallbackKey) {
      providers.push({ name: 'fallback', apiKey: fallbackKey, baseUrl: fallbackUrl, model: fallbackModel });
    }
    return providers;
  }

  /**
   * Chamada LLM para um provedor específico
   */
  private async callLLMWithProvider(apiKey: string, baseUrl: string, model: string, userPrompt: string): Promise<string> {
    if (!apiKey) return 'IA indisponível';
    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: 'Responda em português, de forma concisa (máximo 2 frases).' },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.3, max_tokens: 200,
        }),
      });
      if (!response.ok) return `Erro HTTP ${response.status}`;
      const data: any = await response.json();
      return data.choices?.[0]?.message?.content ?? 'Sem resposta';
    } catch (err: any) {
      return `Erro: ${err.message}`;
    }
  }

  // ── Infrastructure evaluation — HTTPS/TLS, sitemap, Lighthouse heurístico ──
  private evaluateInfrastructure(facts: NormalizedFacts): FindingEvaluation[] {
    const findings: FindingEvaluation[] = [];
    const url = facts.url;
    const httpResult = facts.http;
    const httpHeaders = facts.httpHeaders ?? [];
    const robotsFact = facts.robots;
    const metadata = facts.metadata;

    // 1. HTTPS/TLS
    const isHttps = url.startsWith('https://');
    const hasRedirect = httpResult?.redirectChain && httpResult.redirectChain.length > 0;
    findings.push({
      ruleKey: 'seo.infrastructure.https', version: '1.0.0', scoreType: 'seo',
      categoryKey: 'performance',
      title: 'HTTPS/TLS', description: 'Site usa HTTPS?',
      severity: 'critical', maxPenalty: 5, pointsAvailable: 5,
      evaluationType: 'deterministic', evaluator: 'infra-check',
      preconditions: [], confidenceBase: 0.98, remediationTemplateKey: 'enable_https',
      status: isHttps ? 'PASS' : 'FAIL' as FindingState,
      qualityRatio: isHttps ? 1 : 0, pointsEarned: isHttps ? 5 : 0,
      appliedPenalty: isHttps ? 0 : 5,
      confidence: 0.98,
      explanation: isHttps ? 'HTTPS ativo' : 'Site não usa HTTPS — grave risco de segurança',
      remediationText: isHttps ? 'OK' : 'Migrar para HTTPS com certificado SSL válido',
      acceptanceCriteria: 'Site deve ser servido exclusivamente via HTTPS',
      priority: 'P1', effort: 'Alto',
      evidences: [{ type: 'HTTP_HEADER' as const, source: 'infra-check' as const, excerpt: url }],
    } as any);

    // 2. Sitemap.xml
    const sitemapUrls = robotsFact?.sitemapUrls ?? [];
    const hasSitemap = sitemapUrls.length > 0;
    findings.push({
      ruleKey: 'seo.infrastructure.sitemap', version: '1.0.0', scoreType: 'seo',
      categoryKey: 'indexability',
      title: 'Sitemap XML', description: 'Sitemap XML declarado no robots.txt?',
      severity: 'medium', maxPenalty: 3, pointsAvailable: 3,
      evaluationType: 'deterministic', evaluator: 'infra-check',
      preconditions: [], confidenceBase: 0.90, remediationTemplateKey: 'add_sitemap',
      status: hasSitemap ? 'PASS' : 'NOT_APPLICABLE' as FindingState,
      qualityRatio: hasSitemap ? 1 : 0, pointsEarned: hasSitemap ? 3 : 0,
      appliedPenalty: 0,
      confidence: 0.90,
      explanation: hasSitemap ? `${sitemapUrls.length} sitemap(s) encontrados no robots.txt` : 'Sitemap não declarado no robots.txt',
      remediationText: hasSitemap ? 'OK' : 'Adicionar diretiva Sitemap ao robots.txt',
      acceptanceCriteria: 'robots.txt deve conter URL(s) do sitemap',
      priority: 'P2', effort: 'Baixo',
      evidences: hasSitemap ? [{ type: 'HTTP_HEADER' as const, source: 'robots-txt' as const, excerpt: sitemapUrls[0] }] : [],
    } as any);

    // 3. Security Headers (HSTS, CSP, X-Frame-Options, etc.)
    const hsts = httpHeaders.find((h: any) => h.name?.toLowerCase() === 'strict-transport-security');
    const csp = httpHeaders.find((h: any) => h.name?.toLowerCase() === 'content-security-policy');
    const xFrame = httpHeaders.find((h: any) => h.name?.toLowerCase() === 'x-frame-options');
    const securityHeadersFound = [hsts, csp, xFrame].filter(Boolean).length;
    const securityOk = securityHeadersFound >= 2;
    findings.push({
      ruleKey: 'seo.infrastructure.security_headers', version: '1.0.0', scoreType: 'seo',
      categoryKey: 'performance',
      title: 'Headers de Segurança', description: 'Possui HSTS, CSP, X-Frame-Options?',
      severity: 'high', maxPenalty: 3, pointsAvailable: 3,
      evaluationType: 'deterministic', evaluator: 'infra-check',
      preconditions: [], confidenceBase: 0.95, remediationTemplateKey: 'add_security_headers',
      status: securityOk ? 'PASS' : 'WARN' as FindingState,
      qualityRatio: securityHeadersFound / 3, pointsEarned: Math.round(3 * securityHeadersFound / 3),
      appliedPenalty: Math.round(3 * (1 - securityHeadersFound / 3)),
      confidence: 0.95,
      explanation: `${securityHeadersFound}/3 headers de segurança (HSTS, CSP, X-Frame-Options)`,
      remediationText: 'Adicionar HSTS, CSP e X-Frame-Options',
      acceptanceCriteria: 'Headers de segurança protegem usuários e melhoram confiança',
      priority: 'P2', effort: 'Médio',
      evidences: [{ type: 'HTTP_HEADER' as const, source: 'infra-check' as const, excerpt: `${securityHeadersFound}/3 headers presentes` }],
    } as any);

    // 4. Lighthouse Heurístico (viewport, imagens com dimensões, tamanho HTML)
    const hasViewport = metadata.viewport !== null && metadata.viewport !== undefined;
    const htmlSize = facts.http?.contentLength ?? 0;
    const imagesWithSize = facts.images?.filter((img: any) => img.width && img.height).length ?? 0;
    const totalImages = facts.images?.length ?? 0;
    const perfScore = [hasViewport ? 1 : 0, htmlSize < 500000 ? 1 : 0, totalImages > 0 ? (imagesWithSize / totalImages >= 0.5 ? 1 : 0.5) : 1].reduce((a, b) => a + b, 0) / 3;
    findings.push({
      ruleKey: 'seo.infrastructure.performance_heuristic', version: '1.0.0', scoreType: 'seo',
      categoryKey: 'performance',
      title: 'Performance Heurística', description: 'Viewport, tamanho HTML, imagens otimizadas?',
      severity: 'medium', maxPenalty: 5, pointsAvailable: 5,
      evaluationType: 'deterministic', evaluator: 'infra-check',
      preconditions: [], confidenceBase: 0.75, remediationTemplateKey: 'improve_performance',
      status: perfScore >= 0.7 ? 'PASS' : 'WARN' as FindingState,
      qualityRatio: perfScore, pointsEarned: Math.round(5 * perfScore),
      appliedPenalty: Math.round(5 * (1 - perfScore)),
      confidence: 0.75,
      explanation: `Viewport: ${hasViewport ? 'OK' : 'ausente'}, HTML: ${Math.round(htmlSize / 1024)}KB, Imagens com dimensões: ${imagesWithSize}/${totalImages}`,
      remediationText: 'Adicionar viewport, reduzir HTML, definir dimensões em imagens',
      acceptanceCriteria: 'Viewport presente, HTML < 500KB, maioria das imagens com width/height',
      priority: 'P3', effort: 'Médio',
      evidences: [],
    } as any);

    return findings;
  }

  private async collectFactsAsync(url: string): Promise<NormalizedFacts> {
    if (fetchHttp) {
      try {
        const result = await fetchHttp(url);
        if (result.body && !result.error) {
          const html = result.body;
          Logger.log(`🌐 Página real: ${url} (${result.statusCode}, ${html.length} bytes)`);
          
          // Tentar buscar robots.txt
          let robotsParsed = null;
          try {
            const baseUrl = new URL(url);
            const robotsUrl = `${baseUrl.protocol}//${baseUrl.host}/robots.txt`;
            const robotsResult = await fetchHttp(robotsUrl);
            if (robotsResult.body && !robotsResult.error) {
              robotsParsed = parseRobotsTxt(robotsResult.body, robotsUrl, 0);
              Logger.log(`📋 robots.txt: ${robotsParsed.rules.length} regras encontradas`);
            }
          } catch { /* robots.txt indisponível */ }
          
          return { schemaVersion: '1.0', collectedAt: new Date().toISOString(), url: result.finalUrl, captureSource: 'backend_http', http: { url, finalUrl: result.finalUrl, statusCode: result.statusCode, statusText: result.statusText, redirectChain: result.redirectChain, contentLength: result.contentLength, contentType: result.contentType, compression: null, timingDnsMs: null, timingConnectMs: null, timingTlsMs: null, timingTtfbMs: null, timingTotalMs: null }, httpHeaders: Object.entries(result.headers ?? {}).map(([n, v]: any) => ({ name: n, value: String(v) })), robots: robotsParsed as any, sitemap: null, metadata: extractMetadata(html, result.finalUrl), headings: extractHeadings(html), textBlocks: extractTextBlocks(html), links: extractLinks(html, { baseUrl: result.finalUrl }), images: extractImages(html), schemas: extractSchemas(html), contacts: [], lighthouse: null, entities: [], claims: [], collectionWarnings: [], sourceHtmlHash: null, renderedDomHash: null };
        }
      } catch (err: any) { Logger.warn(`Crawler falhou: ${err.message}`); }
    }
    return this.collectFactsSync(url);
  }

  private collectFactsSync(url: string): NormalizedFacts {
    const html = this.getFixtureForUrl(url);
    return { schemaVersion: '1.0', collectedAt: new Date().toISOString(), url, captureSource: 'backend_http', http: null, httpHeaders: [], robots: null, sitemap: null, metadata: extractMetadata(html, url), headings: extractHeadings(html), textBlocks: extractTextBlocks(html), links: extractLinks(html, { baseUrl: url }), images: extractImages(html), schemas: extractSchemas(html), contacts: [], lighthouse: null, entities: [], claims: [], collectionWarnings: [], sourceHtmlHash: null, renderedDomHash: null };
  }

  private getFixtureForUrl(url: string): string { return '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Pagina Teste</title><meta name="description" content="Teste"><meta name="robots" content="index, follow"></head><body><main><h1>Bem-vindo</h1><p>Analise de demonstracao.</p></main></body></html>'; }

  private async preComputeSemantic(facts: NormalizedFacts): Promise<Map<string, { rating: number; confidence: number; explanation: string; evidence: string[] }>> {
    const cache = new Map<string, { rating: number; confidence: number; explanation: string; evidence: string[] }>();
    const allRules = ['geo.access.oai_searchbot_blocked','geo.access.claude_searchbot_blocked','geo.entity.organization_identified','geo.entity.offer_clarity','geo.entity.region_mentioned','geo.completeness.problem_solved','geo.completeness.applications','geo.completeness.specifications','geo.completeness.faq_relevant','geo.authority.author_identified','geo.authority.evidence_present','geo.citability.direct_answers','geo.citability.headings_descriptive','geo.schema.organization_schema','geo.local_commercial.how_to_buy','geo.transparency.contact_visible'];
    if (!this.aiSemantic.isAvailable()) { for (const rk of allRules) cache.set(rk, { rating: 0.5, confidence: 0.1, explanation: 'IA indisponivel', evidence: [] }); return cache; }
    const textSample = facts.textBlocks.map((t: any) => t.text).join(' ').substring(0, 4000);
    const headings = facts.headings.map((h: any) => h.textNormalized).join('; ');
    try {
      const batch = await this.aiSemantic.evaluateBatch(facts.url, facts.metadata.title ?? '', facts.metadata.description ?? '', headings, textSample);
      Logger.log(`GEO IA: ${batch.evaluations.length} criterios em ${batch.latencyMs}ms (${batch.modelUsed})`);
      for (const e of batch.evaluations) cache.set(e.ruleKey, { rating: e.rating, confidence: e.confidence, explanation: e.explanation, evidence: e.evidence });
    } catch (err: any) { Logger.warn(`GEO IA falhou: ${err.message}`); for (const rk of allRules) cache.set(rk, { rating: 0.5, confidence: 0.1, explanation: 'Erro na IA', evidence: [] }); }
    return cache;
  }

  private loadDefaultRuleset() {
    return loadRuleset({
      key: 'seo-ruleset-1.0.0', version: '1.0.0', scoreType: 'seo', status: 'active', effectiveAt: new Date().toISOString(), changelog: 'SEO v1',
      categories: [
        { key: 'indexability', name: 'Rastreamento', weight: 18, penaltyCap: 50, version: '1.0.0' },
        { key: 'on_page_metadata', name: 'Metadados', weight: 15, penaltyCap: 30, version: '1.0.0' },
        { key: 'content', name: 'Conteudo', weight: 18, penaltyCap: 35, version: '1.0.0' },
        { key: 'structure_links', name: 'Estrutura', weight: 12, penaltyCap: 25, version: '1.0.0' },
        { key: 'images_media', name: 'Imagens', weight: 7, penaltyCap: 15, version: '1.0.0' },
        { key: 'schemas', name: 'Schemas', weight: 8, penaltyCap: 15, version: '1.0.0' },
        { key: 'performance', name: 'Performance', weight: 15, penaltyCap: 30, version: '1.0.0' },
        { key: 'mobile_accessibility', name: 'Mobile', weight: 7, penaltyCap: 15, version: '1.0.0' },
      ] as any,
      gates: [{ condition: 'rule:seo.indexability.noindex=FAIL', maxScore: 35, explanation: 'noindex', active: false }],
      rules: [
        { key: 'seo.indexability.noindex', version: '1.0.0', scoreType: 'seo', categoryKey: 'indexability', title: 'Meta robots noindex', description: 'Verifica noindex.', severity: 'critical', maxPenalty: 18, pointsAvailable: 18, evaluationType: 'deterministic', preconditions: [{ fact: 'metadata.robots', operator: 'exists' }], evaluator: 'meta-robots', confidenceBase: 0.95, remediationTemplateKey: 'remove_noindex' },
        { key: 'seo.metadata.title', version: '1.0.0', scoreType: 'seo', categoryKey: 'on_page_metadata', title: 'Title presente', description: 'Verifica title.', severity: 'high', maxPenalty: 8, pointsAvailable: 8, evaluationType: 'deterministic', preconditions: [{ fact: 'metadata.title', operator: 'exists' }], evaluator: 'title', confidenceBase: 0.95, remediationTemplateKey: 'add_title' },
        { key: 'seo.metadata.description', version: '1.0.0', scoreType: 'seo', categoryKey: 'on_page_metadata', title: 'Description presente', description: 'Verifica description.', severity: 'medium', maxPenalty: 7, pointsAvailable: 7, evaluationType: 'deterministic', preconditions: [{ fact: 'metadata.description', operator: 'exists' }], evaluator: 'description', confidenceBase: 0.95, remediationTemplateKey: 'add_description' },
        { key: 'seo.content.h1', version: '1.0.0', scoreType: 'seo', categoryKey: 'content', title: 'H1 presente', description: 'Verifica H1.', severity: 'high', maxPenalty: 9, pointsAvailable: 9, evaluationType: 'deterministic', preconditions: [], evaluator: 'h1', confidenceBase: 0.95, remediationTemplateKey: 'add_h1' },
        { key: 'seo.content.language', version: '1.0.0', scoreType: 'seo', categoryKey: 'content', title: 'Idioma declarado', description: 'Verifica lang.', severity: 'medium', maxPenalty: 4, pointsAvailable: 4, evaluationType: 'deterministic', preconditions: [], evaluator: 'language', confidenceBase: 0.95, remediationTemplateKey: 'add_lang' },
        { key: 'seo.schemas.valid_jsonld', version: '1.0.0', scoreType: 'seo', categoryKey: 'schemas', title: 'JSON-LD valido', description: 'Verifica JSON-LD.', severity: 'medium', maxPenalty: 8, pointsAvailable: 8, evaluationType: 'deterministic', preconditions: [], evaluator: 'jsonld', confidenceBase: 0.95, remediationTemplateKey: 'fix_jsonld' },
      ] as any,
    });
  }

  private loadGeoRuleset() {
    return loadRuleset({
      key: 'geo-ruleset-1.0.0', version: '1.0.0', scoreType: 'geo', status: 'active', effectiveAt: new Date().toISOString(), changelog: 'GEO v1',
      categories: [
        { key: 'access_recoverability', name: 'Acesso', weight: 12, penaltyCap: 40, version: '1.0.0' },
        { key: 'entity_offer_clarity', name: 'Entidade/Oferta', weight: 16, penaltyCap: 30, version: '1.0.0' },
        { key: 'completeness', name: 'Completude', weight: 20, penaltyCap: 35, version: '1.0.0' },
        { key: 'authority_evidence', name: 'Autoridade', weight: 20, penaltyCap: 40, version: '1.0.0' },
        { key: 'semantic_citability', name: 'Citabilidade', weight: 10, penaltyCap: 20, version: '1.0.0' },
        { key: 'schema_identity', name: 'Schema', weight: 8, penaltyCap: 15, version: '1.0.0' },
        { key: 'local_commercial', name: 'Local', weight: 8, penaltyCap: 15, version: '1.0.0' },
        { key: 'freshness_transparency', name: 'Transparencia', weight: 6, penaltyCap: 12, version: '1.0.0' },
      ] as any,
      gates: [
        { condition: 'rule:geo.access.oai_searchbot_blocked=FAIL', maxScore: 50, explanation: 'OAI bloqueado', active: false },
        { condition: 'rule:geo.access.claude_searchbot_blocked=FAIL', maxScore: 60, explanation: 'Claude bloqueado', active: false },
      ],
      rules: [
        { key: 'geo.access.oai_searchbot_blocked', version: '1.0.0', scoreType: 'geo', categoryKey: 'access_recoverability', title: 'OAI-SearchBot', description: 'Acesso', severity: 'critical', maxPenalty: 12, pointsAvailable: 12, evaluationType: 'semantic', preconditions: [], evaluator: 'oai', confidenceBase: 0.85, remediationTemplateKey: 'allow_oai' },
        { key: 'geo.access.claude_searchbot_blocked', version: '1.0.0', scoreType: 'geo', categoryKey: 'access_recoverability', title: 'Claude-SearchBot', description: 'Acesso', severity: 'critical', maxPenalty: 12, pointsAvailable: 12, evaluationType: 'semantic', preconditions: [], evaluator: 'claude', confidenceBase: 0.85, remediationTemplateKey: 'allow_claude' },
        { key: 'geo.entity.organization_identified', version: '1.0.0', scoreType: 'geo', categoryKey: 'entity_offer_clarity', title: 'Organizacao', description: 'Nome', severity: 'high', maxPenalty: 8, pointsAvailable: 8, evaluationType: 'semantic', preconditions: [], evaluator: 'org', confidenceBase: 0.75, remediationTemplateKey: 'add_org' },
        { key: 'geo.entity.offer_clarity', version: '1.0.0', scoreType: 'geo', categoryKey: 'entity_offer_clarity', title: 'Oferta', description: 'Produto/servico', severity: 'high', maxPenalty: 8, pointsAvailable: 8, evaluationType: 'semantic', preconditions: [], evaluator: 'offer', confidenceBase: 0.70, remediationTemplateKey: 'clarify' },
        { key: 'geo.entity.region_mentioned', version: '1.0.0', scoreType: 'geo', categoryKey: 'local_commercial', title: 'Regiao', description: 'Area', severity: 'medium', maxPenalty: 4, pointsAvailable: 4, evaluationType: 'semantic', preconditions: [], evaluator: 'region', confidenceBase: 0.75, remediationTemplateKey: 'add_region' },
        { key: 'geo.completeness.problem_solved', version: '1.0.0', scoreType: 'geo', categoryKey: 'completeness', title: 'Problema', description: 'Resolve', severity: 'high', maxPenalty: 5, pointsAvailable: 5, evaluationType: 'semantic', preconditions: [], evaluator: 'problem', confidenceBase: 0.65, remediationTemplateKey: 'explain' },
        { key: 'geo.completeness.applications', version: '1.0.0', scoreType: 'geo', categoryKey: 'completeness', title: 'Aplicacoes', description: 'Setores', severity: 'medium', maxPenalty: 5, pointsAvailable: 5, evaluationType: 'semantic', preconditions: [], evaluator: 'apps', confidenceBase: 0.65, remediationTemplateKey: 'add_apps' },
        { key: 'geo.completeness.specifications', version: '1.0.0', scoreType: 'geo', categoryKey: 'completeness', title: 'Especificacoes', description: 'Tecnicas', severity: 'medium', maxPenalty: 5, pointsAvailable: 5, evaluationType: 'semantic', preconditions: [], evaluator: 'specs', confidenceBase: 0.80, remediationTemplateKey: 'add_specs' },
        { key: 'geo.completeness.faq_relevant', version: '1.0.0', scoreType: 'geo', categoryKey: 'completeness', title: 'FAQ', description: 'Perguntas', severity: 'low', maxPenalty: 5, pointsAvailable: 5, evaluationType: 'semantic', preconditions: [], evaluator: 'faq', confidenceBase: 0.65, remediationTemplateKey: 'add_faq' },
        { key: 'geo.authority.author_identified', version: '1.0.0', scoreType: 'geo', categoryKey: 'authority_evidence', title: 'Autor', description: 'Responsavel', severity: 'medium', maxPenalty: 5, pointsAvailable: 5, evaluationType: 'semantic', preconditions: [], evaluator: 'author', confidenceBase: 0.70, remediationTemplateKey: 'add_author' },
        { key: 'geo.authority.evidence_present', version: '1.0.0', scoreType: 'geo', categoryKey: 'authority_evidence', title: 'Evidencias', description: 'Cases', severity: 'high', maxPenalty: 10, pointsAvailable: 10, evaluationType: 'semantic', preconditions: [], evaluator: 'evidence', confidenceBase: 0.60, remediationTemplateKey: 'add_evidence' },
        { key: 'geo.citability.direct_answers', version: '1.0.0', scoreType: 'geo', categoryKey: 'semantic_citability', title: 'Respostas', description: 'Diretas', severity: 'medium', maxPenalty: 5, pointsAvailable: 5, evaluationType: 'semantic', preconditions: [], evaluator: 'answers', confidenceBase: 0.60, remediationTemplateKey: 'add_direct' },
        { key: 'geo.citability.headings_descriptive', version: '1.0.0', scoreType: 'geo', categoryKey: 'semantic_citability', title: 'Headings', description: 'Descritivos', severity: 'low', maxPenalty: 5, pointsAvailable: 5, evaluationType: 'semantic', preconditions: [], evaluator: 'h-geo', confidenceBase: 0.70, remediationTemplateKey: 'improve_h' },
        { key: 'geo.schema.organization_schema', version: '1.0.0', scoreType: 'geo', categoryKey: 'schema_identity', title: 'Schema Org', description: 'Organization', severity: 'medium', maxPenalty: 4, pointsAvailable: 4, evaluationType: 'semantic', preconditions: [], evaluator: 'schema', confidenceBase: 0.85, remediationTemplateKey: 'add_schema' },
        { key: 'geo.transparency.contact_visible', version: '1.0.0', scoreType: 'geo', categoryKey: 'freshness_transparency', title: 'Contato', description: 'Informacoes', severity: 'medium', maxPenalty: 3, pointsAvailable: 3, evaluationType: 'semantic', preconditions: [], evaluator: 'contact', confidenceBase: 0.80, remediationTemplateKey: 'add_contact' },
        { key: 'geo.local_commercial.how_to_buy', version: '1.0.0', scoreType: 'geo', categoryKey: 'local_commercial', title: 'Como contratar', description: 'CTA', severity: 'medium', maxPenalty: 4, pointsAvailable: 4, evaluationType: 'semantic', preconditions: [], evaluator: 'buy', confidenceBase: 0.65, remediationTemplateKey: 'add_cta' },
      ] as any,
    });
  }

  private customEvaluator(ruleKey: string, facts: NormalizedFacts): { qualityRatio: number; status: FindingState; evidences: Evidence[] } {
    const meta = facts.metadata;
    switch (ruleKey) {
      case 'seo.indexability.noindex': { const n = meta.robots?.toLowerCase().includes('noindex') ?? false; return { qualityRatio: n ? 0 : 1, status: n ? 'FAIL' : 'PASS', evidences: [{ type: 'DOM_ELEMENT', source: 'backend', excerpt: meta.robots ?? '' }] }; }
      case 'seo.metadata.title': { const h = meta.title && meta.title.length > 0; const g = h && /bem.vindo|home|untitled/i.test(meta.title!); const q = h ? (g ? 0.5 : 1) : 0; return { qualityRatio: q, status: q === 0 ? 'FAIL' : q < 1 ? 'WARN' : 'PASS', evidences: [{ type: 'DOM_ELEMENT', source: 'backend', excerpt: meta.title ?? '' }] }; }
      case 'seo.metadata.description': { const h = meta.description && meta.description.length > 0; return { qualityRatio: h ? 1 : 0, status: h ? 'PASS' : 'FAIL', evidences: [{ type: 'DOM_ELEMENT', source: 'backend', excerpt: meta.description ?? '' }] }; }
      case 'seo.content.h1': { const h1s = facts.headings.filter((h: any) => h.tag === 'h1'); const q = h1s.length === 1 ? 1 : h1s.length === 0 ? 0 : 0.5; return { qualityRatio: q, status: q === 0 ? 'FAIL' : q < 1 ? 'WARN' : 'PASS', evidences: [] }; }
      case 'seo.content.language': { const h = meta.language !== null; return { qualityRatio: h ? 1 : 0, status: h ? 'PASS' : 'FAIL', evidences: [] }; }
      case 'seo.schemas.valid_jsonld': { const j = facts.schemas.filter((s: any) => s.type === 'json-ld'); if (j.length === 0) return { qualityRatio: 1, status: 'NOT_APPLICABLE', evidences: [] }; const v = j.filter((s: any) => s.isValid); const q = v.length / j.length; return { qualityRatio: q, status: q === 1 ? 'PASS' : q === 0 ? 'FAIL' : 'WARN', evidences: [] }; }
      default: return { qualityRatio: 0, status: 'NOT_TESTED', evidences: [] };
    }
  }

  private geoEvaluator(ruleKey: string, facts: NormalizedFacts, semanticCache?: Map<string, { rating: number; confidence: number; explanation: string; evidence: string[] }>): { qualityRatio: number; status: FindingState; evidences: Evidence[] } {
    if (semanticCache && semanticCache.has(ruleKey)) {
      const ai = semanticCache.get(ruleKey)!;
      const st: FindingState = ai.rating >= 0.75 ? 'PASS' : ai.rating >= 0.4 ? 'WARN' : 'FAIL';
      const evs: Evidence[] = ai.evidence.length > 0
        ? ai.evidence.map((e: string) => ({ type: 'VISIBLE_TEXT' as const, source: 'ai-semantic' as const, excerpt: e.substring(0, 200) }))
        : [{ type: 'AI_RESPONSE' as const, source: 'ai-semantic' as const, excerpt: ai.explanation }];
      return { qualityRatio: ai.rating, status: st, evidences: evs };
    }
    const allText = facts.textBlocks.map((t: any) => t.text).join(' ').toLowerCase();
    const meta = facts.metadata;
    switch (ruleKey) {
      case 'geo.access.oai_searchbot_blocked': return { qualityRatio: 0.5, status: 'WARN', evidences: [{ type: 'HTTP_HEADER', source: 'fallback', excerpt: 'IA indisponivel' }] };
      case 'geo.access.claude_searchbot_blocked': return { qualityRatio: 0.5, status: 'WARN', evidences: [{ type: 'HTTP_HEADER', source: 'fallback', excerpt: 'IA indisponivel' }] };
      case 'geo.entity.organization_identified': { const f = allText.includes('empresa') || meta.title?.toLowerCase().includes('empresa'); return { qualityRatio: f ? 0.75 : 0.3, status: f ? 'PASS' : 'WARN', evidences: [{ type: 'VISIBLE_TEXT', source: 'fallback', excerpt: 'IA indisponivel — regex fallback' }] }; }
      case 'geo.entity.offer_clarity': { const f = /servico|produto|solucao|distribuidor/i.test(allText); return { qualityRatio: f ? 0.75 : 0.3, status: f ? 'PASS' : 'WARN', evidences: [] }; }
      case 'geo.entity.region_mentioned': { const f = /\b(sp|sao paulo|campinas|brasil|mg|rj)\b/i.test(allText); return { qualityRatio: f ? 0.75 : 0, status: f ? 'PASS' : 'FAIL', evidences: [] }; }
      case 'geo.completeness.problem_solved': { const h = allText.length > 300; return { qualityRatio: h ? 0.6 : 0.3, status: h ? 'PASS' : 'WARN', evidences: [] }; }
      case 'geo.completeness.applications': { const h = /industria|aplicacao|setor|segmento/i.test(allText); return { qualityRatio: h ? 0.6 : 0.3, status: h ? 'PASS' : 'WARN', evidences: [] }; }
      case 'geo.completeness.specifications': { const h = /\d+\s*(bar|m3|mm|kg|kw|hp|psi)/i.test(allText); return { qualityRatio: h ? 0.75 : 0, status: h ? 'PASS' : 'FAIL', evidences: [] }; }
      case 'geo.completeness.faq_relevant': return { qualityRatio: 0, status: 'NOT_TESTED', evidences: [] };
      case 'geo.authority.author_identified': return { qualityRatio: 0, status: 'NOT_TESTED', evidences: [] };
      case 'geo.authority.evidence_present': { const h = /case|certifica|iso|cliente|parceir/i.test(allText); return { qualityRatio: h ? 0.6 : 0, status: h ? 'PASS' : 'FAIL', evidences: [] }; }
      case 'geo.citability.direct_answers': return { qualityRatio: 0.5, status: 'WARN', evidences: [] };
      case 'geo.citability.headings_descriptive': { const c = facts.headings.length; return { qualityRatio: c >= 3 ? 0.6 : 0.3, status: c >= 3 ? 'PASS' : 'WARN', evidences: [] }; }
      case 'geo.schema.organization_schema': { const org = facts.schemas.filter((s: any) => s.type === 'json-ld' && s.schemaType === 'Organization'); return { qualityRatio: org.length > 0 ? 0.75 : 0, status: org.length > 0 ? 'PASS' : 'FAIL', evidences: [] }; }
      case 'geo.transparency.contact_visible': { const h = /telefone|email|contato|whatsapp|@/i.test(allText); return { qualityRatio: h ? 0.75 : 0, status: h ? 'PASS' : 'FAIL', evidences: [] }; }
      case 'geo.local_commercial.how_to_buy': { const h = /comprar|contratar|orcamento|solicitar/i.test(allText); return { qualityRatio: h ? 0.6 : 0.3, status: h ? 'PASS' : 'WARN', evidences: [] }; }
      // Bots são avaliados separadamente via evaluateAiBots, mas aqui retorna um fallback
      case 'geo.access.gptbot_allowed': case 'geo.access.chatgpt_allowed': case 'geo.access.claudebot_allowed': case 'geo.access.perplexitybot_allowed': case 'geo.access.googleextended_allowed': case 'geo.access.googlebot_allowed':
        return { qualityRatio: 0.5, status: 'WARN', evidences: [{ type: 'HTTP_HEADER', source: 'fallback', excerpt: 'robots.txt nao verificado' }] };
      default: return { qualityRatio: 0, status: 'NOT_TESTED', evidences: [] };
    }
  }

  async findById(id: string) { const run = this.runs.get(id); if (!run) return null; return { id: run.id, projectId: run.projectId, type: run.type, url: run.url, status: run.status, progress: run.status === 'completed' ? 100 : 50, scores: run.scores, createdAt: run.createdAt }; }
  async getFindings(id: string, filters?: { severity?: string; category?: string }) { const run = this.runs.get(id); if (!run) return []; let f = run.findings; if (filters?.severity) f = f.filter((x: any) => x.severity === filters.severity); if (filters?.category) f = f.filter((x: any) => x.categoryKey === filters.category); return f.map((x: any) => ({ ruleKey: x.ruleKey, scoreType: x.scoreType, category: x.categoryKey, status: x.status, severity: x.severity, title: x.title, explanation: x.explanation, remediation: x.remediationText ?? x.explanation, priority: x.priority, effort: x.effort, confidence: x.confidence, estimatedScoreGain: Math.round((x.pointsAvailable - x.pointsEarned) * 100) / 100, evidences: x.evidences ?? [], source: x.evidences?.[0]?.source ?? 'unknown' })); }
  async getScores(id: string) { const run = this.runs.get(id); if (!run) return null; return { seo: run.scores.seo ? { score: run.scores.seo.score, coverage: run.scores.seo.coverage, confidence: run.scores.seo.confidence } : null, geo: run.scores.geo ? { score: run.scores.geo.score, coverage: run.scores.geo.coverage, confidence: run.scores.geo.confidence } : null }; }
  async compare(id: string, baselineId: string) { const a = this.runs.get(id); const b = this.runs.get(baselineId); if (!a || !b || !a.scores.seo || !b.scores.seo) return null; return compareScores(b.scores.seo, a.scores.seo); }
  async reanalyze(id: string) { const orig = this.runs.get(id); if (!orig) return null; return this.create({ projectId: orig.projectId, type: orig.type, url: orig.url, source: 'api' }); }
  async exportPdf(id: string) { return { status: 'queued', message: 'Exportacao PDF enfileirada.' }; }
  seed() { const f = this.collectFactsSync('https://demo.example.com'); const r = this.loadDefaultRuleset(); const fd = r.rules.map((rl: any) => evaluateRule(rl, f, (rk: any, ff: any) => this.customEvaluator(rk.key, ff))); const sr = calculateScore({ scoreType: 'seo', rulesetVersion: r.version, categories: r.categories.map((c: any) => ({ key: c.key, name: c.name, weight: c.weight, penaltyCap: c.penaltyCap, version: c.version })), findings: fd, gates: r.gates }); return { status: 'ok', data: { findings: fd.length, seoScore: sr.score } }; }
}