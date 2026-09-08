# OPER RADAR — continuidade e manual do projeto

> Documento canônico de retomada para agentes e equipe. Ler antes de executar comandos.
> Atualizar ao final de cada bloco importante. Nunca registrar senhas, tokens, cookies ou
> conteúdo de `.oper-radar.env`.

Última atualização: 08/09/2026

> ⚠️ As seções abaixo ("Estado atual" em diante) datam de 01/09/2026 e estão desatualizadas —
> preservadas como histórico, não como estado corrente. Ver "08/09/2026 — retomada do Plano
> Mestre" no Registro de atualizações para o estado real conhecido nesta data e suas
> limitações. Auditoria completa em 07/09, consolidada em 08/09; Plano Mestre de Evolução v1.0
> também de 08/09 — ambos versionados no projeto Claude "OPER RADAR - PROJETO"
> (`oper-radar-auditoria-20260907.md`, `oper-radar-plano-mestre-v1.md`).

## Estado atual

O painel analítico de Mercado está publicado e validado em produção. A tela desktop e o fluxo
funcional foram aprovados. O redesign visual refinado foi auditado, mas ainda não implementado.

- `main` remoto: `1038b4f` (PR #51 mesclado).
- Branch funcional: `redesign-oper-radar-20260831`, commit `e6db6d1`.
- Artefato de deploy: `deploy/redesign-oper-radar-20260901`, commit `fbed7ec`.
- Produção frontend: `/home1/pro93061/agenciaoper.com.br/oper-radar/`.
- Produção API: `/home1/pro93061/agenciaoper.com.br/oper-radar-api/`.
- Worktree de deploy: `/home1/pro93061/agenciaoper.com.br/oper-radar-redesign-painel`.
- O worktree raiz pode conter alterações antigas; não limpar nem resetar sem autorização.

## Objetivo do produto

Transformar o Oper Radar em um aplicativo profissional para consumidor final: simples, legível,
rápido para decidir e com conexão clara entre filtros, indicadores, modelos e ofertas. Números
e processos técnicos devem funcionar internamente, sem dominar a interface.

## Publicação registrada

Em 01/09/2026 foram publicados o build local do Vite e `mercado_painel.php`. O cPanel não possui
Node/npm; o build foi transportado por branch técnica após 33 testes frontend aprovados.

- Backup: `/home1/pro93061/backups/oper-radar-20260901-073526`.
- Bundle: `assets/index-De1rp-Rm.js`.
- Hashes e detalhes: `docs/PRODUCAO.md`.
- Banco, cron e credenciais não foram alterados.

## Validações concluídas

- `npm test`: 33/33 aprovados; `npm run build`: aprovado.
- PHP do endpoint sem erros de sintaxe.
- HTTP: frontend `200`, bundle `200`, API sem sessão `401` (esperado).
- Sessão autenticada: filtros de 30/7 dias, Brasil, Minas Gerais, Paraná e retorno ao Brasil.
- Modelo `SCANIA R450 · 2019` selecionado e evidências abertas.
- Única mensagem de console observada é da extensão do Chrome, sem erro da aplicação.

## Critério conhecido do ranking

O ranking considera anúncios ativos do tipo `Caminhao` na UF/região/cidade selecionada, agrupa
por `marca + modelo + ano-modelo`, ordena pela quantidade de anúncios e exibe somente os dez
primeiros. O período altera movimento, não o estoque ativo. A busca textual da lista não é
enviada ao painel; por isso 44 DAF no Paraná podem estar divididos em vários grupos e nenhum
aparecer no top 10.

## Direção do redesign pausado

Auditoria independente: base coerente, maturidade aproximada 6/10; ainda parece dashboard
técnico. Problemas principais: filtros duplicados e desconectados, ranking em formato de
planilha, excesso de números/processos, KPIs altos e rolagem horizontal no mobile.

Direção aprovada para estudo: barra de contexto com chips e botão “Refinar”; multisseleção de UF,
marca, modelo e ano; “Panorama do mercado”; “Onde há mais ofertas”; “Modelos em destaque”;
“Detalhes do modelo”; “Ofertas disponíveis”. Mobile deve ser uma coluna sem rolagem horizontal.

## Próximos passos

1. Capturar e revisar a experiência mobile real.
2. Implementar o redesign refinado após decisão visual.
3. Unificar o estado dos filtros entre painel e ofertas e adicionar multisseleção.
4. Definir agrupamento do ranking e remover o limite silencioso de dez grupos.
5. Gerar build local e publicar via artefato, sempre com backup, hashes e smoke test.

## Registro de atualizações

```text
Data/hora:
Agente:
Bloco:
Ação executada:
Resultado:
Evidência (commit, URL, teste ou screenshot):
Próximo passo:
```

### 01/09/2026 — publicação, auditoria e documentação

- Frontend/API publicados e auditados com backup.
- PR #51 mesclado; checks Python 3.9/3.13 aprovados.
- Painel autenticado validado em desktop.
- Auditoria de design independente concluída.
- Documento de continuidade consolidado neste `CLAUDE.md`.

### 08/09/2026 — retomada do Plano Mestre e Pacote 1 (baseline + DAT01 + DAT03)

**Agente:** Claude (Cowork), a pedido de Felipe Hilario.
**Bloco:** M0 (retomada) + início do M1, itens 1–3 do "Pacote 1" do Plano Mestre v1.0.

**Baseline git observado nesta retomada (GOV01, parcial — ver limitação abaixo):**
- `main` remoto real: `89952e3` (não `1038b4f` como o texto acima ainda registra; a
  diferença é só o commit de docs `8ae664e`, sem mudança de código).
- Branch `redesign-oper-radar-20260831` @ `57bbe6e` — é a branch citada na auditoria de
  07/09 como "branch de redesign inspecionada"; contém o painel de Mercado com
  multisseleção de UF (`lib/market_scope.php`) que NÃO existe em `main`.
- Branch `deploy/painel-mercado-redesign-20260902` @ `97dd2a4` descende de `57bbe6e` e é,
  pelas datas e pelo conteúdo, a candidata mais provável ao que está de fato publicado —
  mas isso **não foi confirmado no cPanel** (ver limitação).
- `docs/PRODUCAO.md` (em `main` e na branch acima) já registra que "o estado publicado
  não é reproduzível apenas pelo commit Git" (arquivos não rastreados/modificados
  direto no servidor). Ou seja, mesmo achando o commit certo, isso não substitui uma
  leitura direta do cPanel.

