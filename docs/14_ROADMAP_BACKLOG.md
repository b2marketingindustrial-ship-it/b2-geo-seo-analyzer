# 14 — Roadmap e Backlog Inicial

## 1. Estratégia de entrega

O roadmap é organizado por resultado, não apenas por componente. A ordem busca validar valor com baixo risco antes de ampliar crawl e AI Visibility.

## 2. Fase 0 — Descoberta e fundação

### Objetivos

- validar metodologia;
- congelar escopo do MVP;
- criar fixtures;
- definir identidade e modelo comercial;
- preparar arquitetura e repositório.

### Entregas

- PRD aprovado;
- protótipo de UX;
- ruleset SEO/GEO v0;
- dataset de calibração;
- monorepo;
- CI;
- ambientes;
- autenticação básica;
- esquema inicial.

### Critério de saída

- equipe consegue criar projeto e executar analisadores em fixtures por CLI/teste.

## 3. Fase 1 — MVP de página

### Objetivos

Analisar página atual e gerar relatório explicável.

### Entregas

- extensão side panel;
- captura sanitizada;
- API de análise;
- coleta HTTP e renderizada;
- rules engine;
- SEO Score;
- GEO Score;
- findings/evidências;
- plano de ação;
- dashboard;
- histórico;
- PDF.

### Critério de saída

- beta com 10 clientes/páginas diversas;
- consistência e segurança aprovadas;
- relatório percebido como acionável.

## 4. Fase 2 — Auditoria de domínio e integrações

### Entregas

- crawler de domínio;
- sitemap/frontier;
- grafo de links;
- duplicidade;
- links quebrados;
- canibalização potencial;
- Search Console;
- comparação de páginas;
- agendamento;
- alertas;
- colaboração em tarefas.

## 5. Fase 3 — AI Visibility

### Entregas

- biblioteca de prompts;
- adapters OpenAI/Anthropic/Gemini;
- citações;
- menções;
- concorrentes;
- score com amostra mínima;
- histórico;
- orçamento;
- relatórios.

## 6. Fase 4 — Agency/Enterprise

- white-label;
- SSO;
- permissões avançadas;
- webhooks;
- API pública;
- B2 Hub;
- relatórios customizados;
- SLAs;
- regiões de dados;
- regras customizadas.

## 7. Épicos do MVP

### EPIC-01 — Identidade e organizações

- cadastro/login;
- organização;
- memberships;
- RBAC;
- auditoria básica.

### EPIC-02 — Projetos

- CRUD;
- domínio;
- perfil da empresa;
- entidades;
- concorrentes;
- configurações.

### EPIC-03 — Extensão

- Manifest V3;
- side panel;
- auth;
- captura;
- sanitização;
- envio;
- resultados;
- destaque.

### EPIC-04 — Orquestração

- analysis run;
- filas;
- progresso;
- retries;
- cancelamento;
- partial completion.

### EPIC-05 — Coleta remota

- HTTP;
- headers;
- redirects;
- Playwright;
- robots;
- sitemap;
- artifacts.

### EPIC-06 — Regras SEO

- catálogo;
- facts;
- regras;
- findings;
- score;
- fixtures.

### EPIC-07 — Regras GEO

- crawlers IA;
- entidade;
- oferta;
- completude;
- autoridade;
- citabilidade;
- semântico.

### EPIC-08 — Plano de ação

- geração;
- prioridade;
- edição;
- status;
- export CSV.

### EPIC-09 — Dashboard e relatório

- overview;
- relatório;
- filtros;
- evidência;
- comparação;
- PDF.

### EPIC-10 — Segurança e operação

- tenant;
- SSRF;
- secrets;
- logs;
- backups;
- CI/CD;
- observabilidade.

## 8. Backlog priorizado do MVP

### P0 — Fundação

1. criar monorepo e conventions;
2. configurar CI e lint/typecheck;
3. subir Postgres/Redis/MinIO local;
4. implementar organizations/users/memberships;
5. implementar tenant guard;
6. criar schema e migrations;
7. criar catálogo de rulesets;
8. criar facts contracts;
9. criar fixtures/golden tests;
10. implementar proteção SSRF.

