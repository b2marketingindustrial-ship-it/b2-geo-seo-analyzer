# 04 — Especificação da Extensão Chrome

## 1. Objetivo

A extensão é a interface contextual do produto. Ela permite analisar a página aberta, visualizar resultados rápidos e localizar evidências diretamente no DOM.

A extensão não executará crawls pesados nem armazenará segredos de APIs externas.

## 2. Requisitos de plataforma

- Chrome Manifest V3;
- Side Panel API;
- versão mínima do Chrome definida conforme APIs utilizadas;
- código empacotado localmente, sem JavaScript remoto;
- publicação pela Chrome Web Store;
- política de privacidade pública;
- permissões mínimas.

## 3. Permissões propostas

```json
{
  "permissions": [
    "activeTab",
    "scripting",
    "storage",
    "sidePanel"
  ]
}
```

### Permissões opcionais

`host_permissions` deve ser solicitado sob demanda quando necessário. No MVP, preferir `activeTab`, acionado pelo clique do usuário, para evitar acesso permanente a todos os sites.

## 4. Componentes

### 4.1 Service worker

Responsabilidades:

- abrir o side panel;
- coordenar mensagens;
- gerenciar autenticação e token de curta duração;
- controlar estado mínimo;
- iniciar content script sob ação do usuário;
- enviar dados ao backend;
- receber atualizações de status;
- tratar retry local.

### 4.2 Content script

Responsabilidades:

- coletar o DOM renderizado;
- extrair fatos locais;
- gerar seletores estáveis;
- identificar elementos visíveis;
- destacar evidências;
- remover dados sensíveis e campos de formulário;
- devolver payload ao service worker.

### 4.3 Side panel

Responsabilidades:

- autenticação;
- seleção de organização e projeto;
- botão de análise;
- progresso;
- scores;
- categorias;
- findings;
- plano de ação resumido;
- link para painel completo.

### 4.4 Options page

Responsabilidades futuras:

- ambiente da API;
- preferências de coleta;
- exclusões locais;
- modo de desenvolvimento;
- política de privacidade.

## 5. Fluxos

### 5.1 Primeiro acesso

1. usuário instala a extensão;
2. abre o painel lateral;
3. autentica-se no domínio oficial;
4. autorização retorna token de curta duração à extensão;
5. seleciona organização e projeto;
6. extensão salva apenas identificadores e preferências não sensíveis.

### 5.2 Analisar página

1. verificar protocolo permitido (`http` ou `https`);
2. informar limitações para páginas internas do Chrome, PDFs e arquivos locais;
3. injetar content script;
4. coletar fatos locais;
5. exibir diagnóstico preliminar;
6. enviar snapshot sanitizado ao backend;
7. iniciar módulos remotos;
8. atualizar progresso por polling com backoff ou SSE por endpoint web;
9. exibir conclusão e comparação anterior.

### 5.3 Destacar evidência

1. finding contém `selector_candidates` e fingerprint;
2. extensão tenta localizar o elemento;
3. valida tag, texto parcial e atributos;
4. aplica outline temporário e scroll;
5. remove destaque após tempo ou ação do usuário;
6. se não localizar, exibe “elemento alterado desde a análise”.

## 6. Coleta local

### 6.1 Documento

- URL completa, removendo fragmentos sensíveis quando necessário;
- origem;
- title;
- idioma;
- charset;
- viewport;
- timestamp;
- `document.readyState`;
- tamanho aproximado do DOM.

### 6.2 Metadados

- meta description;
- robots;
- viewport;
- Open Graph;
- Twitter cards;
- canonical;
- alternates/hreflang;
- favicon;
- theme color.

### 6.3 Conteúdo

- H1–H6 com ordem e texto;
- blocos de texto visíveis;
- landmarks;
- tabelas;
- listas;
- FAQ aparente;
- CTAs;
- dados de contato;
- datas;
- autores;
- breadcrumbs visuais.

### 6.4 Links

- URL resolvida;
- texto âncora;
- interno/externo;
- rel;
- target;
- estado aparente;
- elemento de origem.

### 6.5 Imagens

- src atual;
- dimensões declaradas e renderizadas;
- alt;
- lazy loading;
- srcset;
- formato aparente;
- posição aproximada;
- papel decorativo ou informativo inferido.

### 6.6 Dados estruturados

- JSON-LD;
- microdata;
- RDFa;
- erros de parse;
- tipos e propriedades.

### 6.7 Formulários

A extensão pode contar formulários e tipos de CTA, porém não deve coletar:

- valores digitados;
- senhas;
- tokens;
- dados pessoais preenchidos;
- conteúdo de campos ocultos potencialmente sensíveis.

## 7. Sanitização

Antes do envio:

- remover valores de `input`, `textarea` e `select`;
- remover cookies;
- remover `Authorization`;
- mascarar parâmetros conhecidos como token, key, session e auth;
- limitar comprimento de textos;
- não enviar HTML completo por padrão quando facts forem suficientes;
- excluir elementos `script` não estruturados;
- permitir ao usuário revisar o tipo de dado coletado na política.