**⚠️ Limitação conhecida desta retomada:** este agente não tem acesso a SSH nem ao
cPanel/HostGator (sem link com o computador do usuário nesta sessão) — só ao GitHub.
Portanto GOV01 (baseline de produção) e OPS01 (ambiente de teste/rollback em produção)
**não foram concluídos**, só o lado Git. Confirmar no cPanel qual commit/bundle está
realmente publicado, testar restauração de backup e só então liberar merge/deploy desta
branch é uma etapa que depende de Felipe ou de uma sessão com acesso ao servidor.

**Branch de trabalho:** `fix/pacote1-fipe-multiuf-baseline`, criada a partir de `main`
(`89952e3`), trazendo `lib/market_scope.php` + `tests/market_scope_test.php` de
`redesign-oper-radar-20260831` (arquivo autocontido, sem dependência do resto do
redesign visual).

**DAT01 · Casos #8252633 e #8318650 (FIPE incompatível) — isolados com motivo, não
"corrigidos" no banco (sem acesso a produção para isso):**
- Causa exata de como esses dois vínculos específicos foram gravados **não foi
  determinada** (a própria auditoria já registrava isso como pendente). O que se
  confirmou lendo o código: `minha_loja.php` aceitava qualquer `fipe_preco_id` enviado
  pelo cliente, sem validar contra marca/modelo/ano do item — diferente do algoritmo
  cuidadoso de `fase2-fipe/fipe_sync.py`, que nunca produziria um vínculo com ano e
  potência divergentes ao mesmo tempo.
- Criado `oper-radar-api/lib/fipe_compat.php`: valida ano-modelo do item vs.
  `fipe_preco.ano_codigo`, e (para DAF) o número de potência extraído do texto vs. o
  nome do modelo FIPE — mesma regra de `fipe_sync.py:potencia_daf`, reimplementada em
  PHP só para esta checagem pontual.
- `minha_loja.php` (POST criar/atualizar): agora **bloqueia** gravar um `fipe_preco_id`
  incompatível (HTTP 422 com o motivo). `minha_loja.php` (GET) e
  `minha_loja_detalhe.php`: vínculo já gravado que reprova a checagem tem os campos
  derivados da FIPE zerados e `fipe_vinculo_status=incompativel` com o motivo — sem
  apagar nem alterar o vínculo em si.
- Teste `oper-radar-api/tests/fipe_compat_test.php` reproduz os dois casos da auditoria
  como fixtures e confirma reprovação; `php oper-radar-api/tests/fipe_compat_test.php`
  → `fipe_compat_test=OK`.
- **Pendente:** isso impede o vínculo ruim de continuar contaminando a análise, mas não
  identifica nem corrige os registros já existentes no banco (não tenho acesso à
  produção). Sugestão de próximo passo: rodar uma consulta de auditoria (usando esta
  mesma função) sobre `meu_estoque` em produção para listar todos os vínculos
  incompatíveis, não só os dois já conhecidos.

