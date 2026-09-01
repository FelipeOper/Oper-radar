# Auditoria pré-implementação — Redesign OPER RADAR

**Data da auditoria:** 31/08/2026  
**Escopo:** análise estática integral do projeto local, sem alteração de código-fonte  
**Referência de comportamento:** `Atualização/Mapa-Funcional-OPER-RADAR-v1.0.docx`  
**Referência de governança e sequência:** `Atualização/Plano-mestre-redesign-Oper-Radar.docx`  
**Referência visual:** três telas aprovadas anexadas ao Plano Mestre e os 16 mockups do pacote `Atualização/OPER-RADAR-Mockups-Telas-01-a-16-FINAL.zip`

## Resumo executivo

O OPER RADAR atual já possui uma fundação operacional relevante: coleta nacional, ciclo de vida de anúncios, enriquecimento de detalhe, catálogo e matching FIPE, snapshots/eventos, autenticação, estoque próprio, APIs PHP e uma SPA React funcional. Essa base permite reaproveitar boa parte da ingestão, identidade dos anúncios, taxonomia, filtros, regras de qualidade de preço, FIPE, histórico observado e operações de Minha Loja.

O redesign planejado, porém, **não é uma troca apenas visual**. Ele altera a arquitetura de informação, a navegação, o contrato de contexto, a forma de comparar veículos, a rastreabilidade dos insights e o modo como as telas consomem dados. A implementação atual não possui URLs de tela, breadcrumb persistente, estado global serializado, restauração de posição, envelope uniforme de evidências, central de alertas, comparador de concorrentes, saúde dos dados completa nem configurações administrativas previstas.

### Veredito por camada

| Camada | Situação atual | Leitura para o redesign |
|---|---|---|
| Coleta e ciclo de vida | **Reutilizável com ajustes** | A base é sólida, mas a cobertura/cadência precisa ser exposta como metadado e saúde operacional. |
| Banco e histórico | **Parcialmente reutilizável** | Há entidades centrais, mas faltam contratos explícitos para grupos equivalentes, alertas, visualizações salvas, fontes e auditoria administrativa. |
| FIPE e qualidade de preço | **Reutilizável, com refatoração de escopo** | A mediana e os filtros robustos já existem; hoje os comparáveis dependem principalmente do mesmo `fipe_preco_id`, não do grupo equivalente completo do mapa. |
| APIs | **Reutilizáveis como transição** | Cobrem as telas atuais, mas não o envelope, drill-down, períodos, evidência e paginação por cursor previstos. |
| Frontend | **Refatoração estrutural necessária** | A SPA funciona, porém está concentrada em um único `App.jsx`, sem roteador e com arquitetura visual diferente da aprovada. |
| Desktop planejado | **Não implementado como especificado** | Existem funções equivalentes em telas atuais, mas nenhuma das três telas aprovadas está reproduzida integralmente. |
| Mobile | **Base responsiva parcial** | Há navegação inferior e grids adaptáveis; não há contrato mobile das novas telas nem garantia de contexto/retorno. |
| Acessibilidade | **Fundação parcial** | Há foco visível, redução de movimento e vários rótulos ARIA; faltam testes WCAG, gestão de foco, semântica completa e validação a 320 px. |
| Operação e deploy | **Risco de governança alto** | O código vigente está em um worktree limpo de `main`, enquanto a raiz aberta está em branch anterior, suja e divergente. |

## Método, fontes e limites

Foram examinados:

- os dois documentos DOCX da pasta `Atualização`, incluindo texto, tabelas e imagens incorporadas;
- as três referências aprovadas: Tela 1 — Visão estratégica, Tela 2 — Mercado nacional e Tela 3 — Mercado por estado/Minas Gerais;
- os 16 mockups do pacote final;
- o código do frontend, API PHP, coleta Python/PHP, FIPE, séries, acesso, monitoramento, SQL, documentação e testes;
- o histórico Git recente e a situação dos worktrees;
- os contratos automatizados existentes do frontend.

Os números exibidos nos mockups foram tratados como demonstração, conforme solicitado. A auditoria compara estrutura, comportamento, semântica e dependências; não exige que valores ilustrativos existam na base real.

Esta auditoria não validou o ambiente publicado com uma sessão autenticada e não executou consultas no banco de produção. O estado operacional citado vem de `docs/PRODUCAO.md`, cuja última verificação registrada é 27/08/2026. Os 14 testes JavaScript existentes passaram. PHP e Python não estavam disponíveis no ambiente local desta auditoria, portanto suas suítes não foram reexecutadas.

### Baseline técnico adotado

O baseline de código usado foi o `main` limpo em:

```text
.worktrees/baseline-operacional
commit 1e9b7a1 — Merge pull request #50
```

Commits imediatamente anteriores relevantes:

- `75303bd` — comparação por ano e localização do DAF XF 530;
- `3b3520e` — backfill de detalhes a cada 30 minutos;
- `3e66b5c` — separação do mercado principal, comparador e plano nacional;
- `3a0b808` — tratamento de anúncios sem preço;
- `f72abdf` / `a1e7bb1` — reprocessamento FIPE sem dados.

A raiz do projeto está na branch `agent/separa-familias-daf`, com alterações e arquivos não rastreados, enquanto o `main` mais recente está no worktree acima. Essa divergência é registrada como risco crítico na seção 8.

## 1. Arquitetura atual do sistema

### 1.1 Visão em camadas

```text
Portal Caminhões e Carretas
        │
        ├── scraper_hostgator.py / coleta_multi_uf.py
        ├── scraper_detalhe.py
        └── ciclo de status e diff
                │
                ▼
MySQL 5.7 em hospedagem compartilhada
  revenda, anuncio, execucao_coleta, FIPE,
  snapshots, eventos, usuários e estoque próprio
                │
                ▼
API PHP autenticada por sessão
  endpoints JSON + regras em oper-radar-api/lib
                │
                ▼
SPA React 18 + Vite
  estado local, páginas internas e drawers
                │
                ├── Anthropic opcional para Analista IA
                └── provedor de consulta por placa opcional
```

### 1.2 Coleta e processamento

- `fase1-coleta/scraper_hostgator.py` coleta listagens por UF e revenda.
- `fase1-coleta/coleta_multi_uf.py` orquestra as UFs em sequência, com lock, checkpoint, retomada e timeout por UF.
- O plano `nacional` cobre as 26 UFs fora do Paraná; o PR permanece em cron dedicado.
- `fase1-coleta/diff_logic.py` modela `ativo`, `removido_candidato` e `removido_confirmado`. Duas ausências consecutivas confirmam a saída; reaparecimento restaura o anúncio.
- `fase1-coleta/scraper_detalhe.py` enriquece apenas caminhões ativos sem detalhe, com backoff, classificação de falhas e interrupção por suspeita de bloqueio.
- `fase2-fipe/fipe_sync.py` mantém catálogo, referência mensal, matching e sugestões FIPE.
- `fase3-series/snapshot_diario.py` e `materializar_eventos.py` criam séries e eventos observados.
- `monitoramento/verificar_saude.py` verifica atraso de coleta, falhas, volume ativo, snapshot e referência FIPE.

