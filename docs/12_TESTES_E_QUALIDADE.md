# 12 — Estratégia de Testes e Qualidade

## 1. Objetivos

- garantir consistência de score;
- reduzir falsos positivos;
- proteger isolamento de dados;
- validar comportamento em páginas reais e adversas;
- controlar regressões de regras;
- assegurar retomada de jobs;
- testar integrações sem depender sempre de chamadas reais.

## 2. Pirâmide

### Unitários

- parsers;
- normalizadores;
- extratores;
- regras;
- scoring;
- priorização;
- sanitização;
- adapters com fixtures.

### Integração

- API + banco;
- fila + worker;
- object storage;
- OAuth simulado;
- RLS/tenant;
- geração de relatório.

### Contrato

- OpenAPI;
- providers;
- eventos;
- payload da extensão;
- schema de resposta semântica.

### E2E

- onboarding;
- análise via extensão;
- análise via painel;
- findings;
- plano;
- exportação;
- comparação;
- conexão de integração simulada.

### Não funcionais

- carga;
- segurança;
- resiliência;
- acessibilidade;
- compatibilidade;
- custo.

## 3. Fixtures de páginas

Criar repositório de páginas sintéticas:

- página saudável;
- noindex;
- canonical errado;
- redirect loop;
- SPA;
- conteúdo somente após JS;
- schema inválido;
- múltiplos H1;
- imagem sem alt;
- conteúdo genérico;
- claim sem evidência;
- página local clara;
- página técnica completa;
- bloqueio de bots;
- robots ausente;
- sitemap quebrado;
- CSP forte;
- DOM gigante;
- shadow DOM;
- formulário com dados sensíveis preenchidos.

## 4. Golden tests do score

Para cada fixture:

- facts congelados;
- findings esperados;
- pontos esperados;
- score esperado;
- cobertura;
- confiança;
- ruleset.

Alterações nos goldens exigem revisão explícita e changelog.

## 5. Testes semânticos

Criar dataset com avaliação humana:

- clareza da oferta;
- região;
- aplicações;
- autoridade;
- evidência;
- completude;
- citabilidade.

Medir:

- concordância;
- falso positivo;
- falso negativo;
- estabilidade entre execuções;
- aderência da evidência ao texto real.

A saída do modelo deve ser validada contra JSON Schema e trechos devem existir no snapshot.

## 6. Testes do crawler

- robots allow/disallow;
- redirects;
- DNS rebinding simulado;
- IP privado;
- 429;
- timeout;
- resposta enorme;
- gzip bomb simulada;
- TLS inválido;
- sitemap index;
- facetas infinitas;
- canonical cross-domain;
- páginas duplicadas;
- cancelamento;
- retomada.

## 7. Testes de segurança

- IDOR;
- cross-tenant;
- escalonamento de papel;
- token revogado;
- CSRF;
- XSS em conteúdo coletado;
- SSRF;
- path traversal no storage;
- webhook replay;
- SQL injection;
- prompt injection;
- segredo em log;
- export com URL previsível.

## 8. Testes da extensão

- Manifest V3 válido;
- permissões;
- service worker suspenso e retomado;
- mensagem perdida;
- abas múltiplas;
- SPA navigation;
- conteúdo dinâmico;
- páginas não suportadas;
- logout;
- token expirado;
- destaque de seletor;
- sanitização de input;
- payload grande;
- modo offline temporário.

## 9. Testes de performance

### API

- p95 de endpoints síncronos;
- throughput;
- pool do banco;
- cache;
- paginação.

### Jobs

- 100 análises simultâneas;
- concorrência por host;
- fila acumulada;
- worker crash;
- retry storm;
- custo de Lighthouse;
- consumo de memória do browser.

### Banco

- listagem de findings;
- histórico;
- relatórios;
- AI Visibility por período;
- audit logs.

## 10. Testes de resiliência

- Redis indisponível;
- banco com failover;
- object storage intermitente;
- provedor de IA 429;
- API externa muda resposta;
- worker morto durante job;
- mensagem duplicada;
- deploy durante processamento.

## 11. Testes de acessibilidade

- axe automatizado;
- teclado;
- foco;
- leitores de tela em fluxos críticos;
- contraste;
- gráficos com texto;
- mensagens de erro;
- side panel em zoom.

## 12. Quality gates de CI

- lint;
- typecheck;
- unit tests;
- cobertura mínima por pacote crítico;
- OpenAPI lint;
- migrations test;
- SAST/SCA;
- secret scanning;
- build extensão;
- validação manifest;
- testes E2E essenciais;
- geração de SBOM.

## 13. Cobertura mínima sugerida

Não usar cobertura como único critério.

- scoring engine: 95% branches;
- parsers/sanitização: 90%;
- auth/tenant: 90%;
- demais módulos: 80%;
- E2E para todos os fluxos críticos.

## 14. Bug severity

- S0: incidente de segurança/perda de dados;
- S1: sistema indisponível ou score incorreto em massa;
- S2: feature principal quebrada;
- S3: comportamento parcial com workaround;
- S4: visual ou melhoria.

## 15. Critérios de liberação

- zero S0/S1 abertos;
- S2 aceitos formalmente ou corrigidos;
- migrations validadas;
- rollback testado;
- dashboards e alertas ativos;
- changelog;
- ruleset congelado;
- extensão revisada;
- custos de provedores dentro do orçamento.

## 16. Teste beta

Selecionar 10–20 projetos com:

- WordPress;
- Elementor;
- Webflow;
- sites customizados;
- e-commerce;
- SPA;
- sites industriais com catálogo;
- sites locais;
- páginas em português e inglês.

Coletar feedback sobre:

- clareza;
- utilidade;
- falso positivo;
- plano de ação;
- tempo;
- confiança;
- valor percebido.

## 17. Critérios de aceite do MVP

- fixtures determinísticas passam;
- score não muda sem ruleset ou snapshot;
- cross-tenant bloqueado;
- extensão sanitiza formulários;
- crawler bloqueia SSRF;
- jobs retomáveis;
- export consistente;
- falha externa produz estado parcial, não score falso;
- findings críticos revisados por especialista no beta.