**DAT03 · PR+SC retornando zero ofertas — corrigido:**
- Causa confirmada: `mercado_painel.php` (na branch de redesign) já aceita
  `uf=PR,SC` via `lib/market_scope.php`; `anuncios.php` e `lojistas.php` só entendiam
  uma UF (`r.uf = ?`), então `uf=PR,SC` virava uma comparação literal contra a string
  inteira e não batia com nenhuma linha.
- `anuncios.php` e `lojistas.php` agora usam a mesma `painel_normaliza_ufs()` de
  `market_scope.php` — os três endpoints enxergam o mesmo universo de UFs para o mesmo
  parâmetro `uf`. Compatível com `uf=PR` (uma UF só, formato antigo).
- Todos os 12 testes PHP de `oper-radar-api/tests/*_test.php` passam, incluindo os dois
  novos (`fipe_compat_test`, `market_scope_test` trazido da branch de redesign); `php -l`
  limpo em todos os `.php` do repositório.

**Evidência:** commits na branch `fix/pacote1-fipe-multiuf-baseline` (ver `git log`).
**Decisão do gestor:** Felipe revisou o PR #53 e aprovou o merge em 08/09/2026 —
`main` remoto passou a `6f39e4e` (merge commit sobre `d96d430`). **Ainda não publicado em
produção** (cPanel) — deploy manual segue como decisão separada.
**Próximo passo:** confirmar no cPanel qual commit/bundle está de fato publicado (GOV01/
OPS01, ainda pendente) e decidir o plano de deploy manual (sem SSH) para `d96d430`.
Documentos completos (auditoria + Plano Mestre v1.0) salvos no projeto Claude para
continuidade entre sessões.

### 08/09/2026 — Pacote 1, item 4: saídas de lojista reconciliadas (DAT04)

**Agente:** Claude (Cowork), a pedido de Felipe Hilario.
**Bloco:** M1, item 4 do "Pacote 1" do Plano Mestre v1.0 (GOV03 parcial + DAT04).

**DAT04 · Achado D03 da auditoria de 07/09 — saídas diferentes na mesma revenda
(caso Lelo Caminhões: cartão mostrava 56 saídas/30d e 128 total; detalhe mostrava
35/30d e 47) — corrigido:**
- Causa confirmada: `lojistas.php` (cartão da lista) contava "saídas" pelo status atual
  do anúncio (`removido_confirmado`), enquanto `lojista_detalhe.php` já usava o
  histórico de eventos (`saida_detectada`) — duas definições diferentes para o mesmo
  rótulo. Além disso, `lojista_detalhe.php` tratava "a tabela `anuncio_evento` existe no
  schema" como equivalente a "esta revenda tem eventos registrados", então às vezes
  reportava 0 saídas por eventos vazios como se fosse histórico completo, em vez de cair
  no status atual.
- Novas funções em `oper-radar-api/lib/competitor_history.php`:
  `oper_concorrente_tabela_eventos_disponivel()` e `oper_concorrente_saidas_por_revenda()`
  (agregação em lote por revenda, mesma definição de janela de 30 dias e cobertura usada
  no detalhe).
- `lojistas.php` e `lojista_detalhe.php` agora decidem pela mesma fonte de dados (eventos
  quando há cobertura registrada para a revenda/recorte; status atual como base quando
  não há) e expõem o mesmo campo `saidas_fonte` (`eventos` | `status_atual`). A lista
  ganhou também `cobertura_inicio/fim`, `cobertura_dias` e `saidas_confianca` por lojista
  — lacuna de histórico agora é explícita (cobertura zero), não um "zero saídas" implícito.
- 13 testes PHP de `oper-radar-api/tests/*_test.php` passam; `php -l` limpo em todos os
  `.php` do repositório. As duas novas funções de agregação dependem de `mysqli` e não
  têm teste unitário dedicado — mesma convenção já usada em outras funções de banco do
  projeto (ex.: `loja_busca_fipe_vinculo`).
- **Pendente:** GOV03 completo (mapear todo KPI → regra → API → tabela → evidência) seguem
  em aberto; este bloco só cobriu o KPI de "saídas do concorrente". Frontend
  (`app/src/App.jsx`) não foi alterado — os novos campos são aditivos e não quebram o
  que já é consumido.

**Evidência:** commits na branch `fix/pacote1-dat04-saidas-lojista` (ver `git log`).
**Decisão do gestor:** pendente — PR #54 aberta, aguardando revisão de Felipe antes de
merge/deploy.
**Próximo passo:** Felipe revisar o diff da PR #54 e decidir merge. Itens 5–6 do Pacote 1
(DAT02+DAT05+DAT06 — equivalência/confiança/período; GOV02+UX01–03 — fundação visual)
seguem não iniciados.
