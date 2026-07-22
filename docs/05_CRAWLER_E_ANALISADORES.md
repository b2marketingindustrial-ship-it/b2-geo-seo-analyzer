# 05 — Crawler, Coletores e Analisadores

## 1. Objetivo

O backend complementa a extensão com coleta reproduzível, cabeçalhos HTTP, HTML original, renderização, robots, sitemap, performance e auditoria do domínio.

## 2. Princípios do crawler

- respeitar robots.txt por padrão;
- identificar-se claramente;
- evitar carga excessiva;
- limitar escopo;
- prevenir SSRF;
- manter resultados reproduzíveis;
- separar coleta de avaliação;
- registrar versão de navegador e configuração;
- suportar cancelamento e retomada.

## 3. User agent

Exemplo:

```text
B2GEOSEOAnalyzerBot/1.0 (+https://dominio-do-produto.example/bot)
```

A página do bot deve informar:

- finalidade;
- política de robots;
- contato;
- intervalos usuais;
- como bloquear;
- política de privacidade.

## 4. Modos de busca

### 4.1 HTTP simples

Usado para:

- status;
- headers;
- redirects;
- HTML original;
- robots;
- sitemap;
- recursos sem necessidade de renderização.

### 4.2 Browser renderizado

Usado quando:

- conteúdo depende de JavaScript;
- DOM original é insuficiente;
- layout e elementos visuais importam;
- é necessário observar rede;
- regras exigem dimensões renderizadas.

### 4.3 Lighthouse

Executado em worker próprio, com configuração versionada para mobile e desktop.

## 5. Segurança contra SSRF

Antes de qualquer request:

1. validar esquema `http` ou `https`;
2. normalizar hostname;
3. resolver DNS;
4. bloquear loopback, link-local, multicast, redes privadas e metadados de nuvem;
5. repetir validação a cada redirect;
6. limitar redirects;
7. bloquear portas não permitidas;
8. aplicar timeout;
9. limitar tamanho de resposta;
10. não reutilizar cookies do usuário.

Faixas bloqueadas devem incluir IPv4 e IPv6 privadas/reservadas.

## 6. Polidez e limites

Por host:

- concorrência padrão: 2;
- intervalo configurável entre requests;
- backoff em 429 e 503;
- limite de páginas;
- limite de profundidade;
- limite de bytes;
- limite de duração;
- janela de crawl;
- cancelamento pelo usuário.

## 7. Descoberta de URLs

Fontes:

- URL inicial;
- links internos;
- sitemap declarado;
- sitemaps conhecidos;
- URLs fornecidas pelo usuário;
- páginas do Search Console, quando conectado.

Normalização:

- remover fragmentos;
- normalizar host e porta;
- preservar parâmetros relevantes;
- aplicar regras configuráveis de parâmetros ignorados;
- detectar URLs equivalentes;
- respeitar canonical como sinal, não como redirect obrigatório;
- evitar armadilhas de calendário, busca infinita e facetas.

## 8. Frontier

Cada URL possui:

- prioridade;
- profundidade;
- origem de descoberta;
- status;
- próxima tentativa;
- número de tentativas;
- hash normalizado;
- motivo de exclusão.

Prioridade inicial:

1. home;
2. URLs fornecidas;
3. sitemap;
4. páginas próximas da home;
5. páginas com maior quantidade de links internos;
6. páginas restantes.

## 9. Coleta HTTP

Registrar:

- URL solicitada e final;
- status;
- cadeia de redirects;
- headers relevantes;
- content type;
- tamanho;
- tempo DNS, conexão, TLS, TTFB e total quando disponível;
- compressão;
- cache;
- `X-Robots-Tag`;
- canonical HTTP, se aplicável;
- erros TLS;
- conteúdo truncado por limite.

Remover ou mascarar:

- `Set-Cookie`;
- tokens;
- identificadores sensíveis;
- headers de autenticação.

## 10. Renderização Playwright

Configuração versionada:

- Chromium e versão;
- viewport;
- user agent;
- locale;
- timezone;
- device scale factor;
- JavaScript ligado;
- tempo máximo;
- condição de estabilização;
- bloqueio opcional de recursos pesados em modos específicos.

A coleta deve capturar:

- DOM final;
- console errors;
- requests com falha;
- recursos;
- screenshot opcional;
- sinais de consent banner;
- conteúdo após hidratação;
- diferenças entre source e rendered.

## 11. Robots.txt

O parser deve:

- buscar em `/robots.txt` na origem correta;
- seguir regras de cache configuráveis;
- analisar grupos por user agent;
- identificar `allow`, `disallow` e sitemaps;
- testar user agents relevantes;
- distinguir ausência, erro e bloqueio;
- registrar a linha/regra como evidência.