Cadências versionadas:

| Rotina | Cadência atual no repositório |
|---|---|
| Coleta PR | 07h e 19h |
| Coleta nacional sem PR | 08h e 20h |
| Detalhes de caminhões | A cada 30 minutos, lote 80, pausa de 4 s, com `flock` |
| FIPE local | 12h45 e 23h45 |
| FIPE mensal | Dias 1–10, 13h15 |
| FIPE bootstrap | Dias 11–31, 14h30, com reabertura semanal |
| Snapshot diário | 23h10 |
| Monitoramento | 12h15 e 23h30 |

### 1.3 Persistência

Entidades/tabelas presentes ou criadas pelas migrações:

- `revenda`;
- `anuncio`;
- `execucao_coleta`;
- `venda_estimada` — nome legado que exige cautela semântica;
- `fipe_modelo` e `fipe_preco`;
- `anuncio_snapshot`, `mudanca_preco` e `consolidacao_mensal`;
- `anuncio_evento`, criado por migração Python e consumido condicionalmente;
- `usuario`;
- `meu_estoque` e `meu_estoque_importacao`;
- `anuncio_curadoria_log` e `anuncio_fipe_sugestao`.

O esquema atual cobre identidade de anúncio, estado observado, preço, detalhe, vínculo FIPE, snapshots, eventos e estoque próprio. Não há entidade persistida equivalente a `ComparableGroup`, `AlertRule`, `AlertEvent`, `SavedView`, `Source` ou `AuditLog` administrativo conforme o mapa funcional.

### 1.4 API

A API é PHP procedural sobre `mysqli`, com regras reutilizáveis em `oper-radar-api/lib`. Todas as APIs de dados exigem sessão; `auth.php` é a única porta pública. Há cookie `HttpOnly`, `SameSite=Lax`, expiração por inatividade, regeneração de sessão e CSRF nos fluxos de alteração que usam `apiPost`.

O campo de papel existe (`admin`, `gestor`, `visualizador`/outros), mas não há um serviço central de autorização por permissão. A curadoria de anúncio restringe edição a `admin` e `gestor`; a maioria dos endpoints apenas exige autenticação.

### 1.5 Frontend

- React 18.3 + Vite 8.
- Dependência visual externa: `lucide-react`.
- Sem React Router ou outra camada de rotas.
- Estado de navegação mantido em `useState('hoje')`.
- Preferências e ações locais salvas em `localStorage`.
- Dados carregados por `useApi`, `fetch` e `apiPost` definidos no próprio `App.jsx`.
- Layout responsivo por grids `auto-fit` e breakpoint único em 760 px.
- Temas `radar`, `dark`, `white` e automático; default atual escuro.
- Tipografia atual: Space Grotesk, Inter e JetBrains Mono, carregadas pelo Google Fonts.

O frontend possui 3.079 linhas em `app/src/App.jsx` e 3.088 linhas JSX no total. O arquivo reúne shell, páginas, drawers, componentes, chamadas de API, filtros e estado. Isso torna qualquer redesign amplo arriscado sem decomposição prévia.

### 1.6 Deploy e configuração

O ambiente documentado é HostGator/cPanel, PHP 8.3, Python 3.9 e MySQL 5.7. A publicação do bundle React e dos PHPs é manual e pode divergir do commit do repositório. O Vite usa `base: './'`, compatível com publicação em subdiretório, mas a introdução das rotas profundas planejadas exigirá estratégia explícita de fallback no servidor.

## 2. Rotas, telas, componentes, APIs e filtros existentes

### 2.1 Rotas reais

**Não existem rotas de aplicação.** Há apenas uma SPA, e a tela ativa não aparece na URL. Atualizar o navegador, compartilhar um link ou usar o botão Voltar não preserva a página, os filtros, o drawer ou a posição.

Páginas internas atuais:

| ID interno | Rótulo atual | Componente | Persistência na URL |
|---|---|---|---|
| `hoje` | Hoje | `PageHoje` | Não |
| `mercado` | Mercado | `PageMercado` | Não |
| `comparador` | Comparador | `PageComparador` | Não |
| `minha-loja` | Minha Loja | `PageMinhaLoja` | Não |
| `fipe` | FIPE | `PageFipe` / `PageFipeCatalogo` | Não |
| `oportunidades` | Oportunidades | `PageOportunidades` | Não |
| `concorrentes` | Concorrentes | `PageConcorrentes` | Não |
| `analise` | Análise | `PageAnalise` | Não |
| `acoes` | Ações | `PageAcoes` | Não |
| `ajustes` | Configurações | `PageConfiguracoes` | Não |
| `conta` | Minha conta | `PageConta` | Não |

O menu atual é mais longo que o menu oficial planejado. FIPE, Comparador, Oportunidades, Análise e Ações são áreas principais hoje, enquanto o Plano Mestre prevê apenas Visão estratégica, Mercado, Concorrência, Minha Loja e Configurações, com Radar IA global e Alertas pelo sino.

### 2.2 Componentes reutilizáveis atuais

| Componente/função | Uso atual | Avaliação |
|---|---|---|
| `Card` | Superfícies e cartões clicáveis | Reutilizável após revisão semântica. |
| `Kpi` | Indicadores numéricos | Reutilizável com metadados de fonte/amostra/confiança. |
| `SectionTitle` | Título e subtítulo de seção | Reutilizável. |
| `Tag` | Status e classificação | Reutilizável com novo dicionário semântico de cores. |
| `EmptyState` | Vazio/carregamento/erro simples | Refatorar para o contrato universal de estados. |
| `SeletorGeografico` | Região e UF | Reutilizável como lógica, não como contrato global completo. |
| `PainelAnuncio` | Drawer de detalhe e curadoria | Reutilizável como origem funcional da Tela 7. |
| `PainelLojista` | Drawer de perfil/histórico | Reutilizável como origem funcional da Tela 9. |
| `PainelMeuVeiculo` | Drawer de cadastro e análise | Reutilizável como origem funcional da Tela 12. |
| `ComparativoAnuncio` | FIPE e mediana de mercado | Reutilizável com revisão de grupo comparável. |
| `DashboardLayoutEditor` | Personalização de Hoje | Reaproveitável em preferências; não substitui Configurações planejadas. |
| `marketTaxonomy.js` / `market_taxonomy.php` | Separação de segmentos | Reutilizável e deve continuar compartilhada. |
| `domainRules.js` | Emissão, tração e estoque | Reutilizável. |

### 2.3 APIs existentes

