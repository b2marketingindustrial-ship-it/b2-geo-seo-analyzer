# 15 — Decisões Arquiteturais e Riscos

## 1. ADR-001 — Monólito modular com workers

**Decisão:** backend principal modular, processamento pesado em workers.  
**Motivo:** menor custo e complexidade no MVP, com escala horizontal.  
**Consequência:** exigir fronteiras claras para evitar monólito acoplado.

## 2. ADR-002 — TypeScript principal

**Decisão:** extensão, painel, API e workers em TypeScript; Python somente se uma biblioteca específica justificar.  
**Motivo:** contratos compartilhados e equipe mais produtiva.  
**Consequência:** Lighthouse/Playwright/NestJS integram bem; processamento científico futuro pode usar serviço Python.

## 3. ADR-003 — Facts layer

**Decisão:** coletores não criam diretamente o score; produzem facts normalizados.  
**Motivo:** testes, versionamento e reuso.  
**Consequência:** trabalho inicial maior de modelagem.

## 4. ADR-004 — Score determinístico como base

**Decisão:** IA complementa, não controla toda a nota.  
**Motivo:** estabilidade e explicabilidade.  
**Consequência:** catálogo de regras precisa de manutenção especializada.

## 5. ADR-005 — GEO e AI Visibility separados

**Decisão:** duas notas independentes.  
**Motivo:** preparação não equivale a aparição observada.  
**Consequência:** interface precisa educar o usuário.

## 6. ADR-006 — Versionamento imutável

**Decisão:** ruleset, prompts e snapshots versionados.  
**Motivo:** comparação justa e auditoria.  
**Consequência:** maior volume de dados e necessidade de migração cuidadosa.

## 7. ADR-007 — Permissões mínimas na extensão

**Decisão:** `activeTab` preferencial em vez de acesso permanente amplo.  
**Motivo:** confiança e aprovação na loja.  
**Consequência:** algumas automações locais ficam limitadas.

## 8. ADR-008 — Não hardcode de modelos IA

**Decisão:** modelos e capacidades em configuração.  
**Motivo:** mudanças frequentes dos provedores.  
**Consequência:** exigir testes de capacidade e fallback.

## 9. ADR-009 — Object storage para artifacts

**Decisão:** HTML, screenshots e relatórios fora do banco.  
**Motivo:** custo e performance.  
**Consequência:** lifecycle e segurança de URLs assinadas.

## 10. ADR-010 — Respeito a robots por padrão

**Decisão:** crawler próprio obedece robots.  
**Motivo:** operação ética e previsível.  
**Consequência:** algumas páginas serão não testadas remotamente; extensão pode oferecer análise local sob ação.

## 11. Matriz de riscos

| Risco | Prob. | Impacto | Mitigação |
|---|---:|---:|---|
| Nota percebida como oficial | Alta | Alto | Avisos, metodologia pública e scores separados |
| Falso positivo semântico | Média | Alto | Evidência, confiança, validação humana e golden dataset |
| Mudança de APIs IA | Alta | Médio/Alto | Adapter, config e feature flags |
| Custo de IA/Lighthouse | Média | Alto | Orçamentos, cache, filas e limites |
| Bloqueio de crawler | Alta | Médio | Resultado parcial e análise local |
| SSRF | Média | Crítico | Isolamento, DNS validation e egress control |
| Vazamento cross-tenant | Baixa/Média | Crítico | RBAC, RLS, testes e auditoria |
| Extensão rejeitada | Média | Alto | Permissões mínimas, política e revisão |
| Score instável | Média | Alto | Determinismo, versionamento e calibração |
| Relatório excessivamente técnico | Média | Médio | visão executiva + técnica |
| Crawler sobrecarrega sites | Baixa/Média | Alto | rate limit, robots, backoff |
| Conteúdo privado enviado por engano | Média | Crítico | sanitização, consentimento e bloqueios |
| Termos de provedor impedem armazenamento | Média | Alto | retention por provider e jurídico |
| Site muda durante análise | Alta | Baixo/Médio | snapshots e timestamp |
| Modelos reproduzem informação incorreta | Alta | Médio | accuracy status e não tratar como verdade |
| Dependência de fornecedor | Média | Alto | abstrações e exportabilidade |

## 12. Risco metodológico

Não existe padrão universal e estático de GEO. A metodologia deve ser apresentada como proprietária, baseada em sinais observáveis e boas práticas de descoberta, conteúdo, entidade e autoridade.

Mitigação:

- documentação pública de alto nível;
- changelog;
- estudos de calibração;
- especialistas;
- revisão periódica;
- não vender garantia.

## 13. Risco de gamificação

Usuários podem tentar otimizar apenas a nota, criando conteúdo artificial.

Mitigação:

- peso em utilidade e evidência;
- penalizar inconsistência;
- evitar métricas superficiais rígidas;
- análise semântica;
- mensagem “qualidade antes da pontuação”.

## 14. Risco de conteúdo industrial incorreto

Modelos podem sugerir especificações ou normas inadequadas.

Mitigação:

- sugestões não publicadas automaticamente;
- placeholders;
- revisão técnica obrigatória;
- fontes;
- classificação de afirmações;
- não inventar números.

## 15. Risco de comparação injusta

Sites de tipos diferentes não devem ser comparados apenas por score.

Mitigação:

- page type;
- regras aplicáveis;
- cobertura;
- benchmark por categoria;
- contexto de objetivo.

## 16. Risco de performance variável

Lighthouse varia por condição.

Mitigação:

- configuração fixa;
- versão;
- múltiplas execuções quando necessário;
- dados de campo separados;
- mediana;
- não copiar score diretamente como score SEO.

## 17. Open questions

- nome comercial final;
- modelo de cobrança por consumo;
- quais provedores entram na primeira versão de AI Visibility;
- retenção padrão de snapshots;
- white-label no MVP ou posterior;
- quais integrações com B2 Hub primeiro;
- regras específicas por segmento industrial;
- benchmark anonimizado entre clientes;
- política para páginas autenticadas.

## 18. Revisão de riscos

- mensal durante desenvolvimento;
- antes do beta;
- a cada provider novo;
- a cada alteração major do ruleset;
- após incidentes;
- trimestral em produção.

