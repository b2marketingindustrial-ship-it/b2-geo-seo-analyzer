# 16 — Referências Técnicas Oficiais

**Consulta realizada em:** 22 de julho de 2026.

As tecnologias, APIs, preços, modelos e políticas podem mudar. A equipe deve revisar as fontes antes de cada integração ou release importante.

## Chrome Extensions

- Manifest file format: https://developer.chrome.com/docs/extensions/reference/manifest
- Manifest V3 overview: https://developer.chrome.com/docs/extensions/develop/migrate/what-is-mv3
- Chrome Extensions get started: https://developer.chrome.com/docs/extensions/get-started
- Side Panel API: https://developer.chrome.com/docs/extensions/reference/api/sidePanel
- Create a side panel: https://developer.chrome.com/docs/extensions/develop/ui/create-a-side-panel

Premissas utilizadas:

- Manifest V3 é a base atual para novas extensões;
- Side Panel API exige permissão específica e versão compatível do Chrome;
- código remoto não deve ser executado na extensão.

## Google Search e SEO

- Search Central: https://developers.google.com/search
- Robots.txt introduction: https://developers.google.com/search/docs/crawling-indexing/robots/intro
- Structured data: https://developers.google.com/search/docs/appearance/structured-data
- Search Console introduction: https://developers.google.com/search/docs/monitor-debug/search-console-start
- Search Console API: https://developers.google.com/webmaster-tools
- PageSpeed Insights API: https://developers.google.com/speed/docs/insights/v5/get-started

Premissas utilizadas:

- robots controla rastreamento e não é mecanismo de segurança;
- noindex e controle de acesso têm funções diferentes;
- dados estruturados ajudam compreensão, mas não garantem rich result ou ranking;
- Search Console fornece dados de desempenho e cobertura conforme propriedade autorizada.

## Lighthouse

- Lighthouse overview: https://developer.chrome.com/docs/lighthouse
- Performance scoring: https://developer.chrome.com/docs/lighthouse/performance/performance-scoring

Premissas utilizadas:

- score de performance é calculado a partir de métricas ponderadas;
- resultados podem variar com condições de teste;
- versão e configuração devem ser registradas.

## Playwright

- Documentation: https://playwright.dev/docs/intro
- Pages: https://playwright.dev/docs/pages
- Network: https://playwright.dev/docs/network
- Browsers: https://playwright.dev/docs/browsers

Premissas utilizadas:

- Playwright será usado para renderização controlada, coleta do DOM e observação de rede;
- versão do navegador e configuração devem ser fixadas por execução.

## NestJS e filas

- NestJS documentation: https://docs.nestjs.com/
- Controllers: https://docs.nestjs.com/controllers
- Queues: https://docs.nestjs.com/techniques/queues
- OpenAPI: https://docs.nestjs.com/openapi/introduction

## OpenAI

- OpenAI API documentation: https://platform.openai.com/docs
- Web search guide: https://platform.openai.com/docs/guides/tools-web-search
- OpenAI crawlers: https://developers.openai.com/api/docs/bots

Premissas utilizadas:

- integração deve usar API oficial;
- ferramenta de web search e modelos devem ser configuráveis;
- crawlers de busca e treinamento possuem finalidades distintas e devem ser apresentados separadamente.

## Anthropic

- Claude Platform docs: https://docs.anthropic.com/
- Web search tool: https://docs.anthropic.com/en/docs/build-with-claude/tool-use/web-search-tool
- Tool use overview: https://docs.anthropic.com/en/docs/build-with-claude/tool-use/overview

## Google Gemini

- Gemini API: https://ai.google.dev/
- Grounding with Google Search: https://ai.google.dev/gemini-api/docs/google-search
- Gemini API terms: https://ai.google.dev/gemini-api/terms
- Release notes: https://ai.google.dev/gemini-api/docs/changelog

## Segurança e privacidade

A implementação deve também consultar versões atuais de:

- OWASP ASVS;
- OWASP Top 10;
- OWASP SSRF Prevention Cheat Sheet;
- OWASP LLM Top 10;
- Lei Geral de Proteção de Dados — Lei nº 13.709/2018;
- políticas da Chrome Web Store;
- termos e DPAs dos provedores utilizados.

## Observação metodológica

Nenhuma das referências acima define um “score GEO universal”. O GEO Readiness Score descrito neste projeto é uma metodologia proprietária que combina acessibilidade, clareza, completude, evidências, estrutura, identidade e contexto comercial. A metodologia deve ser calibrada, versionada e explicada.

