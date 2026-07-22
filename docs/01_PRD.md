# 01 — Product Requirements Document (PRD)

## 1. Identificação

- **Produto:** B2 GEO/SEO Analyzer
- **Categoria:** SaaS B2B de auditoria de visibilidade digital
- **Mercado inicial:** empresas industriais, distribuidores, integradores, prestadores de serviço técnico e agências B2B
- **Plataformas:** extensão Chrome e painel web responsivo
- **Idioma inicial:** português do Brasil
- **Idiomas futuros:** inglês e espanhol

## 2. Problema

Empresas investem em sites, landing pages e conteúdo, mas normalmente não conseguem responder de maneira objetiva:

- por que determinada página não aparece bem no Google;
- se a página pode ser acessada por mecanismos de IA;
- se o conteúdo é suficientemente claro para ser utilizado como fonte;
- se a empresa apresenta sinais de autoridade para ser recomendada;
- quais correções geram maior impacto;
- como acompanhar a evolução ao longo do tempo.

Ferramentas tradicionais cobrem partes do problema, porém frequentemente:

- concentram-se em SEO técnico ou palavras-chave;
- apresentam métricas sem explicar a aplicação comercial;
- não separam preparação GEO de visibilidade real em IA;
- não priorizam evidências técnicas relevantes ao mercado industrial;
- geram listas extensas de alertas sem um plano de execução.

## 3. Proposta de valor

> Analisar se uma página está preparada para ser encontrada no Google, compreendida por mecanismos de IA e considerada confiável por potenciais compradores, convertendo o diagnóstico em um plano de ação executável.

## 4. Objetivos de negócio

1. Criar um produto recorrente complementar aos serviços da B2 Marketing Industrial.
2. Gerar oportunidades de consultoria, SEO, conteúdo, sites e automação.
3. Criar uma metodologia proprietária de GEO e SEO industrial.
4. Consolidar dados de desempenho em um único ambiente.
5. Integrar futuramente a solução ao B2 Hub.
6. Permitir modelo white-label para agências e consultorias.

## 5. Objetivos do usuário

- obter diagnóstico em poucos minutos;
- entender por que a nota foi atribuída;
- visualizar elementos corretos e incorretos;
- identificar problemas críticos;
- receber instruções específicas de correção;
- delegar tarefas para marketing, desenvolvimento e conteúdo;
- comparar páginas e concorrentes;
- acompanhar a evolução do site;
- medir presença em respostas generativas.

## 6. Não objetivos

O produto não pretende:

- substituir integralmente especialistas de SEO ou estratégia de conteúdo;
- prever com certeza rankings ou recomendações futuras;
- afirmar que existe um algoritmo universal de GEO;
- burlar políticas de mecanismos de busca;
- gerar backlinks artificiais;
- publicar alterações no site sem autorização;
- rastrear áreas autenticadas sem configuração e consentimento específicos;
- coletar informações pessoais desnecessárias;
- reproduzir exatamente a experiência personalizada dos aplicativos públicos de IA.

## 7. Personas

### 7.1 Gestor de marketing industrial

**Necessidades:** visão geral, prioridades, impacto comercial e evolução.  
**Dores:** relatórios técnicos demais, dificuldade para justificar investimento e falta de clareza sobre o próximo passo.

### 7.2 Especialista de SEO/GEO

**Necessidades:** detalhes de indexação, intenção, conteúdo, schemas, links, rastreamento e evidências.  
**Dores:** dados dispersos, repetição de análises manuais e dificuldade de padronizar auditorias.

### 7.3 Desenvolvedor web

**Necessidades:** localização exata do problema, código afetado, recomendação e critério de aceite.  
**Dores:** solicitações genéricas como “melhorar SEO” sem especificação técnica.

### 7.4 Redator ou especialista técnico

**Necessidades:** lacunas de conteúdo, perguntas não respondidas, claims sem prova, entidades e aplicações ausentes.  
**Dores:** briefs superficiais e falta de priorização.

### 7.5 Diretor ou proprietário

**Necessidades:** risco, oportunidade, concorrentes, impacto e acompanhamento.  
**Dores:** dificuldade de relacionar presença digital a oportunidades de negócio.

### 7.6 Agência white-label

**Necessidades:** múltiplos clientes, marca própria, relatórios e gestão de usuários.  
**Dores:** custo operacional alto para auditorias recorrentes.