User agents avaliados no relatório:

- crawler próprio;
- Googlebot;
- Bingbot;
- OAI-SearchBot;
- GPTBot como informação separada;
- Claude-SearchBot;
- Claude-User;
- outros configuráveis.

A ferramenta deve explicar que crawler de treinamento e crawler de busca podem ter finalidades diferentes.

## 12. Sitemap

- descobrir em robots e locais padrão;
- suportar índice de sitemaps;
- validar XML;
- controlar recursão;
- registrar URLs, `lastmod` e erros;
- comparar com páginas encontradas;
- identificar URLs não indexáveis no sitemap;
- identificar URLs importantes fora do sitemap como oportunidade, não prova de erro.

## 13. Extratores de facts

### 13.1 SEO técnico

- indexabilidade combinada;
- canonical;
- hreflang;
- status;
- redirects;
- protocolos;
- sitemaps;
- duplicidade;
- mobile;
- performance.

### 13.2 Conteúdo

- título;
- description;
- headings;
- texto principal;
- navegação;
- footer;
- autoria;
- datas;
- tabelas;
- FAQs;
- CTAs;
- densidade de template versus conteúdo.

### 13.3 Entidades

- organização;
- marcas;
- produtos;
- serviços;
- localidades;
- setores;
- aplicações;
- normas;
- pessoas/autores;
- contato.

### 13.4 Evidências de autoridade

- case;
- depoimento;
- número verificável na página;
- certificação;
- parceria;
- cliente identificado;
- foto própria aparente;
- autoria técnica;
- referência externa;
- política e informações institucionais.

### 13.5 Claims

Claims são afirmações como:

- “líder de mercado”;
- “maior distribuidor”;
- “redução de 30%”;
- “atendimento 24 horas”;
- “distribuidor autorizado”;
- “mais de 20 anos”.

Cada claim deve ser classificado:

- factual;
- comparativo;
- quantitativo;
- certificação/parceria;
- opinião comercial.

O sistema procura evidência na página e, em fase posterior, em fontes externas. Ausência de evidência gera warning proporcional ao risco da afirmação, não acusação de falsidade.

## 14. Análise de conteúdo principal

Usar combinação de:

- landmarks;
- densidade textual;
- repetição entre páginas;
- árvore DOM;
- posição;
- heurísticas de boilerplate;
- avaliação semântica.

Manter trecho e caminho de origem para explicabilidade.

## 15. Lighthouse e Web Vitals

Armazenar:

- score e versão;
- métricas brutas;
- auditorias;
- oportunidades;
- dispositivo;
- condições de execução;
- origem laboratorial;
- dados de campo quando fornecidos por integração compatível.

Não apresentar uma execução laboratorial como experiência universal. Mostrar variação e contexto.

## 16. Regras de domínio

- títulos duplicados;
- descriptions duplicadas;
- H1 duplicado como sinal contextual;
- páginas com conteúdo muito similar;
- canonical conflitante;
- links internos para redirects;
- links quebrados;
- páginas profundas;
- páginas sem entrada de links no grafo rastreado;
- clusters sem página central;
- distribuição de âncoras;
- páginas de alta importância com poucos links;
- parâmetros rastreáveis em excesso;
- páginas indexáveis sem valor aparente;
- páginas relevantes bloqueadas;
- inconsistência de identidade e contato.

## 17. Detecção de canibalização

A canibalização deve ser apresentada como potencial, calculada por:

- similaridade semântica;
- títulos e H1;
- entidades;
- intenção prevista;
- consultas do Search Console, quando disponível;
- links internos e canonical.

Sem dados de consulta, usar “possível sobreposição”, nunca conclusão definitiva.

## 18. Orquestração de módulos

Dependências típicas:

```text
http_fetch -> robots/indexability
http_fetch -> source_extractors
browser_render -> rendered_extractors
source_extractors + rendered_extractors -> diff
facts -> deterministic_rules
facts -> semantic_analysis
all_findings -> scoring
scores + findings -> action_plan
```

## 19. Timeouts sugeridos

- HTTP page: 20 s;
- browser navigation: 45 s;
- stabilization: 10 s adicionais;
- Lighthouse: 120 s;
- semantic analysis: conforme provedor, máximo configurado;
- domínio: orçamento total configurável.

## 20. Critérios de aceite

- respeitar robots por padrão;
- bloquear SSRF em testes;
- retomar job após falha transitória;
- registrar redirects e headers;
- distinguir HTML original de renderizado;
- não armazenar cookies;
- manter versão de navegador/configuração;
- produzir fatos normalizados;
- executar fixtures com resultado determinístico.

