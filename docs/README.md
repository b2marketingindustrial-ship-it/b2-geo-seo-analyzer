# B2 GEO/SEO Analyzer — Documentação do Produto

**Status:** Documento-base para início do desenvolvimento  
**Versão:** 1.0  
**Data:** 22 de julho de 2026  
**Nome de trabalho:** B2 GEO/SEO Analyzer  
**Responsável de negócio:** B2 Marketing Industrial

## 1. Visão geral

O B2 GEO/SEO Analyzer é uma plataforma SaaS composta por:

1. uma extensão para Google Chrome;
2. um painel web;
3. um backend de análise e rastreamento;
4. um motor de pontuação SEO e GEO;
5. um módulo de visibilidade em mecanismos de IA;
6. um gerador de plano de ação priorizado.

O produto avalia uma página ou um domínio e responde a quatro perguntas:

- A página está tecnicamente preparada para mecanismos de busca?
- A página está clara e estruturada para mecanismos generativos?
- A empresa possui sinais suficientes de autoridade e confiabilidade?
- Quais correções devem ser realizadas primeiro para aumentar a visibilidade?

## 2. Entregáveis principais

- **SEO Score:** 0 a 100.
- **GEO Readiness Score:** 0 a 100.
- **AI Visibility Score:** 0 a 100, quando o módulo estiver habilitado.
- **Digital Discoverability Score:** indicador consolidado opcional.
- **Overview da página:** itens corretos, alertas, falhas e limitações.
- **Evidências:** elemento, trecho, URL, cabeçalho ou resposta que originou cada diagnóstico.
- **Plano de ação:** tarefas organizadas por impacto, esforço, urgência e responsável sugerido.
- **Histórico:** evolução da pontuação e das correções.
- **Exportação:** PDF, CSV e integração futura com o B2 Hub.

## 3. Princípios do produto

1. **Explicabilidade:** nenhuma nota relevante deve existir sem critérios e evidências.
2. **Separação de escopo:** página, domínio, dados externos e testes em IA são camadas diferentes.
3. **Determinismo primeiro:** regras objetivas calculam a maior parte da nota.
4. **IA como avaliadora complementar:** modelos generativos não devem ser a única fonte de pontuação.
5. **Sem promessa de ranking:** a ferramenta mede preparação e visibilidade observada, não garantia de recomendação.
6. **Privacidade por padrão:** coletar apenas o necessário, com consentimento explícito para integrações.
7. **Arquitetura evolutiva:** começar com monólito modular e filas; separar serviços quando houver demanda real.
8. **Especialização industrial:** aplicações, normas, marcas, regiões, cases e evidências técnicas têm peso maior no contexto B2B industrial.

## 4. Índice da documentação

| Documento | Conteúdo |
|---|---|
| [01_PRD.md](01_PRD.md) | Visão de produto, personas, requisitos e métricas |
| [02_ESCOPO_E_REGRAS_DE_NEGOCIO.md](02_ESCOPO_E_REGRAS_DE_NEGOCIO.md) | Escopos de análise e regras funcionais |
| [03_ARQUITETURA.md](03_ARQUITETURA.md) | Arquitetura lógica, componentes e fluxos |
| [04_EXTENSAO_CHROME.md](04_EXTENSAO_CHROME.md) | Especificação da extensão Manifest V3 |
| [05_CRAWLER_E_ANALISADORES.md](05_CRAWLER_E_ANALISADORES.md) | Crawler, renderização e coletores |
| [06_MODELO_DE_PONTUACAO.md](06_MODELO_DE_PONTUACAO.md) | Fórmulas, pesos, confiança e severidade |
| [07_AI_VISIBILITY.md](07_AI_VISIBILITY.md) | Testes de recomendação em motores de IA |
| [08_MODELO_DE_DADOS.md](08_MODELO_DE_DADOS.md) | Entidades, relacionamentos e retenção |
| [09_API_E_INTEGRACOES.md](09_API_E_INTEGRACOES.md) | Contratos, endpoints e integrações |
| [10_UX_UI.md](10_UX_UI.md) | Fluxos, telas e componentes |
| [11_SEGURANCA_PRIVACIDADE_LGPD.md](11_SEGURANCA_PRIVACIDADE_LGPD.md) | Segurança, privacidade e LGPD |
| [12_TESTES_E_QUALIDADE.md](12_TESTES_E_QUALIDADE.md) | Estratégia de testes e critérios de aceite |
| [13_DEVOPS_OBSERVABILIDADE.md](13_DEVOPS_OBSERVABILIDADE.md) | Ambientes, deploy, logs e operação |
| [14_ROADMAP_BACKLOG.md](14_ROADMAP_BACKLOG.md) | MVP, fases, épicos e backlog inicial |
| [15_DECISOES_E_RISCOS.md](15_DECISOES_E_RISCOS.md) | ADRs, riscos e mitigação |
| [16_REFERENCIAS.md](16_REFERENCIAS.md) | Fontes oficiais e premissas técnicas |
| [17_GUIA_DE_INICIO_DESENVOLVIMENTO.md](17_GUIA_DE_INICIO_DESENVOLVIMENTO.md) | Passos práticos para iniciar o código |
| [api/openapi.yaml](api/openapi.yaml) | Especificação inicial da API |
| [database/schema.sql](database/schema.sql) | Esquema SQL inicial |
| [extension/manifest.example.json](extension/manifest.example.json) | Manifesto de referência |
| [scoring/rules.seed.json](scoring/rules.seed.json) | Exemplo de regras do motor de pontuação |
| [.env.example](.env.example) | Variáveis locais de referência |
| [docker-compose.example.yml](docker-compose.example.yml) | Serviços locais de desenvolvimento |