| Endpoint | Método | Função e filtros principais |
|---|---|---|
| `auth.php` | GET/POST | Sessão, login, logout, perfil e senha. |
| `kpis.php` | GET | Revendas, ativos totais/revalidados/herdados, ciclo, movimento 48h, saídas, FIPE e cobertura. Sem filtros. |
| `hoje_stats.php` | GET | Top modelos, cidades com saídas, lojas com entradas/saídas. Sem filtros e com agrupamento simplificado. |
| `anuncios.php` | GET | `limit`, `offset`, `mercado`, `categoria`, `status`, `regiao`, `uf`, `cidade`, `revenda`, `revenda_id`, `tipo`, `marca`, `carroceria`, `tracao`, `preco_min`, `preco_max`, `fipe_confianca`, `fipe_fila`, `abaixo_fipe`, `q`, `ordem`. |
| `anuncio_detalhe.php` | GET/POST | Detalhe por `id`; curadoria FIPE/KM/observação; restauração automática. |
| `facetas.php` | GET | `status`, `mercado`, `categoria`; retorna região, UF, cidade, revenda, tipos, marcas, carrocerias e trações. |
| `comparador.php` | GET | Facetas ou dois recortes: `a/b_modo`, `a/b_marca`, `a/b_modelo`, `a/b_ano`. Apenas caminhões. |
| `lojistas.php` | GET | Lista/ranking por `regiao` ou `uf`. |
| `lojista_detalhe.php` | GET | Perfil por `id` e `categoria`. |
| `eventos.php` | GET | Eventos por `anuncio_id` ou janela `dias`. |
| `insights.php` | GET | Agregações de tipo, marca, cidade, movimento, preço e FIPE. Sem contexto global. |
| `analista_status.php` | GET | Informa se a integração IA está ativa. |
| `analista.php` | POST | Envia até 12 mensagens e um resumo agregado do banco à Anthropic. |
| `fipe_consulta.php` | GET | `modo`, `marca`, `modelo_id`, `ano`, `q`, `ordem`, `limit`, `offset`. |
| `fipe_status.php` | GET | Progresso do catálogo/matching FIPE. |
| `placa_consulta.php` | GET | Status da integração ou consulta por `placa`. |
| `minha_loja.php` | GET/POST | Listar, criar, atualizar e excluir itens do usuário. |
| `minha_loja_detalhe.php` | GET | Detalhe por `id`, comparação FIPE/mercado e análise regional. |
| `minha_loja_xml.php` | GET/POST | Histórico, análise e importação de XML; `acao=analisar|importar`. |

As respostas não seguem o envelope planejado `data + meta.context/source/sample/confidence/freshness/request_id + links.evidence`. Cada endpoint define seu próprio formato.

### 2.4 Filtros atuais

#### Mercado

- universo: foco principal ou outros mercados;
- busca textual com debounce;
- região e UF;
- categoria e subtipo;
- status: ativo, em verificação, saída detectada ou histórico;
- cidade e revenda, habilitados após UF;
- preço mínimo e máximo;
- marca, carroceria e tração;
- fila/vínculo FIPE;
- ordenação: amostra aleatória, recente, preço crescente/decrescente e mais tempo observado.

#### Comparador de mercado

- modo independente por lado: marca, modelo ou marca + modelo;
- marca/modelo conforme o modo;
- ano-modelo obrigatório em cada lado.

Não há período, geografia, configuração/tração, condição, carroceria, quilometragem ou seleção de Minha Loja nesse comparador.

#### Concorrentes

- região, UF, categoria, cidade, busca por revenda;
- ordenação por ativos, saídas em 30 dias, saídas totais, idade observada ou histórico.

#### FIPE

- consulta por placa ou catálogo;
- marca, modelo, ano, busca e ordenação.

#### Minha Loja

- busca por marca/modelo/referência;
- status do estoque;
- ordenação por entrada, modelo ou preço;
- importação XML, inclusão manual, comparação FIPE e status do item.

### 2.5 Filtros planejados que ainda não são globais

O mapa exige um estado comum com geografia, período, comparação, segmento, equivalência, base, origem e atualidade dos dados. Hoje cada página cria seu próprio estado; nenhuma seleção é compartilhada entre Mercado, Concorrentes, Minha Loja, Radar IA ou retorno de drawers.

## 3. Recursos que podem ser reaproveitados

### 3.1 Reaproveitamento direto

- Identidade estável de anúncio, revenda e estoque próprio.
- Coleta multi-UF, locks, checkpoints e classificação de falhas.
- Regra de duas ausências e semântica de saída detectada.
- Enriquecimento de detalhe com tração, KM, carroceria, opcionais e descrição.
- Catálogo FIPE local, referência mensal, matching, sugestões e curadoria manual.
- Histórico de preço e snapshots diários.
- Eventos de primeira observação, saída e reaparecimento quando a migração estiver ativa.
- Autenticação por sessão, proteção de credenciais e CSRF nos fluxos de alteração.
- Estoque próprio por usuário e sincronização XML.
- Taxonomia que separa caminhões/implementos dos demais mercados.
- Normalização de tração e regras de emissão.
- Cálculo robusto de preço: rejeição de condições especiais, razão FIPE, IQR, P25, mediana, P75, média, mínimo, máximo e amostra mínima.
- Regras puras de confiança regional e decomposição do índice de oportunidade.
- Facetas geográficas e comerciais existentes.

### 3.2 Reaproveitamento com adaptação de contrato

- `PageMercado` já prova busca server-side, filtros encadeados e carregamento incremental.
- `PainelAnuncio` já contém grande parte dos dados da Tela 7.
- `PageConcorrentes` e `PainelLojista` já formam a base das Telas 8 e 9.
- `PageMinhaLoja` e `PainelMeuVeiculo` já formam a base das Telas 11 e 12.
- `PageAnalise` e `analista.php` são uma primeira base para Radar IA, mas não cumprem evidência/contexto/confiança.
- `PageConfiguracoes` já contém preferências visuais, cobertura e status FIPE.
- `SeletorGeografico` pode originar um filtro global, desde que sua fonte de estado saia das páginas.
- O comparador atual marca/modelo/ano deve ser preservado como ferramenta de mercado, mas não confundido com o comparador de concorrentes da Tela 10.

### 3.3 Testes reaproveitáveis

Os testes atuais cobrem layout de dashboard, regras de domínio, taxonomia de mercado e listas zebradas no frontend; PHP e Python possuem contratos de qualidade, taxonomia, concorrentes, estoque, XML, FIPE, eventos e integração. Eles devem permanecer como regressão durante o redesign.

## 4. Recursos que precisam ser refatorados

### 4.1 Shell, navegação e estado

- Separar shell global, páginas e componentes do `App.jsx` monolítico.
- Transformar os IDs de página em rotas reais.
- Serializar filtros e contexto na URL.
- Implementar breadcrumb, Voltar contextual e restauração de rolagem/lote/item.
- Remover do menu principal os destinos que o Plano Mestre define como aprofundamentos ou ações globais, após decisão explícita sobre seu novo local.
- Tornar Radar IA e Alertas recursos globais, não páginas independentes ou listas locais.

**PROPOSTA técnica:** adotar React Router para as rotas e um store/contexto pequeno e tipado para o estado global. A biblioteca é sugestão; o comportamento é requisito do mapa.

### 4.2 Sistema visual