## 8. Payload local

```ts
interface ExtensionPageSnapshot {
  schemaVersion: '1.0';
  capturedAt: string;
  url: string;
  document: DocumentFacts;
  metadata: MetadataFacts;
  headings: HeadingFact[];
  textBlocks: TextBlockFact[];
  links: LinkFact[];
  images: ImageFact[];
  schemas: StructuredDataFact[];
  contacts: ContactFact[];
  localFindings: LocalFinding[];
  collectionWarnings: string[];
}
```

## 9. Geração de seletores

Ordem de preferência:

1. `id` único e não aleatório;
2. atributo semântico estável;
3. combinação de tag e classe estável;
4. caminho relativo ao landmark;
5. `nth-of-type` como último recurso.

Armazenar fingerprint adicional:

- tag;
- texto normalizado parcial;
- classes;
- atributos relevantes;
- posição relativa.

## 10. Regras locais do MVP

A extensão pode calcular imediatamente:

- ausência ou duplicidade aparente de H1;
- title ausente ou fora da faixa configurada;
- description ausente;
- canonical ausente ou divergente;
- meta robots `noindex`;
- imagens sem alt;
- links sem texto acessível;
- JSON-LD inválido;
- ausência de idioma;
- headings fora de ordem como warning;
- falta de identificação clara da empresa;
- falta de CTA;
- ausência de região ou aplicação, com avaliação semântica opcional no backend.

## 11. Estado e cache

Armazenar localmente apenas:

- identificadores de organização e projeto;
- preferências;
- token de curta duração ou sessão conforme estratégia segura;
- último status por aba;
- resultados resumidos temporários.

Não armazenar respostas completas de IA, snapshots ou tokens de integração.

## 12. Autenticação

Estratégia recomendada:

- fluxo OAuth/OIDC no domínio web;
- callback controlado;
- token de acesso curto;
- refresh realizado com mecanismo seguro compatível;
- revogação no logout;
- associação da instalação a um `device_id` aleatório;
- nenhuma chave de API externa na extensão.

## 13. Comunicação

Mensagens internas tipadas:

```ts
type ExtensionMessage =
  | { type: 'CAPTURE_PAGE_REQUEST' }
  | { type: 'CAPTURE_PAGE_RESULT'; payload: ExtensionPageSnapshot }
  | { type: 'HIGHLIGHT_ELEMENT'; payload: HighlightRequest }
  | { type: 'ANALYSIS_STATUS_CHANGED'; payload: RunSummary }
  | { type: 'AUTH_STATE_CHANGED'; payload: AuthState };
```

## 14. UX do side panel

### Estados principais

- não autenticado;
- sem projeto;
- pronto para analisar;
- coletando página;
- resultado local disponível;
- processando módulos remotos;
- concluído;
- parcialmente concluído;
- erro recuperável;
- página não suportada.

### Componentes

- cabeçalho com projeto;
- URL analisada;
- cards SEO/GEO/AI Visibility;
- progresso por módulo;
- resumo de findings;
- filtros por severidade;
- botão “localizar na página”;
- botão “gerar plano de ação”;
- botão “abrir relatório completo”.

## 15. Páginas não suportadas ou limitadas

- `chrome://`;
- Chrome Web Store;
- páginas protegidas pelo navegador;
- arquivos locais sem permissão;
- PDFs: redirecionar para análise remota específica em fase posterior;
- páginas autenticadas: análise local permitida sob ação, mas envio de conteúdo remoto deve exigir aviso e configuração;
- iframes cross-origin: apenas sinais acessíveis, sem contornar políticas do navegador.

## 16. Política de erros

- erro de content script: permitir tentar novamente;
- erro de autenticação: renovar sessão ou solicitar login;
- payload excedido: reduzir detalhes e enviar facts;
- API indisponível: preservar snapshot temporário por período curto;
- análise remota bloqueada: manter resultado local e explicar limitação;
- página alterada: invalidar destaque, não o finding histórico.

## 17. Telemetria

Com consentimento e sem conteúdo da página:

- versão da extensão;
- evento de abertura;
- início e conclusão de análise;
- duração;
- código de erro;
- uso de destaque;
- navegação para painel.

Não registrar URL completa em telemetria genérica sem necessidade; utilizar domínio ou hash conforme política.

## 18. Testes da extensão

- unitários para extratores;
- fixtures HTML;
- testes de integração de messaging;
- Playwright com extensão carregada;
- páginas estáticas e SPA;
- shadow DOM quando acessível;
- CSP restritiva;
- sites com grande DOM;
- regressão de permissões;
- revisão de política da Chrome Web Store.

## 19. Critérios de aceite do MVP

- abrir no side panel;
- funcionar com `activeTab` após ação explícita;
- não coletar valores de formulários;
- detectar metadados e headings em páginas estáticas e SPA;
- enviar facts ao backend;
- exibir resultado parcial;
- localizar ao menos 90% dos elementos de fixtures não alteradas;
- logout revogar sessão;
- nenhum segredo presente no bundle.

