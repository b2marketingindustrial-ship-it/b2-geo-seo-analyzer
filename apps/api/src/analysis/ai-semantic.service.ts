import { Injectable, Logger } from '@nestjs/common';

/**
 * B2 GEO/SEO Analyzer — Serviço de Análise Semântica (IA Principal)
 *
 * Motor PRINCIPAL da avaliação GEO + SEO qualitativo.
 * Utiliza LLM (OpenAI API compatible) seguindo diretrizes da documentação.
 * Suporta múltiplos provedores: OpenAI, DeepSeek, Azure, OpenRouter, etc.
 *
 * @see docs/06_MODELO_DE_PONTUACAO.md
 * @see docs/07_AI_VISIBILITY.md
 */

// ═══════════════════════════════════════════════════════════════════════════════
// INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════

interface CriterionDefinition {
  ruleKey: string; category: string; title: string; description: string;
  whatToLookFor: string; ratingScale: string; evidenceGuidelines: string;
}

export interface SemanticEvaluationResult {
  ruleKey: string; rating: number; confidence: number;
  evidence: string[]; missing: string[]; explanation: string;
}

export interface BatchEvaluationResult {
  evaluations: SemanticEvaluationResult[];
  overallNotes?: string; modelUsed: string; provider: string; latencyMs: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CRITÉRIOS CONFORME DOCUMENTAÇÃO
// ═══════════════════════════════════════════════════════════════════════════════

const SEO_QUALITY_CRITERIA: CriterionDefinition[] = [
  { ruleKey: 'seo.metadata.title_quality', category: 'on_page_metadata', title: 'Qualidade do Title', description: 'Title descritivo, palavra-chave, comprimento ideal (50-60 chars)?', whatToLookFor: 'Title genérico ("Home", "Bem-vindo") ou descreve claramente a página?', ratingScale: '1.0=excelente, descritivo, palavra-chave, comprimento ideal; 0.75=bom; 0.5=funcional mas genérico; 0.25=muito curto/longo; 0.0=ausente/genérico', evidenceGuidelines: 'Cite o title atual.' },
  { ruleKey: 'seo.metadata.description_quality', category: 'on_page_metadata', title: 'Qualidade da Meta Description', description: 'Description persuasiva, com CTA, comprimento adequado (120-160 chars)?', whatToLookFor: 'Resumo atraente que convida ao clique ou placeholder?', ratingScale: '1.0=excelente, persuasiva, CTA; 0.75=boa; 0.5=funcional genérica; 0.25=placeholder; 0.0=ausente', evidenceGuidelines: 'Cite a description atual.' },
  { ruleKey: 'seo.content.heading_structure', category: 'content', title: 'Estrutura de Headings', description: 'Hierarquia H1-H4 semanticamente correta?', whatToLookFor: 'H1 reflete tema principal? H2 dividem bem as seções? Headings genéricos ("Saiba mais")?', ratingScale: '1.0=excelente hierarquia; 0.75=boa; 0.5=funcional genérica; 0.25=confusa; 0.0=sem headings', evidenceGuidelines: 'Liste os headings encontrados.' },
  { ruleKey: 'seo.content.readability', category: 'content', title: 'Legibilidade do Conteúdo', description: 'Conteúdo bem escrito, escaneável, adequado ao público B2B?', whatToLookFor: 'Parágrafos curtos? Listas? Linguagem técnica adequada? Original ou template?', ratingScale: '1.0=excelente; 0.75=bom; 0.5=aceitável; 0.25=pobre; 0.0=inexistente', evidenceGuidelines: 'Cite trechos exemplificando qualidade.' },
  { ruleKey: 'seo.images.alt_quality', category: 'images_media', title: 'Qualidade dos Alt Texts', description: 'Alt texts descritivos e úteis?', whatToLookFor: 'Imagens com alt descritivo ou genérico ("imagem1")? Decorativas com alt=""?', ratingScale: '1.0=excelentes; 0.75=maioria bons; 0.5=alguns descritivos; 0.25=maioria genéricos; 0.0=todos ausentes', evidenceGuidelines: 'Cite exemplos de alt texts.' },
  { ruleKey: 'seo.links.internal_structure', category: 'structure_links', title: 'Estrutura de Links Internos', description: 'Navegação interna adequada com anchor text descritivo?', whatToLookFor: 'Links internos relevantes? Breadcrumbs? Anchor text descritivo ou "clique aqui"?', ratingScale: '1.0=excelente; 0.75=boa; 0.5=funcional; 0.25=pobre; 0.0=sem links', evidenceGuidelines: 'Descreva a navegação encontrada.' },
  { ruleKey: 'seo.schemas.rich_result_potential', category: 'schemas', title: 'Potencial de Rich Results', description: 'Dados estruturados adequados para rich results?', whatToLookFor: 'Tipos de schema relevantes (Organization, Product, FAQ)? Propriedades obrigatórias preenchidas?', ratingScale: '1.0=completo e otimizado; 0.75=bom; 0.5=básico; 0.25=incompleto; 0.0=sem schema', evidenceGuidelines: 'Liste tipos de schema encontrados.' },
  { ruleKey: 'seo.performance.mobile_friendly', category: 'mobile_accessibility', title: 'Mobile Friendliness', description: 'Viewport configurado? Estrutura sugere responsividade?', whatToLookFor: 'Viewport presente? Conteúdo parece responsivo? Links com tamanho para toque?', ratingScale: '1.0=viewport + estrutura responsiva; 0.75=viewport presente; 0.5=apenas viewport; 0.0=sem viewport', evidenceGuidelines: 'Indique presença de viewport.' },
];

const GEO_CRITERIA: CriterionDefinition[] = [
  { ruleKey: 'geo.access.oai_searchbot_blocked', category: 'access_recoverability', title: 'Acesso OAI-SearchBot', description: 'Crawler OAI-SearchBot tem acesso?', whatToLookFor: 'Cabeçalhos HTTP e metadados indicam acesso permitido?', ratingScale: '1.0=permitido; 0.5=não verificado; 0.0=bloqueado', evidenceGuidelines: 'Cite cabeçalhos ou meta robots.' },
  { ruleKey: 'geo.access.claude_searchbot_blocked', category: 'access_recoverability', title: 'Acesso Claude-SearchBot', description: 'Crawler Claude-SearchBot tem acesso?', whatToLookFor: 'Cabeçalhos HTTP indicam acesso?', ratingScale: '1.0=permitido; 0.5=não verificado; 0.0=bloqueado', evidenceGuidelines: 'Cite cabeçalhos HTTP.' },
  { ruleKey: 'geo.entity.organization_identified', category: 'entity_offer_clarity', title: 'Organização identificada', description: 'Nome da organização claramente visível no conteúdo?', whatToLookFor: 'Nome da empresa no título, H1, primeiro parágrafo. Inequívoco, não inferido.', ratingScale: '1.0=claramente visível; 0.75=mencionado; 0.5=apenas metadados/rodapé; 0.25=ambíguo; 0.0=ausente', evidenceGuidelines: 'Cite o trecho exato.' },
  { ruleKey: 'geo.entity.offer_clarity', category: 'entity_offer_clarity', title: 'Oferta clara', description: 'Produto/serviço principal descrito sem ambiguidade?', whatToLookFor: 'Oferta explícita — "soluções" genérico não basta.', ratingScale: '1.0=claramente descrita; 0.75=descrita com alguma ambiguidade; 0.5=genérica; 0.25=sugerida; 0.0=ausente', evidenceGuidelines: 'Cite o trecho da oferta.' },
  { ruleKey: 'geo.completeness.problem_solved', category: 'completeness', title: 'Problema resolvido', description: 'Explica qual problema/necessidade resolve?', whatToLookFor: 'Dor/desafio do cliente explicitado? Ex: "redução de paradas", "economia de energia".', ratingScale: '1.0=claramente explicitado; 0.75=superficialmente; 0.5=implícito; 0.25=vago; 0.0=ausente', evidenceGuidelines: 'Cite o trecho do problema.' },
  { ruleKey: 'geo.completeness.applications', category: 'completeness', title: 'Aplicações e setores', description: 'Menciona aplicações específicas ou setores?', whatToLookFor: 'Setores industriais (alimentício, farmacêutico) ou aplicações concretas.', ratingScale: '1.0=aplicações específicas com exemplos; 0.75=setores mencionados; 0.5=genérico; 0.25=implícito; 0.0=ausente', evidenceGuidelines: 'Liste aplicações/setores.' },
  { ruleKey: 'geo.completeness.specifications', category: 'completeness', title: 'Especificações técnicas', description: 'Contém especificações técnicas (dimensões, capacidades, normas)?', whatToLookFor: 'Números com unidades (bar, mm, kW), normas (ISO, ABNT).', ratingScale: '1.0=detalhadas; 0.75=algumas; 0.5=limitadas; 0.25=vagas; 0.0=ausentes', evidenceGuidelines: 'Cite especificações encontradas.' },
  { ruleKey: 'geo.completeness.faq_relevant', category: 'completeness', title: 'FAQ relevante', description: 'Perguntas e respostas cobrindo dúvidas comuns?', whatToLookFor: 'Seções de FAQ, Q&A, parágrafos pergunta-resposta.', ratingScale: '1.0=completa e relevante; 0.75=algumas perguntas; 0.5=implícitas; 0.0=ausente', evidenceGuidelines: 'Cite exemplos de perguntas.' },
  { ruleKey: 'geo.authority.author_identified', category: 'authority_evidence', title: 'Autor identificado', description: 'Autoria ou responsável técnico indicado?', whatToLookFor: 'Nome de autor, credenciais, "por [nome]", "escrito por".', ratingScale: '1.0=autor com credenciais; 0.75=mencionado; 0.5=departamento citado; 0.0=sem identificação', evidenceGuidelines: 'Cite nome/credencial do autor.' },
  { ruleKey: 'geo.authority.evidence_present', category: 'authority_evidence', title: 'Evidências de autoridade', description: 'Cases, certificações, clientes, fotos próprias?', whatToLookFor: 'Clientes reais, ISO, cases mensuráveis, fotos de instalações, depoimentos.', ratingScale: '1.0=múltiplas evidências concretas; 0.75=uma evidência forte; 0.5=genéricas; 0.25=claims sem prova; 0.0=ausente', evidenceGuidelines: 'Liste cada evidência.' },
  { ruleKey: 'geo.citability.direct_answers', category: 'semantic_citability', title: 'Respostas diretas', description: 'Parágrafos que respondem diretamente a perguntas comuns?', whatToLookFor: 'Respostas a "O que é?", "Onde atende?", "Como funciona?", "Quanto custa?".', ratingScale: '1.0=múltiplas respostas diretas; 0.75=algumas; 0.5=parcialmente implícitas; 0.25=narrativa, sem respostas; 0.0=não estruturado', evidenceGuidelines: 'Cite parágrafos de resposta direta.' },
  { ruleKey: 'geo.citability.headings_descriptive', category: 'semantic_citability', title: 'Headings descritivos', description: 'Headings formam esqueleto semântico informativo?', whatToLookFor: 'H1-H4 descrevem conteúdo adequadamente? Ou genéricos ("Saiba mais")?', ratingScale: '1.0=índice informativo completo; 0.75=maioria descritiva; 0.5=parcialmente; 0.25=maioria genéricos; 0.0=ausentes/genéricos', evidenceGuidelines: 'Liste headings e classifique.' },
  { ruleKey: 'geo.local_commercial.how_to_buy', category: 'local_commercial', title: 'Como contratar', description: 'Indica claramente como contratar/comprar?', whatToLookFor: 'CTAs: "Solicite orçamento", "Entre em contato", formulários, telefone de vendas.', ratingScale: '1.0=CTA claro e múltiplos canais; 0.75=CTA presente; 0.5=contato sem CTA; 0.25=difícil encontrar; 0.0=sem indicação', evidenceGuidelines: 'Cite o CTA ou contato comercial.' },
  { ruleKey: 'geo.entity.region_mentioned', category: 'local_commercial', title: 'Região de atuação', description: 'Menciona região geográfica de atuação?', whatToLookFor: 'Cidades, estados, "Atendemos todo o Brasil", "São Paulo e região".', ratingScale: '1.0=claramente especificada; 0.75=mencionada; 0.5=implícita; 0.0=ausente', evidenceGuidelines: 'Cite o trecho da região.' },
  { ruleKey: 'geo.transparency.contact_visible', category: 'freshness_transparency', title: 'Contato e transparência', description: 'Telefone, email, endereço físico visíveis?', whatToLookFor: 'Dados de contato completos, CNPJ, políticas de privacidade.', ratingScale: '1.0=contato completo; 0.75=contato parcial; 0.5=apenas formulário; 0.25=mínimo; 0.0=sem contato', evidenceGuidelines: 'Liste informações de contato.' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// SYSTEM PROMPT
// ═══════════════════════════════════════════════════════════════════════════════

const SYSTEM_PROMPT = `Você é o motor de avaliação GEO/SEO do B2 GEO/SEO Analyzer, plataforma de auditoria B2B industrial.
PRINCÍPIOS: 1) Baseie-se APENAS no conteúdo fornecido 2) Cite evidências textuais exatas 3) Use a escala específica de cada critério 4) Indique confiança (0-1) 5) Liste o que está ausente 6) Explique em português (1-2 frases)
FORMATO: Retorne APENAS JSON válido: {"evaluations":[{"ruleKey":"...","rating":0.75,"confidence":0.9,"evidence":["trecho exato"],"missing":["o que falta"],"explanation":"..."}]}`;

// ═══════════════════════════════════════════════════════════════════════════════
// SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

@Injectable()
export class AISemanticService {
  private primaryApiKey: string | null = null;
  private primaryBaseUrl: string;
  private primaryModel: string;
  private fallbackApiKey: string | null = null;
  private fallbackBaseUrl: string | null = null;
  private fallbackModel: string | null = null;
  private available: boolean = false;

  constructor() {
    // Provedor primário
    this.primaryApiKey = process.env['OPENAI_API_KEY'] ?? null;
    this.primaryBaseUrl = process.env['OPENAI_BASE_URL'] ?? 'https://api.openai.com/v1';
    this.primaryModel = process.env['OPENAI_MODEL'] ?? 'gpt-4o-mini';

    // Provedor de fallback
    this.fallbackApiKey = process.env['OPENAI_FALLBACK_API_KEY'] ?? null;
    this.fallbackBaseUrl = process.env['OPENAI_FALLBACK_BASE_URL'] ?? null;
    this.fallbackModel = process.env['OPENAI_FALLBACK_MODEL'] ?? null;

    if (!this.primaryApiKey) {
      Logger.error('❌ OPENAI_API_KEY não configurada — análise semântica GEO NÃO funcionará');
      this.available = false;
    } else {
      Logger.log(`🧠 IA Primária: ${this.primaryModel} @ ${this.primaryBaseUrl}`);
      if (this.fallbackApiKey) {
        Logger.log(`🔄 IA Fallback: ${this.fallbackModel} @ ${this.fallbackBaseUrl}`);
      }
      this.available = true;
    }
  }

  isAvailable(): boolean { return this.available; }

  async evaluateBatch(url: string, title: string, description: string, headings: string, textSample: string): Promise<BatchEvaluationResult> {
    if (!this.available) {
      throw new Error('OPENAI_API_KEY não configurada. Configure no .env.');
    }

    const allCriteria = [...SEO_QUALITY_CRITERIA, ...GEO_CRITERIA];
    const userPrompt = this.buildBatchPrompt(allCriteria, url, title, description, headings, textSample);

    // Tenta provedor primário, depois fallback
    const providers = [
      { apiKey: this.primaryApiKey!, baseUrl: this.primaryBaseUrl, model: this.primaryModel, name: 'primary' },
      ...(this.fallbackApiKey ? [{ apiKey: this.fallbackApiKey, baseUrl: this.fallbackBaseUrl!, model: this.fallbackModel!, name: 'fallback' }] : []),
    ];

    let lastError: Error | null = null;

    for (const provider of providers) {
      try {
        const startTime = Date.now();
        const response = await this.callLLM(provider.apiKey, provider.baseUrl, provider.model, userPrompt);
        const parsed = this.parseBatchResponse(response, allCriteria);
        const latencyMs = Date.now() - startTime;

        Logger.log(`🧠 IA (${provider.name}): ${parsed.evaluations.length} critérios em ${latencyMs}ms (${provider.model})`);

        return {
          ...parsed,
          modelUsed: provider.model,
          provider: provider.baseUrl.includes('deepseek') ? 'deepseek' : provider.baseUrl.includes('azure') ? 'azure' : 'openai',
          latencyMs,
        };
      } catch (err: any) {
        lastError = err;
        Logger.warn(`⚠️ IA ${provider.name} falhou: ${err.message}`);
      }
    }

    throw lastError || new Error('Todos os provedores de IA falharam');
  }

  private buildBatchPrompt(allCriteria: CriterionDefinition[], url: string, title: string, description: string, headings: string, textSample: string): string {
    const criteriaList = allCriteria.map((c) =>
      `### ${c.ruleKey} — ${c.title}\nCategoria: ${c.category}\nO que procurar: ${c.whatToLookFor}\nEscala: ${c.ratingScale}\nEvidência: ${c.evidenceGuidelines}`
    ).join('\n\n');

    return `## PÁGINA\nURL: ${url}\nTítulo: ${title}\nDescription: ${description}\nHeadings: ${headings}\n\nCONTEÚDO (4000 chars):\n${textSample.substring(0, 4000)}\n\n## CRITÉRIOS (${allCriteria.length} — avalie TODOS)\n${criteriaList}\n\nRetorne APENAS JSON com array "evaluations" contendo TODOS os ${allCriteria.length} critérios.`;
  }

  private async callLLM(apiKey: string, baseUrl: string, model: string, prompt: string, retries = 2): Promise<string> {
    for (let attempt = 0; attempt <= retries; attempt++) {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          ...(baseUrl.includes('azure') ? { 'api-key': apiKey } : {}),
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: prompt },
          ],
          temperature: 0.1,
          max_tokens: 4000,
          ...(model.includes('gpt') ? { response_format: { type: 'json_object' } } : {}),
        }),
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        if (response.status === 429 && attempt < retries) {
          await new Promise(r => setTimeout(r, 2000));
          continue;
        }
        throw new Error(`API ${response.status}: ${errText.substring(0, 150)}`);
      }

