# 17 — Guia para Iniciar o Desenvolvimento

## 1. Objetivo da primeira entrega técnica

Antes de construir o crawler completo ou integrar modelos de IA, provar este ciclo:

```text
facts de uma página
→ avaliação de regras
→ findings com evidência
→ SEO/GEO Scores
→ plano de ação
→ relatório na interface
```

Esse vertical slice reduz o maior risco do produto: produzir notas sem explicabilidade.

## 2. Pré-requisitos

- Git;
- Node.js LTS compatível com a stack escolhida;
- pnpm;
- Docker e Docker Compose;
- Chrome para testes da extensão;
- conta GitHub;
- editor com TypeScript, ESLint e Prettier.

Versões exatas devem ser fixadas no repositório por `.nvmrc`/Volta e `packageManager`.

## 3. Criar monorepo

Estrutura inicial:

```text
apps/api
apps/dashboard
apps/extension
apps/worker-crawler
apps/worker-lighthouse
apps/worker-ai
packages/contracts
packages/scoring-engine
packages/analyzers
packages/ui
packages/config
packages/testing
```

## 4. Pacotes compartilhados

### `@b2/contracts`

- facts;
- findings;
- scores;
- events;
- API DTOs;
- schemas Zod/JSON Schema;
- versionamento.

### `@b2/scoring-engine`

- ruleset loader;
- rule evaluator interface;
- category calculator;
- caps;
- gates;
- confidence;
- comparison.

### `@b2/analyzers`

- HTML metadata;
- headings;
- links;
- images;
- schemas;
- robots parser;
- sitemap parser;
- semantic adapter interface.

### `@b2/testing`

- fixtures;
- factories;
- mocks;
- golden assertions.

## 5. Ordem de implementação

### Passo 1 — Contratos

Criar:

```ts
NormalizedFacts
RuleEvaluation
Finding
Evidence
ScoreResult
ActionItem
AnalyzerResult
```

Validar na borda com schemas runtime.

### Passo 2 — Rules engine puro

Entrada: facts JSON + ruleset JSON.  
Saída: findings + scores.

Sem banco, HTTP ou modelo de IA.

### Passo 3 — Fixtures

Criar cinco páginas:

1. saudável;
2. noindex;
3. title/H1 genéricos;
4. schema inválido;
5. página industrial completa com evidências.

### Passo 4 — API mínima

- criar projeto;
- enviar facts;
- criar analysis run;
- calcular;
- consultar findings/scores.

### Passo 5 — Dashboard mínimo

- lista de projetos;
- botão de análise por fixture/URL;
- cards;
- findings;
- plano gerado.

### Passo 6 — Extensão alpha

- side panel;
- `activeTab`;
- extrair facts;
- enviar;
- exibir resultado.

### Passo 7 — Crawler remoto

- SSRF primeiro;
- HTTP;
- Playwright;
- robots;
- artifacts.

### Passo 8 — Lighthouse

Worker separado e resultado normalizado.

### Passo 9 — Semântico

Provider mock primeiro; depois provedor real com output estruturado.

## 6. Comandos sugeridos

```bash
pnpm install
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm db:migrate
pnpm db:seed
pnpm extension:build
```

## 7. Convenções

### Branches

- `main`: produção;
- `develop` opcional;
- `feat/...`;
- `fix/...`;
- `chore/...`.

### Commits

Conventional Commits.

### Pull request

- objetivo;
- escopo;
- screenshots;
- testes;
- risco;
- migration;
- observabilidade;
- rollback.

## 8. Configuração local

Serviços:

- PostgreSQL `5432`;
- Redis `6379`;
- MinIO `9000/9001`;
- Mailpit `1025/8025`;
- API `3001`;
- dashboard `3000`.

Nunca reutilizar credenciais locais em produção.

## 9. Variáveis essenciais

- `DATABASE_URL`;
- `REDIS_URL`;
- `OBJECT_STORAGE_ENDPOINT`;
- `OBJECT_STORAGE_BUCKET`;
- `OBJECT_STORAGE_ACCESS_KEY`;
- `OBJECT_STORAGE_SECRET_KEY`;
- `AUTH_ISSUER`;
- `AUTH_AUDIENCE`;
- `ENCRYPTION_MASTER_KEY`;
- `PUBLIC_API_URL`;
- `CORS_ALLOWED_ORIGINS`;
- chaves de providers somente quando módulo habilitado.

## 10. Seed inicial

- organização demo;
- usuário admin;
- projeto industrial demo;
- rulesets draft;
- fixtures;
- uma análise concluída;
- action plan.

Não colocar credenciais fixas em produção.

## 11. Primeiros endpoints a implementar

1. `POST /projects`;
2. `GET /projects`;
3. `POST /extension/page-captures`;
4. `POST /analysis-runs`;
5. `GET /analysis-runs/{id}`;
6. `GET /analysis-runs/{id}/findings`;
7. `GET /analysis-runs/{id}/scores`;
8. `POST /action-plans`;
9. `GET /action-plans/{id}`.

## 12. Primeiras regras

### SEO

- status;
- noindex;
- canonical;
- title presente;
- description presente;
- H1;
- idioma;
- alt;
- links acessíveis;
- JSON-LD válido.

### GEO

- OAI-SearchBot;
- Claude-SearchBot;
- empresa identificada;
- oferta identificada;
- região;
- aplicações;
- evidências;
- autoria;
- contato;
- resposta direta.

## 13. Critério da primeira demonstração

A demonstração deve mostrar:

1. abrir fixture ruim;
2. extensão coleta;
3. resultado parcial aparece;
4. backend complementa;
5. score mostra cobertura/confiança;
6. finding localiza H1;
7. plano cria tarefa;
8. corrigir fixture;
9. reanalisar;
10. comparação mostra item resolvido.

## 14. Checklist técnico da Sprint 1

- [ ] repositório e CI;
- [ ] Docker local;
- [ ] contracts;
- [ ] schema/migrations;
- [ ] ruleset loader;
- [ ] scoring engine;
- [ ] fixtures;
- [ ] golden tests;
- [ ] API create/get analysis;
- [ ] dashboard simples;
- [ ] logs com correlation ID;
- [ ] tenant guard;
- [ ] documentação de execução.

## 15. Checklist da Sprint 2

- [ ] extensão skeleton;
- [ ] side panel;
- [ ] content extractor;
- [ ] sanitização;
- [ ] upload de capture;
- [ ] findings;
- [ ] highlight;
- [ ] action plan;
- [ ] E2E da extensão;
- [ ] permissions review.

## 16. Checklist da Sprint 3

- [ ] HTTP collector;
- [ ] SSRF suite;
- [ ] Playwright worker;
- [ ] robots/sitemap;
- [ ] object storage;
- [ ] partial completion;
- [ ] retries/dead-letter;
- [ ] comparison;
- [ ] PDF inicial.

## 17. Decisões que o time deve confirmar no kickoff

- nome final;
- provedor de auth;
- provedor cloud;
- ORM/query builder;
- biblioteca UI;
- ferramenta de migrations;
- observabilidade;
- limites do plano beta;
- retenção;
- primeiro provedor semântico;
- identidade visual;
- domínio da API e painel.

## 18. Regra de ouro

Não iniciar pela tela de score. Iniciar pelo contrato de facts, pelas regras e pelas evidências. A interface deve apenas representar um diagnóstico tecnicamente rastreável.