## 8. Jobs to be done

- Quando eu acessar uma página, quero analisá-la imediatamente para saber se está preparada para SEO e GEO.
- Quando receber uma nota baixa, quero entender exatamente o que causou o resultado.
- Quando houver muitos problemas, quero uma sequência de execução por impacto e esforço.
- Quando corrigir a página, quero comparar o antes e o depois.
- Quando minha empresa não for recomendada por uma IA, quero identificar quais concorrentes e fontes estão ocupando esse espaço.
- Quando apresentar o diagnóstico a um cliente, quero exportar um relatório profissional e explicável.

## 9. Escopo funcional por módulo

### 9.1 Extensão Chrome

- login;
- seleção do projeto;
- análise da aba ativa;
- coleta local do DOM e metadados permitidos;
- resumo imediato;
- envio ao backend;
- acompanhamento do processamento;
- destaque de elementos na página;
- acesso ao relatório completo.

### 9.2 Painel web

- gestão de organizações e projetos;
- relatórios por URL e domínio;
- histórico de análises;
- comparação entre versões;
- plano de ação;
- filtros e exportações;
- configurações de marca, região e concorrentes;
- integrações;
- consumo e faturamento.

### 9.3 Motor de SEO

- rastreamento e indexabilidade;
- metadados;
- headings;
- conteúdo;
- links;
- imagens;
- dados estruturados;
- performance;
- mobile;
- acessibilidade relevante;
- arquitetura do domínio nas fases posteriores.

### 9.4 Motor GEO

- acessibilidade a crawlers de busca e IA;
- clareza da entidade e da oferta;
- completude de resposta;
- experiência, autoridade e evidências;
- estrutura semântica;
- consistência da entidade;
- transparência e atualização;
- adequação a intenções informacionais, comerciais, técnicas e locais.

### 9.5 AI Visibility

- cadastro de temas e prompts;
- execução por provedor habilitado;
- armazenamento da resposta, citações e metadados permitidos;
- detecção de menções à marca e concorrentes;
- análise de frequência, posição e contexto;
- nível de confiança;
- comparação histórica.

### 9.6 Plano de ação

- agrupamento por disciplina;
- prioridade por impacto, esforço e urgência;
- responsável sugerido;
- critérios de aceite;
- estimativa de ganho potencial na pontuação;
- status, comentários e prazos;
- exportação e integração futura com gestão de tarefas.

## 10. Requisitos funcionais

### RF-001 — Cadastro e autenticação

O usuário deve criar uma conta, autenticar-se e recuperar o acesso. A autenticação deve suportar OIDC e, no mínimo, login por e-mail.

### RF-002 — Multi-tenancy

Toda informação deve pertencer a uma organização. Um usuário pode participar de mais de uma organização com papéis diferentes.

### RF-003 — Projeto

O usuário deve cadastrar um projeto contendo domínio, nome da empresa, país, idioma, regiões atendidas, produtos, serviços, marcas e concorrentes.

### RF-004 — Análise da página ativa

A extensão deve coletar sinais da aba ativa após ação explícita do usuário e criar uma execução de análise.

### RF-005 — Análise pública por URL

O painel deve aceitar URL pública e iniciar coleta pelo backend.

### RF-006 — Resultado parcial

O sistema deve exibir resultados determinísticos assim que disponíveis, sem aguardar todos os módulos opcionais.

### RF-007 — Evidência

Cada finding deve armazenar: regra, resultado, severidade, evidência, origem, recomendação e estado de verificabilidade.

### RF-008 — Pontuação

O sistema deve calcular notas separadas para SEO e GEO. A nota consolidada deve ser opcional e configurável.

### RF-009 — Confiança

Cada categoria e score deve apresentar cobertura e confiança conforme os dados realmente coletados.

### RF-010 — Plano de ação

O usuário deve gerar tarefas a partir dos findings e reordená-las.

### RF-011 — Comparação

O usuário deve comparar duas análises da mesma URL e visualizar itens resolvidos, regressões e alterações de pontuação.

### RF-012 — Exportação

O sistema deve exportar relatório em PDF e itens de ação em CSV.

### RF-013 — Destaque na página

Quando a evidência vier do DOM, a extensão deve permitir localizar ou destacar o elemento, desde que ele ainda exista.

### RF-014 — Crawl de domínio

