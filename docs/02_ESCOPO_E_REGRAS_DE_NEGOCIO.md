# 02 — Escopo e Regras de Negócio

## 1. Camadas de análise

O sistema deve identificar explicitamente a origem e o alcance de cada resultado.

### 1.1 Análise local da página

Executada pela extensão sobre a aba ativa.

**Pode avaliar:**

- DOM renderizado;
- title, description e meta robots disponíveis;
- headings;
- texto visível;
- links e imagens;
- JSON-LD e microdados presentes;
- canonical;
- idioma declarado;
- elementos de contato;
- estrutura da página;
- sinais básicos de acessibilidade;
- conteúdo inserido por JavaScript;
- seletor CSS e trecho de evidência.

**Não pode garantir:**

- comportamento do servidor para outros user agents;
- indexação real;
- conteúdo entregue a crawlers sem renderização;
- qualidade do domínio inteiro;
- backlinks;
- menções externas;
- resultados reais em motores de IA.

### 1.2 Análise remota da URL

Executada pelo backend em ambiente controlado.

**Pode avaliar:**

- status HTTP e cadeia de redirects;
- cabeçalhos HTTP;
- HTML original e DOM renderizado;
- robots.txt;
- sitemap;
- respostas por user agent configurado;
- performance laboratorial;
- comportamento mobile e desktop;
- recursos de rede;
- diferenças de renderização;
- segurança básica de transporte;
- conteúdo público acessível.

### 1.3 Auditoria do domínio

Executada por crawler assíncrono.

**Pode avaliar:**

- arquitetura;
- profundidade de clique;
- páginas órfãs quando houver sitemap ou dados de integração;
- duplicidade de títulos e conteúdo;
- canibalização potencial;
- links quebrados;
- redirects internos;
- cobertura de templates;
- distribuição de links internos;
- páginas sem conteúdo suficiente;
- inconsistências entre páginas.

### 1.4 Dados conectados

Obtidos mediante consentimento.

- Google Search Console;
- Google Analytics;
- futuras integrações com CRM;
- dados de sitemap e CMS;
- propriedade de domínio.

### 1.5 Dados externos públicos

- perfis empresariais públicos;
- diretórios oficiais;
- sites de fabricantes;
- referências e menções permitidas;
- resultados de mecanismos de busca de acordo com APIs e termos aplicáveis.

### 1.6 AI Visibility

Testes executados em APIs com busca ou grounding quando disponíveis.

**Mede:**

- presença observada;
- frequência de menção;
- contexto;
- posição aproximada na resposta;
- citações e URLs retornadas;
- concorrentes;
- precisão aparente da informação.

**Não mede com certeza:**

- experiência do aplicativo público;
- personalização individual;
- todos os modelos e versões;
- resultado futuro;
- preferência oficial do provedor.

## 2. Estados de verificabilidade

Cada regra deve retornar um dos estados:

- `PASS`: requisito atendido;
- `FAIL`: requisito não atendido;
- `WARN`: risco ou oportunidade;
- `INFO`: observação sem penalidade direta;
- `NOT_APPLICABLE`: regra não se aplica;
- `NOT_TESTED`: módulo não executado;
- `UNKNOWN`: dados insuficientes ou contraditórios;
- `ERROR`: falha técnica na coleta.

Regras `NOT_TESTED`, `UNKNOWN` e `ERROR` não devem ser tratadas automaticamente como falha. Elas reduzem a cobertura e a confiança.

## 3. Severidade

- **Critical:** impede rastreamento, indexação, carregamento ou compreensão essencial.
- **High:** afeta fortemente descoberta, relevância, credibilidade ou experiência.
- **Medium:** reduz qualidade ou cobertura, mas não bloqueia o objetivo principal.
- **Low:** otimização, consistência ou melhoria incremental.
- **Info:** orientação sem impacto negativo confirmado.

## 4. Prioridade do plano de ação

A prioridade é calculada por:

```text
priority_score = (impacto × urgência × confiança) / esforço
```

Escalas normalizadas:

- impacto: 1 a 5;
- urgência: 1 a 5;
- confiança: 0,25 a 1,00;
- esforço: 1 a 5.

A classificação final:

- P0 — bloqueador;
- P1 — executar imediatamente;
- P2 — próximo ciclo;
- P3 — melhoria planejada;
- P4 — opcional ou experimental.

Regras críticas de indexabilidade podem receber P0 independentemente da fórmula.

## 5. Tipos de evidência

- `DOM_ELEMENT`: seletor, tag, atributo e trecho;
- `VISIBLE_TEXT`: trecho visível e seção;
- `HTML_SOURCE`: linha ou fragmento do HTML original;
- `HTTP_HEADER`: nome e valor;
- `HTTP_STATUS`: código e redirects;
- `ROBOTS_RULE`: user agent, diretiva e origem;
- `SITEMAP_ENTRY`: sitemap e URL;
- `SCHEMA_NODE`: tipo, propriedade e caminho JSON;
- `NETWORK_REQUEST`: URL, tamanho, tipo e duração;
- `LIGHTHOUSE_AUDIT`: auditoria, score e detalhes;
- `EXTERNAL_SOURCE`: URL, título e trecho permitido;
- `AI_RESPONSE`: provedor, modelo, prompt, trecho e citação;
- `CONNECTED_DATA`: propriedade, métrica, período e dimensão.