      const data: any = await response.json();
      return data.choices?.[0]?.message?.content ?? '';
    }
    throw new Error('Todas as tentativas de API falharam');
  }

  /**
   * Parser JSON robusto — tolera JSON malformado do DeepSeek e outros modelos
   */
  private parseBatchResponse(text: string, expectedCriteria: CriterionDefinition[]): { evaluations: SemanticEvaluationResult[]; overallNotes?: string } {
    // Estratégia 1: JSON.parse direto
    let parsed = this.tryParseJson(text);

    // Estratégia 2: Extrair JSON de markdown code blocks
    if (!parsed) {
      const mdMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (mdMatch) parsed = this.tryParseJson(mdMatch[1]);
    }

    // Estratégia 3: Encontrar o maior objeto JSON no texto
    if (!parsed) {
      const matches = text.match(/\{[\s\S]*\}/g);
      if (matches) {
        // Tentar do maior para o menor
        for (const m of matches.sort((a, b) => b.length - a.length)) {
          parsed = this.tryParseJson(m);
          if (parsed) break;
        }
      }
    }

    // Estratégia 4: Reparar JSON quebrado (vírgulas faltantes, aspas não escapadas)
    if (!parsed) {
      const repaired = this.repairJson(text);
      if (repaired) parsed = this.tryParseJson(repaired);
    }

    if (!parsed || !parsed.evaluations) {
      Logger.warn(`⚠️ JSON inválido após 4 estratégias. Resposta: ${text.substring(0, 200)}`);
      return { evaluations: expectedCriteria.map(c => ({
        ruleKey: c.ruleKey, rating: 0.5, confidence: 0.1,
        evidence: [], missing: ['JSON inválido da IA'],
        explanation: 'O modelo retornou JSON malformado. Avaliação neutra atribuída.',
      })) };
    }

    const evaluations: SemanticEvaluationResult[] = (parsed.evaluations || []).map((e: any) => ({
      ruleKey: e.ruleKey ?? 'unknown',
      rating: Math.max(0, Math.min(1, Number(e.rating) || 0.5)),
      confidence: Math.max(0, Math.min(1, Number(e.confidence) || 0.5)),
      evidence: Array.isArray(e.evidence) ? e.evidence.filter((x: any) => typeof x === 'string') : [],
      missing: Array.isArray(e.missing) ? e.missing.filter((x: any) => typeof x === 'string') : [],
      explanation: String(e.explanation || 'Sem explicação'),
    }));

    // Completar critérios faltantes
    const evaluatedKeys = new Set(evaluations.map(e => e.ruleKey));
    for (const c of expectedCriteria) {
      if (!evaluatedKeys.has(c.ruleKey)) {
        evaluations.push({
          ruleKey: c.ruleKey, rating: 0.5, confidence: 0.1,
          evidence: [], missing: ['Não avaliado pelo modelo'],
          explanation: 'Critério não retornado pela IA.',
        });
      }
    }

    Logger.log(`✅ Parse: ${evaluations.length} critérios (${Array.from(evaluatedKeys).length} da IA, ${expectedCriteria.length - evaluatedKeys.size} preenchidos)`);
    return { evaluations, overallNotes: parsed.overallNotes };
  }

  private tryParseJson(text: string): any {
    try { return JSON.parse(text); } catch { return null; }
  }

  /**
   * Repara JSON quebrado — problemas comuns do DeepSeek:
   * - Vírgulas faltantes entre elementos de array
   * - Aspas não escapadas em strings
   * - Strings multilinha sem escape
   */
  private repairJson(text: string): string | null {
    try {
      let cleaned = text.trim();

      // Extrair a região do JSON
      const start = cleaned.indexOf('{');
      const end = cleaned.lastIndexOf('}');
      if (start === -1 || end === -1) return null;
      cleaned = cleaned.substring(start, end + 1);

      // Estratégia: usar eval como último recurso (controlado, apenas para JSON-like)
      // Substituir quebras de linha em strings por espaços
      cleaned = cleaned.replace(/\n/g, ' ').replace(/\r/g, '');

      // Tentar consertar vírgulas faltantes: "]\n  {" → "],\n  {"
      cleaned = cleaned.replace(/\]\s*\{/g, '],{');
      cleaned = cleaned.replace(/\}\s*\{/g, '},{');
      cleaned = cleaned.replace(/"\s*\n\s*"/g, '","');

      // Remover trailing commas
      cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');

      // Tentar parse
      try { JSON.parse(cleaned); return cleaned; } catch { return null; }
    } catch {
      return null;
    }
  }
}