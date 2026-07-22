# 06 — Modelo de Pontuação

## 1. Objetivo

O modelo deve transformar verificações em indicadores compreensíveis sem esconder a complexidade. A nota é um resumo; findings, cobertura e confiança são a fonte principal de decisão.

## 2. Scores

- `seo_score`: preparação para mecanismos tradicionais;
- `geo_score`: preparação para mecanismos generativos;
- `ai_visibility_score`: presença observada em testes configurados;
- `discoverability_score`: consolidado opcional;
- `confidence_score`: confiança no resultado;
- `coverage_score`: percentual do escopo efetivamente testado.

## 3. Estrutura de categoria

Cada categoria possui:

- chave;
- nome;
- peso;
- regras;
- cap de penalidade;
- pré-condições;
- versão;
- score;
- cobertura;
- confiança.

## 4. SEO Score

### 4.1 Pesos do MVP

| Categoria | Peso |
|---|---:|
| Rastreamento e indexabilidade | 18 |
| Metadados e relevância on-page | 15 |
| Conteúdo e intenção | 18 |
| Estrutura e links internos | 12 |
| Imagens e mídia | 7 |
| Dados estruturados | 8 |
| Performance e experiência | 15 |
| Mobile e acessibilidade essencial | 7 |
| **Total** | **100** |

### 4.2 Evolução de domínio

No crawl completo, os pesos podem incluir arquitetura, duplicidade e cobertura. O sistema deve utilizar um ruleset diferente ou subscore específico, não alterar silenciosamente a análise de página.

## 5. GEO Readiness Score

| Categoria | Peso |
|---|---:|
| Acesso e recuperabilidade | 12 |
| Clareza da entidade e oferta | 16 |
| Completude de resposta | 20 |
| Autoridade, experiência e evidências | 20 |
| Estrutura semântica e citabilidade | 10 |
| Dados estruturados e identidade | 8 |
| Contexto local e comercial | 8 |
| Atualização e transparência | 6 |
| **Total** | **100** |

## 6. AI Visibility Score

| Categoria | Peso |
|---|---:|
| Frequência de menção | 30 |
| Cobertura de temas/prompts | 20 |
| Citação ou link para o domínio | 20 |
| Proeminência na resposta | 10 |
| Precisão da representação | 10 |
| Diversidade de provedores | 5 |
| Estabilidade temporal | 5 |
| **Total** | **100** |

Essa nota exige amostra mínima. Se a amostra for insuficiente, mostrar score provisório e baixa confiança.

## 7. Modelo de regra

```ts
interface ScoringRule {
  key: string;
  version: string;
  scoreType: 'seo' | 'geo' | 'ai_visibility';
  categoryKey: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  maxPenalty: number;
  evaluationType: 'deterministic' | 'semantic' | 'external';
  preconditions: RuleCondition[];
  evaluator: string;
  confidenceBase: number;
  remediationTemplateKey: string;
  exclusionGroup?: string;
  categoryPenaltyCap?: number;
}
```

## 8. Cálculo por regra

Cada regra retorna `quality_ratio` entre 0 e 1:

- 1,00: totalmente atendida;
- 0,75: atendida com pequena oportunidade;
- 0,50: parcialmente atendida;
- 0,25: baixa qualidade;
- 0,00: falha.

```text
rule_points = available_points × quality_ratio
```

Para regras binárias, usar 0 ou 1. Para métricas contínuas, usar curvas configuradas.

## 9. Cálculo de categoria

```text
category_score = 100 × earned_points / applicable_points
weighted_category = category_score × category_weight / 100
```

Regras não aplicáveis saem de `applicable_points`.

## 10. Cálculo final

```text
score = Σ weighted_category
```

Limitar entre 0 e 100 e arredondar apenas na apresentação.

## 11. Caps e dupla penalização

Exemplo: title ausente gera efeitos em relevância e compartilhamento, porém a mesma ausência não deve descontar várias vezes sem limite.

Mecanismos:

- `exclusion_group`;
- cap por categoria;
- cap por causa raiz;
- findings derivados sem penalidade adicional;
- regra principal e regras informativas.

## 12. Critical gates

Algumas falhas limitam a nota máxima:

| Condição | Limite sugerido |
|---|---:|
| Página retorna 5xx persistente | 10 |
| Página não contém conteúdo utilizável | 15 |
| `noindex` explícito em página que deveria ser pública | 35 |
| Bloqueio total ao crawler próprio | 40 |
| Redirecionamento em loop | 10 |
| Página exige autenticação e análise é pública | Sem score público; marcar não testável |

O gate deve ser claramente explicado e configurável por tipo de página. Um `noindex` intencional não é falha quando o usuário marca a página como não destinada a busca.

## 13. Cobertura

```text
coverage = tested_applicable_weight / total_expected_weight
```

Exemplo:

