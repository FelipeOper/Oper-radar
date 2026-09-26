# AGENTS.md — instruções para agentes de código (Codex/GPT)

Projeto: Oper Radar (React + PHP + MySQL, hospedado em HostGator/cPanel sem SSH).
O manual canônico do projeto é `CLAUDE.md`; leia antes de agir. Este arquivo resume o que um segundo
orquestrador precisa para continuar o trabalho do Claude sem conflito.

## Orquestração (Claude é o master, GPT é o reserva)

Fonte de verdade fora do Git, pasta compartilhada: `C:\Users\aline\Downloads\OperRadar-Orquestracao\`

1. Ao começar, leia `ORQUESTRADOR-ATIVO.md`. Se a primeira linha não disser `ATIVO: GPT`, você está em
   reserva: **só leia e responda**. Não edite arquivos nem rode git que escreve.
2. Leia `HANDOFF-ORQUESTRADOR.md` inteiro: estado, decisões, pendências e próximos passos.
3. Enquanto você for o ativo, atualize o handoff a cada marco (tela concluída, PR atualizado, bloqueio).
4. Para devolver ao Claude: termine ou pause o passo atual, atualize o handoff e, por último, troque a
   primeira linha de `ORQUESTRADOR-ATIVO.md` para `ATIVO: CLAUDE (master)`.
5. Nunca dois agentes ao mesmo tempo. Na dúvida sobre quem está ativo, pergunte ao Felipe.

## Regras invioláveis

- Nunca digitar, pedir ou guardar senha, token ou credencial. O login do cPanel é feito pelo Felipe.
- Publicar em produção (cPanel) ou mesclar no `main` só com confirmação explícita do Felipe, no momento.
- Nunca push direto no `main`: trabalhe na branch `agent/portar-demo-real` e no PR #63.
- Não ler nem copiar a nota "Credenciais Site Oper Radar" do canvas.
- Número errado é pior que nenhum número: sem amostra suficiente, mostrar "amostra insuficiente".
- Ao alterar código, atualizar o README da pasta afetada.

## Antes de dar algo como pronto

Rode tudo, na raiz do worktree:

```text
cd app && npm test && npm run lint && npm run build
python -m unittest discover -s tests -p "test_*.py"      # 68 testes de contrato do CI (leem o texto do App.jsx)
```

Testes PHP (`oper-radar-api/tests/*_test.php`): a máquina não tem PHP instalado. Use o zip oficial do
PHP 8.3 (NTS x64) de downloads.php.net numa pasta temporária, confira o SHA-256 do `releases.json` e
rode com `-d extension=mbstring`. Nunca instale PHP globalmente sem pedir.

Verificação visual: `VITE_DEMO=1 npm run build` e `npx vite preview --port 4173`; navegador com o
`agent-browser` (`agent-browser open <url>` antes de `set viewport`). Encerre servidor e navegador ao
terminar.

## Estado e plano

`docs/oper-radar-redesign/MIGRACAO_DEMO_PARA_REAL.md` (mapa das telas, decisões, o que foi feito).
Design system: `design-system/README.md`. Um commit por tela, mensagem em português, com a linha
`Co-Authored-By` do agente que fez.
