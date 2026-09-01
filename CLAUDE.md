# OPER RADAR — continuidade e manual do projeto

> Documento canônico de retomada para agentes e equipe. Ler antes de executar comandos.
> Atualizar ao final de cada bloco importante. Nunca registrar senhas, tokens, cookies ou
> conteúdo de `.oper-radar.env`.

Última atualização: 01/09/2026

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
