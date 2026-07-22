# 09 — API e Integrações

## 1. Padrões

- REST JSON para operações principais;
- OpenAPI 3.1;
- `/v1` na URL;
- UUIDs;
- datas ISO 8601 UTC;
- paginação por cursor;
- idempotency key em criações custosas;
- erros no padrão Problem Details adaptado;
- SSE para progresso em fase inicial; WebSocket apenas se necessário;
- webhooks assinados em fase posterior.

## 2. Autenticação e autorização

- bearer access token curto;
- OIDC/OAuth 2.0;
- RBAC por organização;
- escopo de projeto;
- checagem em todas as operações;
- tokens de integração nunca retornados em texto claro.

## 3. Headers

```text
Authorization: Bearer <token>
X-Organization-Id: <uuid>
Idempotency-Key: <uuid>
X-Client-Version: extension/1.0.0
X-Correlation-Id: <uuid>
```

O servidor não deve confiar somente no `X-Organization-Id`; deve validar membership.

## 4. Formato de erro

```json
{
  "type": "https://docs.example/errors/analysis-not-found",
  "title": "Análise não encontrada",
  "status": 404,
  "code": "ANALYSIS_NOT_FOUND",
  "detail": "A execução informada não existe ou não está disponível.",
  "correlationId": "..."
}
```

## 5. Endpoints principais

### Auth/session

- `GET /v1/me`;
- `POST /v1/auth/logout`;
- fluxo OIDC em endpoints dedicados.

### Organizations

- `GET /v1/organizations`;
- `POST /v1/organizations`;
- `GET /v1/organizations/{id}`;
- `GET /v1/organizations/{id}/members`;
- `POST /v1/organizations/{id}/invitations`.

### Projects

- `GET /v1/projects`;
- `POST /v1/projects`;
- `GET /v1/projects/{id}`;
- `PATCH /v1/projects/{id}`;
- `DELETE /v1/projects/{id}`;
- `PUT /v1/projects/{id}/entities`;
- `PUT /v1/projects/{id}/competitors`.

### Analysis

- `POST /v1/analysis-runs`;
- `GET /v1/analysis-runs/{id}`;
- `GET /v1/analysis-runs/{id}/events` via SSE;
- `POST /v1/analysis-runs/{id}/cancel`;
- `GET /v1/analysis-runs/{id}/findings`;
- `GET /v1/analysis-runs/{id}/scores`;
- `GET /v1/analysis-runs/{id}/comparison?baseline=...`;
- `POST /v1/analysis-runs/{id}/reanalyze`.

### Extension capture

- `POST /v1/extension/page-captures`;
- `POST /v1/extension/page-captures/{id}/analysis`.

### Action plans

- `POST /v1/action-plans`;
- `GET /v1/action-plans/{id}`;
- `PATCH /v1/action-items/{id}`;
- `POST /v1/action-plans/{id}/regenerate`;
- `GET /v1/action-plans/{id}/export.csv`.

### Reports

- `POST /v1/exports`;
- `GET /v1/exports/{id}`;
- `GET /v1/exports/{id}/download` com URL assinada.

### AI Visibility

- `GET /v1/projects/{id}/visibility-prompts`;
- `POST /v1/projects/{id}/visibility-prompts`;
- `PATCH /v1/visibility-prompts/{id}`;
- `POST /v1/projects/{id}/visibility-runs`;
- `GET /v1/projects/{id}/visibility-overview`;
- `GET /v1/visibility-runs/{id}`.

### Integrations

- `GET /v1/integrations`;
- `POST /v1/integrations/{provider}/connect`;
- `GET /v1/integrations/{provider}/callback`;
- `DELETE /v1/integrations/{id}`;
- `GET /v1/integrations/{id}/resources`;
- `POST /v1/integrations/{id}/bindings`;
- `POST /v1/integrations/{id}/sync`.

## 6. Criar análise

Request:

```json
{
  "projectId": "uuid",
  "type": "page",
  "url": "https://example.com/produto",
  "source": "extension",
  "modules": [
    "extension_facts",
    "http",
    "rendered_dom",
    "robots",
    "sitemap",
    "lighthouse_mobile",
    "semantic"
  ],
  "pageCaptureId": "uuid"
}
```

Response 202:

```json
{
  "id": "uuid",
  "status": "queued",
  "progress": 5,
  "links": {
    "self": "/v1/analysis-runs/uuid",
    "events": "/v1/analysis-runs/uuid/events"
  }
}
```

