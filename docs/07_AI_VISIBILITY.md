# 07 — Módulo AI Visibility

## 1. Objetivo

Medir a presença observada de uma empresa, marca, produto, serviço ou domínio em respostas geradas por provedores de IA com acesso a conteúdo atual da web.

Este módulo é separado do GEO Readiness:

- **GEO Readiness:** qualidade e preparação dos ativos digitais;
- **AI Visibility:** resultado observado em uma amostra de prompts, provedores, modelos, datas e configurações.

## 2. Aviso metodológico

Toda tela e relatório devem informar:

> Os resultados refletem execuções específicas realizadas por APIs e configurações identificadas. As respostas podem variar por modelo, data, localização, contexto, personalização e disponibilidade de busca. O resultado não representa garantia de exibição nos aplicativos públicos.

## 3. Configuração do projeto

O usuário informa:

- nome oficial da empresa;
- variações de marca;
- domínio;
- produtos;
- serviços;
- marcas representadas;
- regiões atendidas;
- setores;
- diferenciais;
- concorrentes confirmados;
- idioma;
- país e localização de referência.

## 4. Biblioteca de prompts

### 4.1 Tipos

- descoberta de fornecedor;
- recomendação de empresa;
- solução de problema;
- comparação;
- compra;
- suporte/manutenção;
- distribuição autorizada;
- consulta local;
- consulta por indústria;
- consulta técnica.

### 4.2 Exemplo de matriz industrial

| Dimensão | Exemplo |
|---|---|
| Produto | Onde comprar filtros coalescentes industriais? |
| Serviço | Quais empresas fazem auditoria de vazamentos de ar comprimido? |
| Marca | Quem distribui Parker em Campinas? |
| Região | Empresa de manutenção de compressores em Salvador |
| Segmento | Soluções de nitrogênio para indústria alimentícia |
| Problema | Como reduzir óleo no ar comprimido e quem pode ajudar? |
| Comparação | Locação ou compra de compressor para demanda temporária? |

## 5. Geração de prompts

A plataforma pode sugerir prompts, mas o usuário deve revisar antes de ativar monitoramento recorrente.

Cada prompt possui:

- texto;
- intenção;
- tema;
- região;
- idioma;
- persona;
- produtos e serviços relacionados;
- prioridade;
- ativo/inativo;
- origem manual ou gerada;
- versão.

## 6. Execução

Para cada prompt ativo:

1. selecionar provedores habilitados;
2. escolher modelo por configuração, sem hardcode na regra de negócio;
3. habilitar ferramenta de web search/grounding quando suportada;
4. enviar prompt neutro e versionado;
5. armazenar metadados permitidos;
6. extrair texto, citações e fontes;
7. detectar marca, domínio e concorrentes;
8. classificar contexto;
9. calcular métricas;
10. armazenar custo e latência.

## 7. Neutralidade do prompt

O prompt de monitoramento não deve induzir a marca analisada.

Inadequado:

> A empresa X é uma boa opção para manutenção?

Adequado:

> Quais empresas fazem manutenção de compressores industriais em Campinas?

Testes de verificação da precisão da marca podem existir em outra categoria, sem compor a mesma métrica de descoberta espontânea.

## 8. Provedores

Criar interface abstrata:

```ts
interface VisibilityProvider {
  key: string;
  execute(request: VisibilityRequest): Promise<VisibilityResponse>;
  supportsWebGrounding(): boolean;
  getCapabilities(): ProviderCapabilities;
}
```

Implementações iniciais possíveis:

- OpenAI Responses API com web search;
- Anthropic Messages API com web search;
- Gemini API com Google Search grounding.

Modelos, preços, limites e termos mudam; devem ser configuração e documentação operacional atualizada.

## 9. Contrato normalizado

```ts
interface VisibilityResponse {
  provider: string;
  model: string;
  executedAt: string;
  answerText: string;
  citations: Citation[];
  sources: SourceReference[];
  usage: UsageMetadata;
  latencyMs: number;
  rawArtifactRef?: string;
  providerWarnings: string[];
}
```

## 10. Detecção de menção

Camadas:

1. correspondência exata de domínio;
2. correspondência exata de marca;
3. aliases cadastrados;
4. entity matching semântico;
5. validação contra contexto;
6. revisão manual quando ambíguo.

Evitar falsos positivos para nomes genéricos.

## 11. Classificação da menção