- O padrão atual é escuro e usa Space Grotesk/Inter/JetBrains Mono; o aprovado é claro, usa Noto Sans, azul-marinho, cinza quente e laranja restrito.
- Consolidar tokens de cor, tipografia, espaçamento 8/13/21/34/55, divisórias e grade de 12 colunas.
- Eliminar estilos inline repetidos para permitir consistência, estados, temas e acessibilidade.
- Reservar verde/vermelho apenas para movimento temporal. Hoje deltas estáticos de FIPE/mercado e saídas usam essas cores em vários pontos.
- Preservar “sem fotos” no frontend. O banco possui `imagem_url`, mas a interface atual já evita usar fotos como navegação.

### 4.3 Componentes e estados

- Evoluir `EmptyState` para diferenciar loading, vazio real, vazio por filtro, erro parcial, erro total, baixa confiança, dado desatualizado, sem permissão e offline.
- Criar componentes de fonte, período, amostra, confiança, freshness e evidência.
- Criar tabelas/gráficos acessíveis e responsivos coerentes com os mockups.
- Refatorar drawers em páginas profundas ou overlays roteáveis conforme o contrato de cada tela.

### 4.4 APIs

- Uniformizar o envelope de resposta.
- Levar o contexto de filtro ao backend, em vez de recalcular parte no cliente.
- Criar agregações por Brasil, região, UF, cidade e grupo equivalente.
- Trocar paginação por offset pela paginação por cursor prevista para listas extensas.
- Fornecer links/IDs de evidência para cada KPI, insight e resposta do Radar IA.
- Centralizar autorização por permissão e não apenas por autenticação/papel em pontos isolados.
- Adicionar `request_id` e tratamento uniforme de erro.

### 4.5 Comparabilidade

O código possui duas noções diferentes:

1. Comparativos de preço por mesmo `fipe_preco_id`;
2. Comparador bilateral por marca/modelo exato e ano-modelo.

O mapa funcional exige um grupo equivalente governado por categoria/tipo, marca/modelo normalizados, configuração/tração, ano/faixa, condição, carroceria/implemento e KM quando confiável. É necessário unificar a regra e registrar a versão/expansão aplicada em cada resultado.

### 4.6 Insights e IA

- `insights.php` usa agregações gerais e, em alguns blocos, média simples.
- `hoje_stats.php` agrupa modelo pelas três primeiras palavras do título.
- `analista.php` envia médias e resumos globais, sem o contexto da tela, grupo equivalente ou lista estruturada de evidências.

Esses pontos precisam ser substituídos por fatos normalizados, recorte explícito, mediana, amostra, confiança e referência aos anúncios sustentadores.

## 5. Recursos que ainda não existem

### 5.1 Exigidos pelo mapa funcional

- URLs e rotas propostas do redesenho.
- Estado global serializável e filtros preservados entre telas.
- Hierarquia analítica Brasil → região → estado → cidade com páginas recalculadas.
- Mapa nacional e leitura geográfica aprovados.
- Página integrada de análise por grupo equivalente.
- Navegador de anúncios com retorno restaurado e paginação por cursor.
- Detalhe de anúncio roteável/deep link.
- Comparador de concorrentes com até quatro participantes e Minha Loja.
- Radar IA como overlay global, sensível ao contexto, com fonte, período, amostra, confiança e evidências.
- Central global de Alertas, sino, regras, status lido/arquivado e preferências.
- Tela Saúde dos dados com cobertura, freshness, falhas, duplicidades e confiança.
- Configurações completas de conta, usuários, fontes, permissões, preferências e metodologia.
- Envelope uniforme de API e links de evidência.
- Telemetria dos fluxos definidos no mapa.
- Estados universais completos.
- WCAG 2.2 AA validada.

### 5.2 Itens explicitamente classificados como PROPOSTA no mapa

- **PROPOSTA:** visualizações salvas.
- **PROPOSTA:** converter uma visualização em alerta.
- **PROPOSTA:** favoritos.
- **PROPOSTA:** exportação governada.
- **PROPOSTA:** resumo agendado.
- **PROPOSTA:** classificação de concorrente direto.
- **PROPOSTA:** inferência de venda provável, sempre separada de saída detectada.
- **PROPOSTA:** anotações internas.
- **PROPOSTA:** comparação entre snapshots.
- **PROPOSTA:** abrir Radar IA por `?radar=open`.

Esses itens não devem entrar silenciosamente na primeira implementação. Precisam de decisão e aceite próprios.

## 6. Matriz — tela planejada × situação atual × arquivos envolvidos

Legenda: **Forte parcial** = há fluxo e dados reaproveitáveis, mas não o contrato completo; **Parcial** = há fragmentos; **Ausente** = não existe como tela/fluxo planejado.