- performance não executada: categoria não penaliza diretamente, mas cobertura cai;
- análise externa não habilitada: GEO on-page continua válido, consistência externa fica não testada.

## 14. Confiança por regra

Base sugerida:

- determinística sobre HTML/header: 0,95–1,00;
- heurística DOM: 0,80–0,95;
- semântica com evidência clara: 0,65–0,90;
- inferência externa: 0,50–0,85;
- resultado de IA generativa isolado: 0,40–0,70.

A confiança final pondera cobertura e concordância.

## 15. Curvas de métricas

Não utilizar somente limites rígidos para todas as métricas. Exemplo de title:

- ausente: 0;
- presente, mas genérico ou desconectado: avaliação semântica;
- comprimento é warning, não prova isolada de qualidade;
- truncamento potencial depende de pixels e contexto.

Performance utiliza métricas do Lighthouse e, quando disponível, dados reais. Manter o score do Lighthouse separado do score SEO proprietário.

## 16. Regras SEO iniciais

### Rastreamento e indexabilidade

- status válido;
- redirect sem loop;
- HTTPS;
- meta robots;
- X-Robots-Tag;
- robots para crawlers;
- canonical;
- sitemap;
- conteúdo renderizável;
- URL consistente.

### On-page

- title presente, único no domínio e alinhado;
- description presente e útil;
- H1 claro;
- headings estruturados;
- conteúdo principal suficiente para intenção;
- idioma;
- links internos;
- âncoras descritivas;
- CTA quando comercial.

### Imagens

- alt adequado para imagens informativas;
- dimensões;
- formato e tamanho;
- lazy loading quando apropriado;
- imagem principal não adiada incorretamente.

### Schema

- parse válido;
- tipos coerentes;
- propriedades importantes;
- correspondência com conteúdo visível;
- Organization/Product/Article/Breadcrumb conforme página.

### Performance

- LCP;
- CLS;
- TBT/INP conforme fonte;
- peso total;
- JavaScript;
- imagens;
- cache;
- resposta do servidor.

## 17. Regras GEO iniciais

### Acesso

- OAI-SearchBot;
- Claude-SearchBot;
- Claude-User;
- Googlebot;
- Bingbot;
- conteúdo público e legível;
- HTML ou renderização recuperável.

### Entidade

- nome da organização;
- descrição;
- produto/serviço;
- marca;
- região;
- contato;
- relacionamento entre entidade e oferta.

### Completude

- definição;
- problema resolvido;
- aplicações;
- público/segmento;
- funcionamento;
- critérios de escolha;
- especificações;
- limitações ou condições;
- processo comercial;
- FAQ relevante.

### Autoridade

- autor;
- experiência;
- cases;
- dados;
- certificações;
- fontes;
- fotos próprias;
- referências;
- políticas e contato.

### Citabilidade

- respostas diretas;
- seções autônomas;
- headings descritivos;
- tabelas úteis;
- dados com contexto;
- claims com prova;
- datas;
- texto não escondido em imagem.

### Local/comercial

- área atendida;
- disponibilidade;
- unidade;
- como contratar;
- prazo ou processo quando relevante;
- aplicação por setor.

## 18. Avaliação semântica

A análise semântica deve retornar JSON estruturado e evidências:

```json
{
  "criterion": "offer_clarity",
  "rating": 0.75,
  "confidence": 0.84,
  "evidence": [
    {"quote": "...", "section": "..."}
  ],
  "missing": ["setores atendidos"],
  "explanation": "..."
}
```

Requisitos:

- temperature baixa;
- schema validado;
- retries limitados;
- prompt versionado;
- truncamento controlado;
- sem inventar evidência;
- pós-validação dos trechos contra snapshot.

## 19. Plano de ação e ganho potencial

Ganho potencial é calculado pela soma dos pontos recuperáveis, limitada por dependências e caps.

Deve ser apresentado como:

> “Potencial estimado de até +6 pontos nesta versão da metodologia.”

Nunca como garantia de ranking ou tráfego.

## 20. Calibração

Antes do lançamento:

1. montar conjunto de pelo menos 100 páginas variadas;
2. obter avaliações independentes de especialistas;
3. comparar regras e notas;
4. medir falsos positivos;
5. ajustar pesos;
6. congelar ruleset v1;
7. publicar changelog metodológico.

## 21. Versionamento

Formato:

```text
seo-ruleset-1.0.0
geo-ruleset-1.0.0
ai-visibility-1.0.0
```

- patch: correção sem alteração metodológica relevante;
- minor: novas regras ou ajustes limitados;
- major: mudança de pesos, categorias ou interpretação.

## 22. Critérios de aceite

- score reproduzível;
- soma de categorias igual ao score;
- regras não testadas fora do denominador de qualidade e refletidas na cobertura;
- caps aplicados corretamente;
- critical gates explicados;
- toda penalidade vinculada a finding;
- comparação histórica identifica rulesets diferentes;
- suíte de fixtures cobre bordas.

