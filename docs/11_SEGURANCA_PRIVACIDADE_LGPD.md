# 11 — Segurança, Privacidade e LGPD

## 1. Escopo

O produto processa contas, dados de projetos, conteúdo público de sites, possíveis conteúdos de páginas autenticadas sob ação do usuário, credenciais de integrações e respostas de provedores de IA.

Este documento é uma especificação técnica inicial e deve ser revisado por jurídico/DPO antes do lançamento.

## 2. Princípios

- minimização;
- finalidade explícita;
- transparência;
- segurança por padrão;
- menor privilégio;
- segregação de tenants;
- retenção limitada;
- auditabilidade;
- exclusão e portabilidade quando aplicáveis;
- privacy by design.

## 3. Papéis de dados

Conforme o fluxo, a empresa operadora pode atuar como controladora dos dados de conta e operadora de dados inseridos por clientes. Contratos e termos devem definir responsabilidades.

## 4. Inventário de dados

### Conta

- nome;
- e-mail;
- organização;
- papel;
- logs de autenticação.

### Projeto

- domínio;
- nome de empresa;
- produtos/serviços;
- concorrentes;
- configurações.

### Conteúdo analisado

- conteúdo público;
- HTML/DOM sanitizado;
- screenshots opcionais;
- URLs;
- metadados;
- dados estruturados.

### Integrações

- tokens OAuth;
- propriedades;
- métricas agregadas;
- escopos.

### IA

- prompts;
- respostas;
- citações;
- uso e custo;
- modelos/provedores.

## 5. Base e finalidade

A documentação legal deve mapear base legal aplicável para:

- execução do contrato;
- consentimento para integrações opcionais;
- legítimo interesse para segurança e melhoria, com avaliação;
- cumprimento de obrigação legal;
- comunicações de marketing separadas.

## 6. Extensão e consentimento

A extensão deve:

- agir somente após clique para coleta da página;
- explicar categorias coletadas;
- não ler valores de formulários;
- não monitorar navegação continuamente no MVP;
- não executar em todas as páginas sem necessidade;
- permitir logout e revogação;
- disponibilizar política de privacidade.

Para analisar área autenticada e enviar conteúdo ao backend, exigir configuração explícita e aviso adicional.

## 7. Segregação multi-tenant

- `organization_id` em recursos;
- middleware de tenant;
- autorização em serviço e repositório;
- RLS opcional/recomendada;
- testes de isolamento;
- storage key prefixada por tenant;
- cache com namespace;
- filas carregam tenant e são validadas;
- exports assinados e temporários.

## 8. Criptografia

- TLS 1.2+;
- banco e storage cifrados;
- tokens OAuth com envelope encryption;
- chaves em secret manager;
- rotação;
- backups cifrados;
- senhas com algoritmo moderno quando autenticação própria existir.

## 9. Gestão de segredos

- nunca em código;
- nunca na extensão;
- ambientes separados;
- acesso por identidade de workload;
- rotação programada;
- auditoria;
- detecção de segredo em CI;
- revogação imediata em incidente.

## 10. SSRF e crawler

Controles obrigatórios:

- bloqueio de redes privadas;
- validação após DNS e redirects;
- egress allow/deny controlado;
- portas permitidas;
- timeout;
- limite de tamanho;
- sem cookies do usuário;
- sandbox do navegador;
- workers isolados;
- proteção contra decompression bombs.

## 11. Conteúdo malicioso

Páginas analisadas são entrada não confiável.

- não executar scripts fora do browser sandbox;
- não renderizar HTML bruto no painel sem sanitização;
- Content Security Policy rigorosa;
- escapar trechos;
- validar URLs;
- bloquear `javascript:`;
- sanitizar SVG/HTML;
- arquivos baixados não são executados.

## 12. Prompt injection

Conteúdo de sites pode conter instruções maliciosas para o modelo.

Mitigações:

- tratar conteúdo como dado, não instrução;
- system prompt explícito;
- não permitir que modelo acione ferramentas arbitrárias;
- tools com allowlist;
- saída estruturada;
- validação de evidências;
- limites de contexto;
- remover scripts e conteúdo invisível suspeito;
- registrar prompt template;
- revisão de outputs de alto impacto.

## 13. APIs externas

- Data Processing Agreements quando aplicáveis;
- configuração de retenção;
- não enviar dados privados ao módulo de IA por padrão;
- registrar provedor e região;
- permitir desativar determinado provedor;
- não misturar dados entre clientes;
- revisar termos periodicamente.

## 14. Logging

Nunca registrar:

- tokens;
- cookies;
- senhas;
- HTML completo;
- valores de formulário;
- respostas brutas sensíveis;
- parâmetros de URL sem sanitização.

Logs devem conter IDs, status, duração e códigos de erro.

## 15. RBAC

### Owner

Tudo, incluindo exclusão e faturamento.

### Admin

Projetos, usuários, integrações e análises, exceto transferência de ownership.

### Analyst

Criar análises, findings, planos e relatórios.

### Editor

Editar tarefas e configurações de conteúdo limitadas.

### Viewer

Somente leitura e exportação conforme permissão.

### Billing

Plano, uso e faturas.

## 16. Auditoria

Registrar:

- login e falhas relevantes;
- convite e remoção;
- alteração de papel;
- conexão/revogação de integração;
- exportação;
- exclusão;
- mudança de retenção;
- acesso administrativo;
- alteração de ruleset em produção.

## 17. Retenção e direitos

Disponibilizar processo para:

- acesso;
- correção;
- exportação;
- exclusão;
- revogação de integração;
- oposição quando aplicável;
- contato com encarregado.

Definir SLAs operacionais internos.

## 18. Incidentes

Plano mínimo:

1. detectar;
2. conter;
3. preservar evidências;
4. avaliar impacto;
5. revogar credenciais;
6. corrigir;
7. comunicar responsáveis e autoridades quando aplicável;
8. revisar causa raiz;
9. acompanhar ações.

## 19. Secure SDLC

- threat modeling por módulo;
- revisão de código;
- SAST;
- dependabot/renovate;
- SCA;
- secret scanning;
- DAST em staging;
- testes de autorização;
- pentest antes de enterprise/SSO;
- SBOM;
- assinatura de artifacts quando viável.

## 20. Headers e browser security

Painel:

- CSP;
- HSTS;
- frame-ancestors;
- Referrer-Policy;
- Permissions-Policy;
- cookies Secure, HttpOnly e SameSite;
- proteção CSRF quando cookies forem usados.

## 21. Backups

- backup automático;
- teste de restauração;
- retenção definida;
- acesso restrito;
- cifrado;
- RPO/RTO documentados.

## 22. Checklist pré-lançamento

- política de privacidade;
- termos de uso;
- DPA;
- página do crawler;
- processo de exclusão;
- inventário de dados;
- revisão de permissões da extensão;
- pentest focal;
- rotação de chaves;
- backups testados;
- alertas de segurança;
- contato de incidente.

## 23. Critérios de aceite

- teste automatizado de cross-tenant;
- secrets fora do bundle;
- SSRF bloqueada;
- valores de formulário não coletados;
- tokens cifrados;
- logs sanitizados;
- exclusão funcional;
- auditoria de ações sensíveis;
- política visível;
- provedor de IA configurável por projeto/organização quando necessário.