| # | Tela planejada e status visual | Situação atual | Evidência atual e principal lacuna | Arquivos envolvidos |
|---:|---|---|---|---|
| 1 | Visão estratégica — **APROVADA** | **Parcial** | `PageHoje` possui KPIs, movimento e personalização, mas não filtros globais, curva temporal aprovada, prioridades com fonte/confiança/evidência nem base SVD fixa. | `app/src/App.jsx`, `dashboardLayout.js`, `kpis.php`, `hoje_stats.php`, `insights.php` |
| 2 | Mercado nacional — **APROVADA** | **Parcial baixo** | Mercado atual é navegador de cards. Não há mapa Brasil, ranking de estados, tabela de modelos equivalentes, mediana por região ou série do modelo selecionado. | `App.jsx`, `marketTaxonomy.js`, `facetas.php`, `anuncios.php`, `insights.php` |
| 3 | Mercado por estado — **APROVADA** | **Parcial baixo** | UF funciona como filtro, não como página com breadcrumb, KPIs recalculados, ranking de cidades, faixa estadual, lojistas do mercado e base SVD externa. | `App.jsx`, `facetas.php`, `anuncios.php`, `lojistas.php` |
| 4 | Mercado por cidade — mockup pendente | **Ausente como tela** | Cidade filtra anúncios/lojistas, mas não existe drill-down com KPIs, concorrência, modelos e contexto herdado. | `App.jsx`, `facetas.php`, `anuncios.php`, `lojistas.php`; novas agregações necessárias |
| 5 | Análise integrada de modelo — mockup pendente | **Ausente como tela; dados parciais** | Há comparação bilateral e mediana por FIPE, mas não uma leitura longitudinal/geográfica do grupo equivalente selecionado. | `comparador.php`, `lib/market_comparator.php`, `lib/market_quality.php`, `minha_loja_detalhe.php`, `App.jsx` |
| 6 | Navegador de anúncios — mockup pendente | **Forte parcial** | Busca server-side, filtros, total e rolagem automática existem. Faltam contexto global, ano/condição explícitos, botão “carregar mais”, cursor, URL e restauração de posição. | `App.jsx` (`PageMercado`), `anuncios.php`, `facetas.php` |
| 7 | Detalhe do anúncio — mockup pendente | **Forte parcial** | Drawer mostra especificações, FIPE, mercado, histórico, lojista e curadoria. Falta rota, linha do tempo consolidada, evidência do cálculo, retorno restaurado e foco modal completo. | `App.jsx` (`PainelAnuncio`), `anuncio_detalhe.php`, `eventos.php` |
| 8 | Concorrência — visão geral — mockup pendente | **Parcial** | Há ranking filtrável de lojistas e movimentos observados, mas não KPIs de período, seleção múltipla, gráfico temporal por modelo e comparação governada. | `App.jsx` (`PageConcorrentes`), `lojistas.php`, `facetas.php` |
| 9 | Perfil do concorrente — mockup pendente | **Forte parcial** | Drawer possui estoque, saídas, preço, cobertura, confiança e reaparecimento. Faltam rota, mix equivalente consolidado, série de entradas/saídas e comparação direta com SVD. | `PainelLojista`, `lojista_detalhe.php`, `lib/competitor_history.php` |
| 10 | Comparador de concorrentes — mockup pendente | **Ausente** | O comparador atual confronta dois recortes de mercado, não até quatro lojistas + Minha Loja em modelos comuns. | `PageComparador`, `comparador.php`, `lib/market_comparator.php`; novo contrato necessário |
| 11 | Minha Loja — visão geral — mockup pendente | **Forte parcial** | Estoque, KPIs, FIPE, mediana, XML e filtros existem. Faltam agrupamento equivalente consolidado, alcance geográfico, base SVD global e leitura visual aprovada. | `PageMinhaLoja`, `minha_loja.php`, `lib/market_quality.php`, `lib/xml_estoque.php` |
| 12 | Minha Loja — modelo/item — mockup pendente | **Forte parcial** | Drawer possui edição, FIPE, análise regional e confiança. Faltam rota, distribuição de preço, recortes Brasil/região/UF uniformes e evidência navegável. | `PainelMeuVeiculo`, `minha_loja_detalhe.php`, `lib/store_market.php`, `lib/regional_insight.php` |
| 13 | Radar IA — mockup pendente | **Parcial** | Há página de Análise com chat opcional. Não é global, não herda o contexto da tela e retorna texto sem metadados/evidências estruturados. | `PageAnalise`, `analista.php`, `analista_status.php`, `insights.php` |
| 14 | Alertas estratégicos — mockup corrigido pendente | **Ausente** | “Ações” é uma lista local no navegador e “Oportunidades” é uma consulta pontual; não há regra, evento, sino global, prioridade, lido/arquivado ou notificação. | `PageAcoes`, `PageOportunidades`, `localStorage`; banco/API novos necessários |
| 15 | Saúde dos dados — mockup pendente | **Parcial baixo** | Configurações mostra cobertura e FIPE; monitor CLI verifica alguns sinais. Não há tela dedicada, falhas por UF/fonte, duplicidades, confidence distribution ou API de saúde. | `PageConfiguracoes`, `fipe_status.php`, `facetas.php`, `monitoramento/verificar_saude.py` |
| 16 | Configurações e conta — mockup pendente | **Parcial** | Conta, senha, temas, densidade, movimento e layout existem. Faltam usuários, fontes, permissões granulares, alertas, metodologia, governança e persistência no servidor. | `PageConfiguracoes`, `PageConta`, `theme.js`, `dashboardLayout.js`, `auth.php`, tabela `usuario` |

### Rotas planejadas sem equivalente atual

```text
/visao-estrategica
/mercado
/mercado/{regiao}/{uf}
/mercado/{regiao}/{uf}/{cidade}
/mercado/modelos/{grupo_equivalente}
/mercado/anuncios
/mercado/anuncios/{anuncio_id}
/concorrencia
/concorrencia/lojistas/{lojista_id}
/concorrencia/comparador?participantes={ids}
/minha-loja
/minha-loja/itens/{item_id}
/alertas
/configuracoes/saude-dados
/configuracoes/conta?aba={aba}
```

## 7. Lacunas de desktop, mobile e acessibilidade

### 7.1 Desktop

- As referências aprovadas usam shell claro, sidebar curta, filtros globais em linha, Base SVD fixa, grade de 12 colunas e alta densidade analítica. O produto atual inicia em tema escuro, usa menu longo e cards independentes.
- Não há alinhamento contínuo entre filtros, KPIs, tabelas e gráficos conforme o sistema de 12 colunas.
- As telas atuais usam muitos estilos inline e `auto-fit`; isso é responsivo, mas dificulta controlar a composição exata aprovada.
- Mapa Brasil, séries temporais, tabelas comparáveis e faixas/distribuições dos mockups não existem como componentes.
- Os mockups 4–16 são referências de intenção, não telas aprovadas. Não devem ser copiados como decisão final sem passar pelo gate de aprovação.
- Há diferenças de governança visual: verde/vermelho é usado hoje em deltas estáticos; o plano reserva essas cores a movimento temporal.
- A tipografia e a paleta default não correspondem ao aprovado.

### 7.2 Mobile e tablet

Pontos positivos atuais:

- breakpoint em 760 px;
- navegação inferior;
- controles com altura mínima de 44 px no mobile;
- grids que colapsam para uma coluna;
- menu “Mais” para destinos secundários.

Lacunas:

- O mapa define quatro faixas de breakpoint; o código trata essencialmente desktop versus `<=760px`.
- Não há desenho mobile aprovado das 16 telas.
- Filtros complexos, tabelas e comparadores não têm estratégia explícita de resumo, colunas prioritárias ou expansão progressiva.
- Breadcrumb/contexto e retorno não existem; no mobile isso torna drill-down especialmente frágil.
- Drawers de 720/760 px viram tela cheia, mas não há cabeçalho móvel, foco inicial, gesto/ação de retorno ou preservação de posição.
- A navegação móvel mantém Hoje, Mercado, Minha Loja e Oportunidades como destinos principais, diferente da arquitetura oficial.
- Não há validação documentada de reflow em 320 px, orientação paisagem, teclado virtual ou safe areas além da barra inferior.

### 7.3 Acessibilidade

Pontos positivos atuais:

- `lang="pt-BR"`;
- foco visível global;
- suporte a `prefers-reduced-motion` e preferência manual;
- vários `aria-label`, `aria-expanded`, `aria-pressed`, `role=alert`, `role=status` e `aria-modal`;
- cards clicáveis aceitam Enter e Espaço;
- controles nativos para campos e seleções.

Lacunas e riscos:

- Não há teste automatizado com axe, leitor de tela ou navegação completa por teclado.
- Drawers não fazem trap de foco, não movem foco ao abrir e não restauram foco ao fechar.
- Tabs usam `role=tab`, mas não há associação completa com `tabpanel`, `aria-controls` e roving tabindex.
- Navegação não informa `aria-current`.
- Não há link “pular para o conteúdo”.
- Cards com `role=button` podem conter links, selects ou botões internos, gerando interação aninhada e ordem de foco confusa.
- Estados de carregamento geralmente são texto visual, sem região viva uniforme.
- Gráficos de barras construídos com `div` não têm equivalente tabular/descrição programática completa.
- A cor participa de várias leituras; os rótulos ajudam em parte, mas a conformidade de contraste não foi medida.
- Google Fonts é dependência externa; falha de rede pode alterar métricas e legibilidade.
- Os mockups têm tabelas densas e textos pequenos. A validação WCAG 2.2 AA precisa ocorrer no código renderizado, não apenas na imagem.