Em fase posterior, o usuário deve configurar limites de páginas, velocidade, escopo e exclusões para rastrear o domínio.

### RF-015 — Integração Search Console

O usuário deve conectar uma propriedade autorizada e escolher quais projetos podem acessar os dados.

### RF-016 — Monitoramento AI Visibility

O usuário deve cadastrar um conjunto de prompts e uma periodicidade respeitando os limites do plano e dos provedores.

### RF-017 — Auditoria de alterações

Ações administrativas, integrações, exportações e alterações de configuração devem ser registradas.

### RF-018 — Exclusão de dados

Usuários autorizados devem solicitar exclusão de projeto, análises e integrações, respeitando retenção legal e operacional.

## 11. Requisitos não funcionais

### RNF-001 — Desempenho

- interface da extensão deve abrir em até 1 segundo em condições normais;
- coleta local básica deve concluir em até 3 segundos para páginas comuns;
- API síncrona deve responder em até 800 ms no percentil 95, excluindo jobs;
- análise padrão deve usar processamento assíncrono.

### RNF-002 — Consistência

Resultados determinísticos da mesma versão de regra e do mesmo snapshot devem ser idênticos.

### RNF-003 — Escalabilidade

Workers devem escalar horizontalmente e utilizar idempotência por job.

### RNF-004 — Disponibilidade

Meta inicial de 99,5% mensal para painel e API, excluindo manutenção programada.

### RNF-005 — Segurança

Criptografia em trânsito, segregação por tenant, rotação de segredos, menor privilégio e proteção contra SSRF são obrigatórias.

### RNF-006 — Observabilidade

Logs estruturados, métricas, traces e alertas devem permitir rastrear uma análise por `analysis_run_id`.

### RNF-007 — Evolução das regras

Toda regra deve ter versão. Uma alteração de pesos não deve reescrever silenciosamente resultados históricos.

### RNF-008 — Acessibilidade

Painel e extensão devem buscar conformidade com WCAG 2.2 nível AA nas interfaces principais.

### RNF-009 — Compatibilidade

A primeira versão da extensão será suportada em Chrome compatível com Side Panel API, definido no `minimum_chrome_version`.

### RNF-010 — Internacionalização

Textos de interface e regras devem estar desacoplados para tradução futura.

## 12. Métricas de produto

### Aquisição e ativação

- instalações da extensão;
- organizações criadas;
- percentual que conclui a primeira análise;
- tempo até primeiro valor;
- projetos ativos por semana.

### Engajamento

- análises por organização;
- páginas reanalisadas;
- tarefas geradas;
- tarefas concluídas;
- relatórios exportados;
- integrações conectadas.

### Resultado

- variação média de score após correções;
- percentual de findings resolvidos;
- aumento de páginas indexáveis;
- evolução de cliques e impressões em projetos conectados;
- evolução de presença em prompts monitorados.

### Qualidade

- divergência entre análise local e backend;
- taxa de falso positivo reportado;
- jobs com erro;
- tempo de processamento;
- custo médio por análise;
- estabilidade de score.

## 13. Planos comerciais sugeridos

### Starter

- análise de páginas;
- histórico limitado;
- SEO e GEO;
- exportação básica.

### Professional

- crawl de domínio;
- integrações;
- comparação com concorrentes;
- plano de ação colaborativo;
- AI Visibility limitado.

### Agency

- múltiplas organizações/clientes;
- white-label;
- usuários adicionais;
- relatórios customizados;
- limites superiores.

### Enterprise

- SSO;
- retenção customizada;
- SLA;
- auditoria avançada;
- implantação dedicada opcional;
- integrações personalizadas.

## 14. Dependências de produto

- disponibilidade e termos de APIs externas;
- limites da Chrome Web Store;
- estabilidade do Lighthouse e navegadores;
- políticas de crawlers e robots;
- autorização de propriedades do Search Console;
- custos e variação dos provedores de IA;
- regras de proteção de dados aplicáveis.

## 15. Definição de pronto do produto

Uma feature é considerada pronta quando:

- requisitos e critérios de aceite estão aprovados;
- código revisado e testado;
- telemetria adicionada;
- segurança revisada conforme risco;
- documentação atualizada;
- migrações reversíveis ou plano de rollback disponível;
- comportamento de erro tratado;
- feature flag utilizada quando necessário;
- não há dependência de segredo no cliente.