### P1 — Fluxo de valor

11. criar projeto;
12. criar analysis run;
13. enfileirar módulos;
14. coletar URL por HTTP;
15. coletar DOM com Playwright;
16. extrair metadados/headings/links/imagens/schema;
17. implementar primeiras 25 regras SEO;
18. implementar primeiras 20 regras GEO determinísticas;
19. calcular scores/cobertura/confiança;
20. listar findings;
21. gerar action plan;
22. criar relatório web;
23. criar extensão side panel;
24. captura sanitizada;
25. exibir resultado parcial;
26. localizar evidência.

### P2 — Qualidade comercial

27. Lighthouse mobile;
28. análise semântica estruturada;
29. export PDF;
30. comparação histórica;
31. convite de usuários;
32. uso/limites;
33. telemetria;
34. onboarding;
35. páginas de privacidade e bot;
36. beta feedback.

### P3 — Pós-MVP imediato

37. crawl de domínio;
38. Search Console;
39. tarefas colaborativas;
40. schedules;
41. alertas;
42. AI Visibility exploratório.

## 9. User stories essenciais

### US-001

Como analista, quero criar um projeto com domínio e perfil da empresa para contextualizar as análises.

**Aceite:** domínio validado, organização associada e entidades salvas.

### US-002

Como usuário da extensão, quero analisar a aba atual para receber SEO e GEO Scores.

**Aceite:** resultado parcial local e conclusão remota com progresso.

### US-003

Como desenvolvedor, quero ver o elemento e a correção para executar a tarefa sem interpretar um alerta genérico.

**Aceite:** finding com seletor/evidência, recomendação e critério de aceite.

### US-004

Como gestor, quero ver os cinco principais riscos e ganhos rápidos.

**Aceite:** dashboard priorizado, sem exigir leitura de todos os findings.

### US-005

Como analista, quero gerar um plano de ação para transformar problemas em tarefas.

**Aceite:** ações deduplicadas, prioridade, esforço e disciplina.

### US-006

Como usuário, quero reanalisar e ver o que foi resolvido.

**Aceite:** comparação por regra com estados de mudança.

### US-007

Como administrador, quero garantir que usuários de outra organização não acessem dados do meu cliente.

**Aceite:** suíte cross-tenant e autorização.

## 10. Dependências críticas

- identidade visual e nome final;
- domínio do produto;
- definição de planos;
- conta Chrome Web Store;
- contas de cloud;
- provedores de IA para fase 3;
- revisão jurídica;
- especialistas para calibração.

## 11. Time mínimo sugerido

- Product Owner/Especialista SEO-GEO;
- Tech Lead full-stack;
- Desenvolvedor full-stack;
- Desenvolvedor crawler/backend;
- UX/UI part-time;
- QA/automação part-time;
- DevOps/Security part-time;
- especialista de conteúdo industrial para calibração.

Em equipe menor, as funções podem ser acumuladas, mas segurança, scoring e crawler exigem revisão dedicada.

## 12. Marcos

- M0: metodologia e arquitetura aprovadas;
- M1: análise CLI em fixtures;
- M2: API e dashboard internos;
- M3: extensão alpha;
- M4: beta fechado;
- M5: MVP comercial;
- M6: crawl de domínio;
- M7: AI Visibility.

## 13. Definition of Done por história

- aceite automatizado quando possível;
- tenant e segurança;
- observabilidade;
- documentação;
- testes;
- UX de erro;
- analytics de produto;
- feature flag se experimental;
- revisão de copy metodológica.

## 14. Primeira sprint recomendada

1. monorepo;
2. Docker local;
3. CI;
4. contratos de facts/findings;
5. schema inicial;
6. rules engine puro;
7. cinco fixtures;
8. dez regras SEO;
9. cinco regras GEO;
10. endpoint de análise com payload fixture;
11. tela simples de resultado.

Objetivo: provar o ciclo `facts → findings → score → action plan` antes de investir no crawler completo.