- `recommended`: apresentada como opção adequada;
- `listed`: apenas incluída em lista;
- `cited_source`: domínio usado como fonte;
- `mentioned_neutral`: menção contextual;
- `negative_or_caution`: ressalva ou crítica;
- `incorrect`: informação materialmente incorreta;
- `not_mentioned`;
- `ambiguous`.

## 12. Proeminência

Métrica aproximada baseada em:

- posição da primeira menção;
- presença em título/lista principal;
- quantidade de texto dedicado;
- presença de link;
- linguagem de recomendação;
- repetição sem duplicação artificial.

Não utilizar “posição 1” como equivalente a ranking tradicional.

## 13. Citações

Para cada fonte:

- domínio;
- URL;
- título quando fornecido;
- posição;
- trecho associado quando permitido;
- relação com a marca;
- página do próprio projeto ou externa;
- acessibilidade no momento do teste.

## 14. Precisão da representação

Comparar a resposta com o perfil confirmado do projeto:

- localização;
- marcas;
- produtos;
- serviços;
- status de distribuidor;
- contato;
- claims principais.

Estados:

- correto;
- parcialmente correto;
- desatualizado;
- contraditório;
- não verificável.

A ferramenta deve evitar concluir falsidade quando o projeto não tiver dados suficientes.

## 15. Métricas

### Share of Model Voice

```text
SOMV = prompts com menção da marca / prompts válidos
```

### Citation Share

```text
citation_share = respostas que citam o domínio / respostas válidas
```

### Topic Coverage

Percentual de temas nos quais a marca apareceu ao menos uma vez.

### Provider Coverage

Quantidade de provedores com menção consistente.

### Competitor Share

Participação de concorrentes confirmados nas mesmas amostras.

### Accuracy Rate

Percentual de menções sem erro material identificado.

### Stability

Consistência de presença ao longo de múltiplas execuções, sem esperar respostas idênticas.

## 16. Amostra mínima

Sugestão para score oficial:

- pelo menos 10 prompts distintos;
- pelo menos 2 categorias de intenção;
- pelo menos 2 execuções temporais ou 2 provedores;
- mínimo de 20 respostas válidas.

Abaixo disso, exibir “amostra exploratória”.

## 17. Repetição e variabilidade

Configuração opcional:

- repetir prompt 2–3 vezes em momentos diferentes;
- não repetir em alta frequência sem necessidade;
- agregar por janela semanal ou mensal;
- usar mediana e intervalos;
- registrar modelo e data.

## 18. Custos e orçamento

Cada projeto possui:

- orçamento mensal;
- limite de prompts;
- limite por provedor;
- custo estimado antes da execução;
- custo real normalizado;
- alertas de consumo;
- circuit breaker quando ultrapassar limite.

## 19. Armazenamento e termos

- respeitar termos de cada provedor;
- não armazenar além do permitido;
- salvar metadados de retenção;
- permitir desabilitar armazenamento bruto;
- guardar versão do prompt e resposta normalizada;
- não expor respostas de um tenant a outro;
- aplicar expurgo conforme política e contrato.

## 20. Tela do módulo

### Visão geral

- AI Visibility Score;
- confiança;
- prompts válidos;
- menções;
- citações;
- concorrentes;
- evolução.

### Tabela

| Prompt | Provedor | Marca | Citação | Contexto | Concorrentes | Data |
|---|---|---|---|---|---|---|

### Detalhe

- prompt exato;
- configuração;
- resposta;
- trechos relevantes;
- fontes;
- classificação;
- revisão manual;
- recomendações.

## 21. Oportunidades automáticas

- criar página para tema sem cobertura;
- reforçar página citada incorretamente;
- atualizar informação desatualizada;
- obter validação externa legítima;
- criar conteúdo comparativo;
- associar marca, aplicação e região;
- melhorar evidence layer;
- corrigir inconsistência em perfis públicos.

## 22. Testes

- respostas sem citações;
- resposta recusada;
- marca com nome genérico;
- múltiplos domínios;
- homônimos;
- concorrente citado como fonte, mas não recomendação;
- resposta em outro idioma;
- erro de provedor;
- rate limit;
- modelo descontinuado;
- mudança de formato;
- replay de fixtures sem chamadas externas.

## 23. Critérios de aceite

- nenhum prompt induz a marca por padrão;
- provedor e modelo registrados;
- citações normalizadas;
- menção validada por domínio/alias/contexto;
- resultados exploratórios identificados;
- score acompanhado de amostra e confiança;
- custos rastreáveis;
- termos e retenção configuráveis;
- falha de um provedor não invalida os demais.