## 8. Riscos técnicos e inconsistências de dados

| Prioridade | Risco/inconsistência | Impacto | Evidência |
|---|---|---|---|
| Crítica | Raiz do projeto e `main` divergem | Implementar na árvore errada, perder correções ou criar merge complexo. | Raiz em `agent/separa-familias-daf` suja; `main` limpo em `.worktrees/baseline-operacional`. |
| Crítica | Commit, frontend e PHP publicados podem divergir | Não é possível reproduzir produção apenas pelo Git. | `docs/PRODUCAO.md` registra cópia manual e hashes ainda não sistemáticos. |
| Crítica | “Grupo equivalente” não tem entidade/versão única | KPIs e recomendações podem comparar conjuntos diferentes entre telas. | FIPE ID em `market_quality.php`; marca/modelo/ano em `comparador.php`; regras mais amplas apenas na especificação. |
| Alta | Falta de rotas e estado global | Quebra os fluxos, deep links, Voltar e restauração exigidos. | `useState('hoje')` e ausência de router. |
| Alta | APIs sem contexto/evidência uniforme | Radar IA e insights não conseguem provar cada leitura de forma consistente. | Respostas ad hoc, sem `request_id`, `freshness` e `links.evidence`. |
| Alta | Contagem “ativa” mistura total, revalidado e herdado | O número pode parecer atual mesmo quando parte do estoque não foi revalidada no ciclo. | `kpis.php` expõe três campos; outras APIs usam `status='ativo'` sem a mesma distinção. |
| Alta | Agregações atuais misturam segmentos | Visão estratégica e insights podem combinar caminhões com outros mercados, contrariando o foco principal. | `hoje_stats.php` e `insights.php` não recebem `mercado=principal`. |
| Alta | Modelo agrupado pelas três primeiras palavras | DAF/Volvo/Scania podem ser agrupados de modo inconsistente com a normalização FIPE. | `SUBSTRING_INDEX(titulo, ' ', 3)` em `hoje_stats.php`. |
| Alta | IA usa médias e contexto global não versionado | Pode produzir recomendação incompatível com o recorte da tela e sem evidência. | `analista.php` consulta `AVG(preco)` e devolve apenas `{resposta}`. |
| Alta | Histórico de eventos é opcional em runtime | Perfis e análises mudam de semântica conforme a migração exista ou não. | `lojista_detalhe.php` degrada para status atual quando `anuncio_evento` não existe. |
| Alta | Alertas e ações atuais são apenas locais | Perda ao trocar navegador/dispositivo; sem auditoria, permissão ou sincronização. | `oper-radar-acoes` em `localStorage`. |
| Alta | RBAC incompleto | Usuários autenticados podem ver recursos sem separação planejada por papel. | `config.php` exige sessão; poucas ações validam papel. |
| Alta | Paginação por offset com ordem aleatória diária | Inserções/remoções e mudança de dia podem repetir ou pular resultados durante rolagem. | `anuncios.php` usa `limit/offset`; ordem aleatória estável apenas por dia. |
| Alta | Coleta nacional sequencial | Uma UF lenta pode prolongar o ciclo; 26 UFs × timeout de 90 min não cabe em uma janela degradada. | `coleta_multi_uf.py` processa UFs uma a uma. |
| Média | Monitoramento não cobre detalhe, IA, API ou filas de alerta | Falha parcial pode não aparecer no status consolidado. | `verificar_saude.py` cobre coleta principal, ativo, snapshot e FIPE. |
| Média | Throughput do detalhe depende do portal | Backfill pode crescer com falhas, bloqueios ou aumento de anúncios. | Lote 80/30 min, pausa 4 s, aborta após erros seguidos. |
| Média | Séries atuais são diárias/mensais | Períodos personalizados e comparações equivalentes podem exigir novas agregações e custo de consulta. | `anuncio_snapshot`, `consolidacao_mensal`; sem API analítica temporal completa. |
| Média | Migrações heterogêneas | Reexecução e compatibilidade com MySQL 5.7 não são uniformes. | Há SQL não idempotente e `ADD COLUMN IF NOT EXISTS` em migrações. |
| Média | Status planejados e atuais divergem | Traduções podem gerar contagem errada ou rótulo indevido. | Banco: `ativo`, `removido_candidato`, `removido_confirmado`; mapa: `ATIVO`, `SAIDA_DETECTADA`, `VENDA_PROVAVEL`, `STALE`, `DUPLICADO`, `INVALIDO`. |
| Média | Duplicidade não é entidade/estado operacional | A Tela 15 não pode explicar duplicidades e merges. | Mockup prevê; banco atual não tem fluxo de duplicidade governado. |
| Média | Preferências só no navegador | Não acompanham o usuário e não podem ser auditadas. | `localStorage` em `theme.js` e `App.jsx`. |
| Média | Dados pessoais e placa | Exigem política de acesso, retenção e LGPD antes de ampliar usuários/exportações. | `meu_estoque.placa`, perfis e telefones. |
| Média | Visual aprovado versus temas atuais | Manter todos os temas pode aumentar muito o custo de QA e gerar inconsistência de marca. | Sistema atual possui quatro modos; referência aprovada é clara. |

### Inconsistências documentais

- O Plano Mestre é de 29/08/2026 e declara Tela 4 “em andamento”; o Mapa Funcional v1.0 é de 31/08/2026 e já especifica as 16 telas, mas mantém aprovação formal apenas para 1–3.
- `README.md` afirma consultar `CLAUDE.md`, mas o arquivo está não rastreado na raiz e não existe no `main` auditado.
- `docs/ESTADO_ATUAL.md` está explicitamente arquivado e não deve ser usado como fonte operacional.
- A documentação de produção registra frontend/API publicados em commit anterior ao `main` usado nesta auditoria; sem inspeção autenticada não se deve presumir que produção contém o commit `1e9b7a1`.

## 9. Dependências entre as telas

### 9.1 Dependências funcionais

```text
Shell global + contexto + filtros + comparáveis + evidência
        │
        ├── Tela 1 Visão estratégica
        ├── Tela 2 Mercado nacional
        │      └── Tela 3 Estado
        │             └── Tela 4 Cidade
        │                    ├── Tela 5 Modelo
        │                    │      └── Tela 6 Anúncios ──> Tela 7 Detalhe
        │                    └── Tela 8 Concorrência
        │                           ├── Tela 9 Perfil
        │                           └── Tela 10 Comparador
        │
        ├── Tela 11 Minha Loja ──> Tela 12 Item/modelo
        ├── Tela 13 Radar IA consome contexto/evidência das demais
        ├── Tela 14 Alertas abre telas 4–12 no recorte correto
        └── Telas 15–16 governam saúde, fontes, papéis e preferências
```

### 9.2 Dependências por tela