## 6. Regras de explicação

Todo finding que penaliza uma nota deve apresentar:

1. o que foi verificado;
2. o resultado encontrado;
3. por que isso importa;
4. como corrigir;
5. onde corrigir, quando identificável;
6. prioridade;
7. esforço estimado;
8. critério de aceite;
9. ganho potencial estimado;
10. fonte metodológica ou referência interna.

## 7. Regras de score

- notas devem ser inteiras na interface, mas calculadas com precisão decimal;
- o score deve ser limitado entre 0 e 100;
- itens não aplicáveis saem do denominador;
- itens não testados reduzem cobertura, não score diretamente;
- falha técnica não pode ser interpretada como falha do site;
- uma regra pode aplicar penalidade máxima por categoria para evitar dupla punição;
- regras correlacionadas devem utilizar grupos de exclusão ou cap de penalidade;
- scores históricos preservam a versão da metodologia;
- comparação entre metodologias diferentes deve exibir aviso.

## 8. Regra de score consolidado

O Digital Discoverability Score é opcional:

```text
DDS = SEO × 0,40 + GEO × 0,40 + AI Visibility × 0,20
```

Quando AI Visibility não estiver habilitado:

```text
DDS = SEO × 0,50 + GEO × 0,50
```

O painel deve manter os scores individuais em destaque. O consolidado nunca substitui a explicação das dimensões.

## 9. Regra de confiança

Confiança combina:

- cobertura dos módulos;
- qualidade da coleta;
- concordância entre fontes;
- estabilidade do resultado;
- natureza determinística ou semântica da regra.

Exemplo:

```text
confidence = coverage × collection_quality × source_agreement × rule_reliability
```

Faixas:

- 0–39: baixa;
- 40–69: moderada;
- 70–89: alta;
- 90–100: muito alta.

## 10. Reanálise

Ao reanalisar uma URL, o sistema deve:

- criar uma nova execução imutável;
- associar a versão de regras;
- manter snapshots conforme política de retenção;
- comparar findings pela chave lógica da regra;
- marcar `resolved`, `new`, `regressed`, `unchanged` ou `not_comparable`;
- recalcular o plano de ação sem apagar tarefas manualmente editadas.

## 11. Concorrentes

Concorrentes podem ser:

- cadastrados manualmente;
- sugeridos por domínios encontrados em respostas de IA;
- importados de projeto anterior;
- confirmados pelo usuário antes de entrarem em relatórios oficiais.

O sistema não deve afirmar que um domínio é concorrente apenas por aparecer no mesmo resultado.

## 12. Conteúdo gerado por IA

A plataforma pode sugerir:

- novos títulos;
- descrições;
- estrutura de headings;
- FAQs;
- seções ausentes;
- briefs de conteúdo;
- schema de referência;
- plano de ação.

Regras:

- sugestões devem ser claramente identificadas como geradas;
- não publicar automaticamente no MVP;
- não inventar certificações, clientes, números, marcas ou resultados;
- usar placeholders quando faltarem dados;
- separar correção técnica de recomendação editorial;
- armazenar prompt, provedor, modelo e versão de template para auditoria.

## 13. Limites por plano

Os limites devem ser configuráveis, não hardcoded:

- análises de página por mês;
- páginas por crawl;
- crawls simultâneos;
- retenção histórica;
- usuários;
- projetos;
- prompts de AI Visibility;
- provedores habilitados;
- exportações;
- integrações.

## 14. Uso aceitável

É proibido:

- analisar sistemas sem autorização quando isso envolver áreas privadas ou autenticação;
- contornar bloqueios técnicos;
- realizar carga abusiva;
- coletar dados pessoais em massa;
- utilizar a ferramenta para exploração de vulnerabilidades;
- executar prompts que violem termos dos provedores;
- usar o crawler para copiar integralmente conteúdo protegido.

## 15. Políticas de rastreamento

- respeitar robots.txt por padrão;
- identificar o user agent do crawler;
- usar rate limit por host;
- permitir exclusões de caminho;
- interromper em códigos 429 e aplicar backoff;
- limitar redirects;
- bloquear IPs privados e metadados de nuvem;
- não enviar cookies de usuário para o crawler remoto;
- exigir configuração especial para ambientes de homologação protegidos.

## 16. Critérios de aceite globais

- resultado reproduzível com snapshot idêntico;
- evidência acessível;
- nenhuma informação de outro tenant;
- estados de erro claros;
- pontuação coerente com os findings;
- plano de ação derivado dos findings ativos;
- auditoria de operações sensíveis;
- aviso metodológico visível.