## 5. Stack recomendada

### Monorepo

- pnpm workspaces;
- Turborepo;
- TypeScript em todos os módulos JavaScript/Node.

### Extensão

- Chrome Manifest V3;
- React;
- Vite;
- TypeScript;
- Chrome Side Panel API;
- `activeTab`, `scripting`, `storage` e `sidePanel`.

### Painel web

- Next.js;
- React;
- TypeScript;
- biblioteca de componentes acessível;
- autenticação OIDC/OAuth 2.0.

### Backend

- NestJS;
- PostgreSQL;
- Redis;
- BullMQ;
- Playwright;
- Lighthouse;
- armazenamento de objetos compatível com S3;
- OpenTelemetry.

### Infraestrutura inicial

- Docker;
- ambiente local com Docker Compose;
- CI/CD com GitHub Actions;
- hospedagem em provedor compatível com containers;
- banco gerenciado em produção.

## 6. Estrutura de repositório sugerida

```text
b2-geo-seo-analyzer/
├── apps/
│   ├── extension/
│   ├── dashboard/
│   ├── api/
│   ├── worker-crawler/
│   ├── worker-lighthouse/
│   └── worker-ai/
├── packages/
│   ├── ui/
│   ├── contracts/
│   ├── scoring-engine/
│   ├── analyzers/
│   ├── config/
│   └── observability/
├── infrastructure/
│   ├── docker/
│   ├── terraform/
│   └── monitoring/
├── docs/
├── tests/
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

## 7. Definição de MVP

O MVP deve entregar:

- autenticação;
- criação de projeto;
- extensão Chrome;
- análise da página atual;
- coleta de DOM, metadados, headings, links, imagens e schemas;
- validação de indexabilidade, robots, canonical e sitemap;
- SEO Score;
- GEO Readiness Score;
- explicação de cada regra;
- plano de ação priorizado;
- relatório no painel;
- histórico básico;
- exportação em PDF;
- fila de processamento e limites por plano.

Ficam fora do MVP:

- rastreamento contínuo de sites grandes;
- integração completa com CRM;
- automação de correções no site;
- garantia de posição em respostas de IA;
- análise de backlinks em escala própria;
- monitoramento diário de centenas de prompts em todos os provedores.

## 8. Critério de sucesso do MVP

O MVP será considerado funcional quando:

1. uma página pública puder ser analisada pela extensão;
2. o backend reproduzir a análise de forma independente;
3. o relatório apresentar evidência para cada falha;
4. duas execuções na mesma página, sem alterações, produzirem resultado consistente dentro da tolerância definida;
5. o plano de ação puder ser exportado;
6. os dados de um cliente não forem acessíveis por outro tenant;
7. o processamento assíncrono puder ser retomado após falha de worker.

## 9. Aviso metodológico obrigatório

A interface e os relatórios devem exibir:

> As pontuações GEO e AI Visibility são indicadores proprietários de preparação e visibilidade observada. Não representam notas oficiais do Google, ChatGPT, Claude, Gemini ou de qualquer outro mecanismo, nem garantem indexação, citação, ranking ou recomendação.