| Tela | Depende de |
|---|---|
| 1 | Contexto global, períodos, eventos, comparáveis, confiança, evidência e Minha Loja. |
| 2 | Agregações nacionais, geografia, grupos equivalentes e séries. |
| 3 | Tela 2, filtro estadual, ranking de cidades, lojistas e referência SVD. |
| 4 | Tela 3 e a mesma API analítica recalculada por cidade. |
| 5 | Grupo equivalente versionado, período, geografia, séries e Minha Loja. |
| 6 | Contexto originado nas Telas 2–5, cursor e restauração de posição. |
| 7 | Tela 6, detalhe enriquecido, preço/histórico, lojista e evidência. |
| 8 | Contexto geográfico/temporal, eventos e métricas por lojista. |
| 9 | Tela 8, estoque do lojista, eventos, qualidade e comparáveis. |
| 10 | Telas 8–9, seleção persistida, modelos em comum e Minha Loja. |
| 11 | Estoque próprio, FIPE, grupo equivalente, geografia e confiança. |
| 12 | Tela 11, comparáveis regionais, distribuição de preço e evidências. |
| 13 | Envelope uniforme, contexto da tela, autorização e links de evidência. |
| 14 | Eventos normalizados, regras persistidas, preferências e deep links. |
| 15 | Métricas de coleta/fonte/UF, duplicidade, freshness, filas e permissões. |
| 16 | Usuários, RBAC, fontes, preferências, metodologia e auditoria. |

## 10. Ordem recomendada de implementação

1. **Sanear baseline e decisões bloqueadoras.** Escolher a árvore Git oficial, registrar a versão de produção e responder às perguntas da seção 12.
2. **Fundação transversal.** Rotas, shell, tokens visuais, contexto global, envelope de API, estados universais, autorização e contrato de comparáveis.
3. **Reimplementar as três telas aprovadas.** Visão estratégica, Mercado nacional e Mercado por estado, conectadas a dados reais.
4. **Tela 4 — Mercado por cidade.** É o próximo marco formal do Plano Mestre e prova a hierarquia e a preservação de contexto.
5. **Fluxo de evidência do Mercado.** Telas 5, 6 e 7: modelo, navegador e detalhe.
6. **Concorrência.** Telas 8, 9 e 10.
7. **Minha Loja.** Telas 11 e 12, usando o mesmo grupo equivalente do Mercado.
8. **Radar IA e Alertas.** Telas 13 e 14 somente depois que contexto/evidência forem confiáveis.
9. **Administração e saúde.** Telas 15 e 16, com RBAC, fontes e auditoria.
10. **Hardening.** Mobile, WCAG 2.2 AA, performance, telemetria, segurança, E2E e rollout.

Essa ordem preserva a sequência do mapa e evita construir Radar IA/Alertas sobre contratos ainda instáveis.

## 11. Plano detalhado por fases

### Fase 0 — Baseline, governança e contratos

Objetivos:

- definir branch/worktree oficial;
- registrar commit e hashes atualmente publicados;
- confirmar quais mockups estão aprovados;
- fechar decisões de produto da seção 12;
- congelar dicionário de métricas, status e filtros.

Entregáveis:

- matriz de requisitos aprovada;
- catálogo de dados e origem por KPI;
- contrato do grupo equivalente;
- contrato de status e freshness;
- plano de migração/rollback.

Gate: nenhuma alteração de tela começa sem baseline Git limpo e decisões bloqueadoras registradas.

### Fase 1 — Fundação de frontend e API

Frontend:

- shell oficial curto;
- rotas e deep links;
- contexto global serializado na URL;
- breadcrumb, Voltar e restauração de rolagem;
- tokens Noto Sans, paleta, espaçamento e grid;
- componentes de estados, fonte, amostra, confiança e evidência.

Backend:

- envelope uniforme;
- `request_id`;
- autorização central;
- contrato de período/comparação;
- API/serviço do grupo equivalente;
- paginação por cursor.

**PROPOSTA técnica:** introduzir uma camada de consulta/cache no frontend para cancelar solicitações, deduplicar chamadas e controlar stale data. A ferramenta concreta deve ser escolhida após confirmar as restrições do bundle/HostGator.

Gate: uma rota demonstrativa precisa sobreviver a refresh, compartilhamento, Voltar e mudança desktop/mobile mantendo contexto.

### Fase 2 — Telas aprovadas 1–3

- Tela 1 com KPIs, pulso temporal, movimentos e prioridades; cada insight abre sua evidência.
- Tela 2 com mapa, ranking, grupos equivalentes e recorte regional.
- Tela 3 com breadcrumb, cidades, modelos, faixa estadual, SVD externa e lojistas.
- Restringir o recorte inicial ao foco de caminhões/implementos conforme decisão de produto.
- Validar semântica de cor e dados demonstrativos versus reais.

Gate por tela: loading, vazio, erro, baixa confiança, stale, mobile, teclado, fonte e aprovação explícita.

### Fase 3 — Tela 4 e hierarquia geográfica

- Implementar `/mercado/{regiao}/{uf}/{cidade}`.
- Recalcular KPIs, modelos, concorrentes e anúncios para a cidade.
- Preservar período, comparação, segmento e grupo selecionado.
- Testar Voltar ao estado com posição e seleção intactas.

Gate: fluxo Brasil → estado → cidade → Voltar sem perda de contexto.

### Fase 4 — Telas 5–7 e cadeia de evidência

- Tela 5: análise do grupo equivalente em regiões/UFs/lojistas e ao longo do período.
- Tela 6: busca e filtros no recorte, cursor, rolagem híbrida e botão “carregar mais”.
- Tela 7: detalhe roteável, especificações, preço, linha do tempo, lojista e participação no cálculo.
- Ligar todo KPI/agregado aos anúncios sustentadores.

Gate: modelo → anúncios → detalhe → Voltar restaura lote e rolagem.

### Fase 5 — Telas 8–10 de Concorrência

- Visão geral com ranking, entradas, saídas e movimento temporal.
- Perfil por lojista com mix equivalente, estoque e histórico.
- Comparador de até quatro participantes, incluindo SVD, apenas nos modelos comuns.
- Definir comportamento quando não houver modelo comum.

Gate: seleção persistida, amostra/confiança visível e nenhuma saída tratada como venda.

### Fase 6 — Telas 11–12 de Minha Loja

- Consolidar estoque SVD por grupo equivalente.
- Mostrar posição de preço e alcance geográfico.
- Reaproveitar cadastro/XML/curadoria existentes.
- Transformar o drawer atual em detalhe roteável sem perder a edição.
- Manter FIPE separada da mediana de mercado.

Gate: um mesmo item apresenta resultados coerentes em Visão geral, detalhe e Mercado.

### Fase 7 — Telas 13–14, Radar IA e Alertas

Radar IA:

- overlay global;
- contexto da tela e filtros;
- resposta estruturada com fonte, período, amostra, confiança e evidências;
- recusa explícita quando os dados forem insuficientes.

Alertas:

- regras persistidas;
- eventos, prioridade e estado novo/lido/arquivado;
- sino global;
- deep link para o recorte originador;
- preferências e frequência.

Gate: toda resposta/alerta abre evidências e reproduz o mesmo recorte.

### Fase 8 — Telas 15–16, saúde e administração

- Saúde por fonte/UF/ciclo, atraso, sucesso, fila de detalhe/FIPE, snapshots, duplicidade e confiança.
- Conta, usuários, fontes, permissões, preferências e metodologia.
- Auditoria de alterações administrativas e curadoria.
- Política de retenção, placa, telefone e exportações.

