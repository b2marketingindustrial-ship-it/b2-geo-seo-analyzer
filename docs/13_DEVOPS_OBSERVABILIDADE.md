# 13 — DevOps, Operação e Observabilidade

## 1. Objetivos

- deploy repetível;
- ambientes isolados;
- rastreabilidade de análises;
- escala independente de workers;
- controle de custos;
- recuperação de falhas;
- rollback seguro;
- operação com equipe enxuta.

## 2. Ambientes

### Local

- Docker Compose;
- PostgreSQL;
- Redis;
- MinIO;
- Mailpit;
- provedores externos simulados;
- fixtures de sites locais.

### Development

- deploy automático da branch principal de desenvolvimento;
- dados sintéticos;
- credenciais de sandbox;
- observabilidade básica.

### Staging

- topologia semelhante à produção;
- migrações completas;
- testes E2E;
- versões candidatas da extensão;
- limites menores;
- sem dados reais salvo autorização controlada.

### Production

- banco gerenciado;
- Redis gerenciado ou altamente disponível;
- object storage;
- secret manager;
- backups;
- WAF/rate limit;
- alertas;
- segregação de rede.

## 3. Containers

Imagens separadas:

- `api`;
- `dashboard`;
- `worker-crawler`;
- `worker-lighthouse`;
- `worker-ai`;
- `worker-export`;
- `migration`.

Regras:

- usuário não root;
- imagem mínima;
- browser e dependências fixados por digest quando viável;
- healthcheck;
- SBOM;
- scanning;
- sem secrets em layer.

## 4. CI/CD

### Pull request

1. lint;
2. typecheck;
3. unit tests;
4. OpenAPI lint;
5. schema/migrations;
6. segurança;
7. build;
8. E2E reduzido.

### Merge

1. build de imagem;
2. assinatura/tag;
3. deploy development;
4. smoke tests;
5. publicação de artifacts.

### Release

1. changelog;
2. backup/checagem;
3. migrations compatíveis;
4. deploy canário ou rolling;
5. smoke;
6. monitoramento;
7. rollback se necessário.

## 5. Versionamento

- aplicação: semver;
- API: `/v1` e compatibilidade;
- extensão: versão própria;
- rulesets: semver independente;
- prompt templates: versão;
- configuração Lighthouse: versão;
- schema de facts: versão.

## 6. Feature flags

Usar para:

- AI Visibility;
- novos providers;
- novos rulesets;
- domain crawl;
- exports;
- integrações;
- scoring experimental.

Flags por ambiente, plano, organização e usuário beta.

## 7. Observabilidade

### Logs

JSON estruturado:

```json
{
  "timestamp": "...",
  "level": "info",
  "service": "worker-crawler",
  "event": "analysis.module.completed",
  "organizationId": "...",
  "analysisRunId": "...",
  "correlationId": "...",
  "durationMs": 1234
}
```

Conteúdo e tokens não devem ser logados.

### Métricas

#### API

- requests;
- latência p50/p95/p99;
- erros;
- rate limit;
- conexões;
- queries lentas.

#### Fila

- tamanho;
- idade do job mais antigo;
- throughput;
- retry;
- dead-letter;
- duração;
- falha por tipo.

#### Crawler

- páginas/minuto;
- browsers ativos;
- memória;
- timeout;
- 429;
- bytes;
- hosts.

#### IA

- chamadas;
- tokens/uso;
- custo;
- latência;
- 429;
- erro de schema;
- provedor/modelo.

#### Produto

- análises iniciadas/concluídas;
- cobertura;
- exportações;
- tarefas;
- instalações da extensão.

### Traces

OpenTelemetry com propagação de `correlation_id` da extensão/API até workers.

## 8. Alertas

- API erro > limiar;
- fila envelhecida;
- worker sem heartbeat;
- banco/Redis;
- storage;
- custo de IA acima do orçamento;
- aumento de 429;
- taxa de análise parcial;
- falha de export;
- backup falhou;
- erro cross-tenant detectado em teste canário.

## 9. SLOs iniciais

- API/painel: 99,5%;
- criação de análise: 99,5%;
- conclusão de análise padrão em até 5 min: 95%, dependendo da página;
- perda de job: 0;
- export em até 3 min: 95%;
- extensão abre em até 1 s: 95% local.

Não criar SLA externo antes de medir o beta.

## 10. Backups e recuperação

- PostgreSQL PITR quando disponível;
- snapshot diário;
- teste mensal de restauração;
- object storage versionado conforme custo;
- Redis não é fonte de verdade;
- jobs reconstruíveis a partir do banco;
- runbook de desastre.

Metas iniciais:

- RPO: 24 h no MVP, evoluindo para 1 h;
- RTO: 8 h no MVP, evoluindo para 2 h.

## 11. Custos

Taguear custos por:

- ambiente;
- worker;
- provedor IA;
- organização/plano quando possível;
- storage;
- egress.

Controles:

- limites por plano;
- orçamento;
- cache;
- deduplicação;
- tamanho de snapshot;
- retenção;
- escala para zero em ambientes não produtivos quando possível.

## 12. Runbooks

Criar:

- API indisponível;
- banco lento;
- Redis/fila;
- crawler bloqueado;
- provedor IA indisponível;
- custos anormais;
- extensão com regressão;
- vazamento de segredo;
- incidente de tenant;
- restore de backup;
- rollback de ruleset.

## 13. Publicação da extensão

Pipeline separado:

1. build determinístico;
2. testes;
3. revisão de permissões;
4. zip;
5. assinatura/checksum interno;
6. publicação em canal beta;
7. aprovação;
8. produção gradual quando disponível;
9. monitorar erros por versão.

## 14. Critérios de aceite

- ambiente local sobe com comando documentado;
- migrations automáticas controladas;
- tracing ponta a ponta;
- dashboards essenciais;
- alertas testados;
- backup restaurado em teste;
- custo por análise mensurável;
- rollback documentado;
- extensão versionada separadamente.