## 7. Finding response

```json
{
  "id": "uuid",
  "ruleKey": "geo.entity.service_clarity",
  "scoreType": "geo",
  "category": "entity_offer_clarity",
  "status": "fail",
  "severity": "high",
  "title": "Serviço principal não está claramente identificado",
  "explanation": "...",
  "impact": "...",
  "remediation": "...",
  "acceptanceCriteria": "...",
  "priority": "P1",
  "effort": 2,
  "confidence": 0.88,
  "estimatedScoreGain": 3.5,
  "evidences": [
    {
      "type": "VISIBLE_TEXT",
      "excerpt": "Soluções completas para sua empresa",
      "selector": "main h1"
    }
  ]
}
```

## 8. Paginação

```text
GET /v1/analysis-runs/{id}/findings?limit=50&cursor=...
```

Response:

```json
{
  "items": [],
  "nextCursor": null
}
```

## 9. Rate limiting

Aplicar por:

- usuário;
- organização;
- IP para auth;
- endpoint;
- plano;
- custo do job.

Retornar 429 com `Retry-After`.

## 10. Idempotência

Endpoints:

- criar análise;
- executar AI Visibility;
- exportar;
- iniciar sincronização.

Guardar resultado da chave por janela. Mesma chave e payload diferente retorna conflito.

## 11. SSE

Eventos:

```text
event: module_started
data: {"module":"lighthouse_mobile","progress":40}

event: finding_available
data: {"findingId":"...","severity":"critical"}

event: completed
data: {"status":"completed","progress":100}
```

Autenticação deve ser compatível com browser sem expor token em URL. Alternativas: cookie seguro no painel ou polling autenticado para extensão.

## 12. Google Search Console

### OAuth

- solicitar escopos mínimos;
- usuário escolhe propriedade;
- armazenar token cifrado;
- permitir revogação;
- registrar quem conectou.

### Dados

- consultas;
- páginas;
- países;
- dispositivos;
- cliques;
- impressões;
- CTR;
- posição;
- período.

### Regras

- não afirmar que ausência de dados significa ausência de indexação;
- respeitar limites e agregações da API;
- mostrar período e propriedade;
- separar dados frescos de cache;
- não compartilhar dados entre projetos sem binding.

## 13. PageSpeed/Lighthouse

A arquitetura pode usar:

- Lighthouse próprio para controle e reprodutibilidade;
- API PageSpeed Insights como dado adicional e de campo quando disponível.

Registrar origem de cada métrica.

## 14. Provedores de IA

### Requisitos comuns

- adapter por provedor;
- segredo no servidor;
- modelos configuráveis;
- timeout;
- retry apenas para falhas seguras;
- rate limit;
- orçamento;
- logging sem prompt sensível quando configurado;
- validação de resposta;
- termos e retenção.

### OpenAI

Usar API oficial e ferramenta de busca suportada no momento da implementação. Não depender de nomes de modelos fixos no código de domínio.

### Anthropic

Usar Messages API e web search conforme disponibilidade e contrato.

### Gemini

Usar Gemini API com grounding do Google Search conforme disponibilidade e termos.

## 15. Webhooks futuros

Eventos:

- análise concluída;
- problema crítico detectado;
- plano gerado;
- tarefa atualizada;
- score caiu;
- marca ganhou/perdeu visibilidade.

Segurança:

- assinatura HMAC;
- timestamp;
- replay protection;
- retries;
- logs;
- segredo rotacionável.

## 16. API interna do scoring

```ts
scoreAnalysis(input: {
  facts: NormalizedFacts;
  findings: FindingEvaluation[];
  ruleset: Ruleset;
}): ScoreResult;
```

Deve ser biblioteca pura sempre que possível, permitindo testes sem banco ou rede.

## 17. API para integrações futuras com B2 Hub

- criar demanda a partir de action item;
- sincronizar responsável e status;
- vincular relatório ao cliente;
- enviar alertas;
- importar dados comerciais.

Começar com webhook/API simples, sem acoplar o core ao B2 Hub.

## 18. Critérios de aceite

- OpenAPI validado;
- autenticação e RBAC em todos os endpoints privados;
- paginação consistente;
- idempotência testada;
- erros com correlation ID;
- rate limit;
- adapters simuláveis;
- tokens cifrados;
- nenhum segredo no cliente;
- endpoint de análise retorna 202, não bloqueia processamento pesado.

