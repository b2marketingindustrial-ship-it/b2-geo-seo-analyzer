# 10 — UX e Interface

## 1. Objetivos de experiência

- entregar valor inicial rapidamente;
- permitir leitura executiva e técnica;
- explicar a nota;
- reduzir sobrecarga de alertas;
- transformar findings em tarefas;
- tornar limitações visíveis;
- manter consistência entre extensão, painel e relatório.

## 2. Arquitetura de informação

### Navegação principal

- Visão geral;
- Projetos;
- Análises;
- Plano de ação;
- AI Visibility;
- Concorrentes;
- Integrações;
- Relatórios;
- Configurações;
- Uso e faturamento.

### Dentro do projeto

- Overview;
- Páginas;
- SEO;
- GEO;
- AI Visibility;
- Conteúdo;
- Ações;
- Histórico;
- Configurações.

## 3. Onboarding

### Etapa 1 — Organização

- nome;
- tipo de uso;
- marca para relatório.

### Etapa 2 — Projeto

- domínio;
- empresa;
- país e idioma;
- produtos/serviços;
- regiões;
- concorrentes opcionais.

### Etapa 3 — Primeira análise

- instalar/abrir extensão ou informar URL;
- explicar o que será coletado;
- iniciar;
- mostrar resultado parcial.

### Etapa 4 — Próximo passo

- corrigir item crítico;
- gerar plano;
- conectar Search Console;
- configurar monitoramento futuro.

## 4. Dashboard do projeto

### Cabeçalho

- nome e domínio;
- última análise;
- status;
- botões “Analisar página” e “Auditar domínio”.

### Cards

- SEO Score;
- GEO Readiness;
- AI Visibility;
- confiança;
- cobertura;
- problemas críticos;
- tarefas abertas.

### Evolução

Gráfico de score por data com marcadores de mudança de ruleset.

### Principais riscos

Máximo de cinco itens, priorizados.

### Ganhos rápidos

Itens de baixo esforço e alto impacto.

### Cobertura

Módulos concluídos, não testados e com erro.

## 5. Página do relatório

### Resumo executivo

- nota;
- contexto;
- principais pontos fortes;
- principais riscos;
- oportunidade;
- aviso metodológico.

### Tabs

- Overview;
- SEO;
- GEO;
- Performance;
- Conteúdo;
- Schemas;
- Evidências;
- Plano de ação;
- Dados brutos.

### Filtros

- score type;
- categoria;
- severidade;
- status;
- disciplina;
- esforço;
- confiança;
- resolvido/novo/regressão.

## 6. Card de finding

```text
[HIGH] Serviço principal pouco claro                 P1
Categoria: Clareza da entidade e oferta
Confiança: 88% | Esforço: Baixo | Potencial: +3,5

O que encontramos
“Conheça nossas soluções para sua indústria.”

Por que importa
A página não associa claramente a empresa a um serviço específico.

Como corrigir
Substituir o H1 por uma descrição objetiva do serviço e região.

Critério de aceite
O H1 deve conter serviço principal e o primeiro bloco deve explicar aplicação.

[Localizar na página] [Criar tarefa] [Marcar como exceção]
```

## 7. Estados visuais

- verde: aprovado;
- vermelho: crítico/alto;
- âmbar: atenção;
- azul/cinza: informação;
- cinza tracejado: não testado;
- roxo opcional: análise semântica/IA.

Não depender somente de cor. Usar ícone e texto.

## 8. Score card

Exibir:

- nota grande;
- faixa textual;
- variação desde análise anterior;
- cobertura;
- confiança;
- versão da metodologia;
- link “Como calculamos”.

Faixas sugeridas:

- 90–100: excelente preparação;
- 75–89: boa, com oportunidades;
- 50–74: precisa melhorar;
- 25–49: fraca;
- 0–24: crítica.

Evitar linguagem absoluta como “site perfeito”.

## 9. Plano de ação

### Visualizações

- lista priorizada;
- kanban;
- matriz impacto × esforço;
- por responsável;
- por disciplina;
- timeline futura.

### Disciplinas

- desenvolvimento;
- SEO técnico;
- conteúdo;
- design/UX;
- performance;
- autoridade/reputação;
- dados e integrações;
- estratégia comercial.

### Ações

- editar;
- atribuir;
- definir prazo;
- comentar;
- concluir;
- ignorar com justificativa;
- abrir evidência;
- reanalisar.

## 10. Comparação

Mostrar:

- score anterior e atual;
- itens resolvidos;
- regressões;
- novos problemas;
- mudanças sem comparabilidade;
- tarefas concluídas;
- alteração de conteúdo relevante.

## 11. AI Visibility

### Overview

- score e confiança;
- share of model voice;
- citation share;
- prompts com presença;
- concorrentes mais frequentes;
- temas sem presença;
- evolução.

### Prompt detail

- prompt;
- provedor/modelo/data;
- resposta;
- marcações de menção;
- citações;
- concorrentes;
- classificação;
- revisão manual.

## 12. Extensão

Side panel compacto:

1. seletor de projeto;
2. URL;
3. botão analisar;
4. progresso;
5. três scores;
6. críticos;
7. ganhos rápidos;
8. findings com localizar;
9. abrir relatório.

## 13. Relatório PDF

Estrutura:

1. capa;
2. escopo e data;
3. resumo executivo;
4. scores e confiança;
5. pontos corretos;
6. problemas críticos;
7. análise SEO;
8. análise GEO;
9. AI Visibility, se habilitado;
10. plano 30/60/90 dias;
11. metodologia;
12. limitações;
13. anexos técnicos.

## 14. Microcopy

Preferir:

- “Não foi possível verificar” em vez de “Falhou” para erro de coleta;
- “Possível sobreposição” em vez de “Canibalização confirmada” sem dados;
- “Potencial estimado” em vez de “Você ganhará”;
- “Não encontrado no conteúdo analisado” em vez de “Não existe”.

## 15. Acessibilidade

- navegação por teclado;
- foco visível;
- labels;
- contraste;
- texto alternativo;
- tabelas responsivas;
- gráficos com resumo textual;
- estados não dependentes de cor;
- anúncios de progresso para leitores de tela;
- redução de movimento.

## 16. Empty states

- sem análise: orientar primeiro teste;
- sem findings críticos: mostrar oportunidades e boas práticas;
- sem AI Visibility: explicar configuração e custo;
- integração sem dados: mostrar período e possíveis causas;
- sem concorrentes: permitir cadastro ou sugestão.

## 17. Critérios de aceite

- usuário identifica principais problemas em até 60 segundos;
- score sempre acompanhado de cobertura/confiança;
- finding apresenta evidência e correção;
- plano permite ordenar e atribuir;
- comparação diferencia ruleset;
- interface acessível por teclado;
- relatório não promete resultado garantido.