Gate: cada papel vê apenas ações autorizadas; falhas de coleta e dados stale aparecem antes de influenciar decisão comercial.

### Fase 9 — Qualidade, performance e rollout

- E2E dos fluxos críticos;
- acessibilidade WCAG 2.2 AA;
- reflow em 320 px e breakpoints definidos;
- orçamento de LCP, INP, CLS e API p95;
- telemetria definida no mapa;
- teste com volume nacional;
- deploy por versão, hashes e rollback.

**PROPOSTA:** usar feature flags para liberar áreas por fase e permitir comparação controlada com o frontend atual.

Gate: checklist funcional, visual, dados, segurança e rollback assinado antes de substituir a interface vigente.

## 12. Perguntas que precisam ser respondidas antes de alterar o código

### Bloqueadoras de repositório e publicação

1. O redesign deve partir do `main` em `.worktrees/baseline-operacional` ou a branch suja da raiz contém mudanças que precisam ser preservadas/mescladas primeiro?
2. Qual commit, bundle e conjunto de PHPs estão efetivamente publicados hoje?
3. A implementação será feita em uma nova branch limpa a partir de `main`?
4. Qual estratégia de fallback de rotas será permitida no `.htaccess` do HostGator?

### Bloqueadoras de escopo visual e navegação

5. Confirma-se que apenas as Telas 1, 2 e 3 anexadas ao Plano Mestre estão aprovadas e que 4–16 precisam de aprovação individual?
6. A próxima entrega obrigatória continua sendo a Tela 4 — Mercado por cidade?
7. O tema claro aprovado substituirá o tema Radar escuro como padrão? Os demais temas continuarão suportados?
8. A tipografia Noto Sans é obrigatória em todo o produto, inclusive números/tabelas, ou haverá uma fonte monoespaçada auxiliar?
9. O que acontece com as áreas atuais FIPE, Comparador, Oportunidades, Análise e Ações: serão removidas do menu, incorporadas em subfluxos ou mantidas temporariamente?
10. A Tela 6 será tabela no desktop e cards no mobile, ou a tabela deve reflowar nos dois?

### Bloqueadoras de dados e comparação

11. Qual é a definição final e versionada de grupo equivalente para caminhões e para implementos?
12. A tração/configuração é obrigatória ou pode ser ampliada quando a amostra for baixa? Quem autoriza a ampliação?
13. Qual faixa de anos é permitida e como deve ser indicada ao usuário?
14. Condição e quilometragem já possuem cobertura suficiente para participar do cálculo? Qual o limiar?
15. A mediana principal será nacional, do recorte geográfico ou ambas, e qual prevalece em cada tela?
16. Quais limiares finais definem confiança alta, média, baixa e insuficiente?
17. O score de confiança proposto no mapa será adotado ou permanecerão as regras atuais por quantidade/cobertura?
18. “Todo o período” começa em qual data confiável por UF e fonte?
19. Há cobertura contínua suficiente para 60/90/120 dias e 1 ano em todas as regiões?
20. Como lidar com uma UF `sem_revendas`: cobertura zero válida ou fonte sem cobertura?
21. Duplicidades serão apenas sinalizadas, excluídas dos cálculos ou mescladas? Qual registro será canônico?
22. A base fixa é um único estoque “SVD Seminovos” compartilhado ou o estoque do usuário autenticado?

### Bloqueadoras de concorrência, alertas e IA

23. Como será definida a classificação “concorrente direto”?
24. No comparador, o que exibir quando os participantes não tiverem modelos equivalentes em comum?
25. A ferramenta atual de comparação marca/modelo/ano deve permanecer como aprofundamento de Mercado?
26. Quais tipos de alerta entram no primeiro release e quais canais serão usados: somente central, e-mail, WhatsApp ou outro?
27. Quais regras de prioridade e frequência evitam alertas excessivos?
28. O Radar IA continuará com Anthropic ou a integração será reavaliada?
29. Qual nível mínimo de confiança permite que o Radar IA produza recomendação, em vez de apenas descrever dados?
30. Por quanto tempo perguntas/respostas e evidências do Radar IA serão retidas?

### Bloqueadoras de usuários, segurança e governança

31. Quais ações exatas pertencem a Gestor, Analista, Comercial e Admin?
32. Quem pode ver placa, telefone, observações de curadoria e estoque próprio?
33. Quem pode exportar e em quais formatos?
34. Quais fontes além de `caminhoesecarretas.com.br` são reais, contratadas ou apenas demonstrativas?
35. Qual política de retenção e auditoria será adotada para eventos, logs, importações e dados pessoais?
36. Preferências e layouts devem ser por usuário no servidor ou podem continuar locais no navegador?

### Bloqueadoras de operação e qualidade

37. Qual SLA de freshness será mostrado ao usuário por fonte/UF?
38. Qual volume e duração máximos aceitáveis para uma coleta nacional completa?
39. O monitoramento precisa alertar fila de detalhes, falha de parser, bloqueio do portal, API, IA e atraso por UF?
40. A materialização de `anuncio_evento` está ativa em produção e desde qual data confiável?
41. Qual é o orçamento de performance realista no HostGator para mapas, séries e tabelas nacionais?
42. Quais navegadores, aparelhos e leitores de tela compõem a matriz de suporte?

## Conclusão

O projeto atual não deve ser descartado: ele já resolve as partes mais caras de coleta, identidade, histórico, FIPE, qualidade, autenticação e estoque próprio. A estratégia correta é preservar essa fundação e substituir progressivamente a arquitetura de navegação, os contratos analíticos e a camada visual.

O primeiro passo antes de código é resolver o baseline Git e as decisões bloqueadoras. Em seguida, a fundação transversal deve ser construída antes das telas; caso contrário, cada página repetirá filtros, regras de comparação e estados diferentes, perpetuando exatamente as inconsistências que o mapa funcional tenta eliminar.

---

### Evidências principais consultadas

- `Atualização/Mapa-Funcional-OPER-RADAR-v1.0.docx`;
- `Atualização/Plano-mestre-redesign-Oper-Radar.docx`;
- `Atualização/OPER-RADAR-Mockups-Telas-01-a-16-FINAL.zip`;
- `.worktrees/baseline-operacional/app/src/App.jsx` e módulos do frontend;
- `.worktrees/baseline-operacional/oper-radar-api/`;
- `.worktrees/baseline-operacional/fase1-coleta/`;
- `.worktrees/baseline-operacional/fase2-fipe/`;
- `.worktrees/baseline-operacional/fase3-series/`;
- `.worktrees/baseline-operacional/fase4-acesso/`;
- `.worktrees/baseline-operacional/monitoramento/`;
- `.worktrees/baseline-operacional/docs/PRODUCAO.md`, `TAXONOMIA_MERCADO.md` e `ESPECIFICACAO_INSIGHT_REGIONAL.md`;
- histórico Git até `1e9b7a1`;
- 14 testes JavaScript locais, todos aprovados.
