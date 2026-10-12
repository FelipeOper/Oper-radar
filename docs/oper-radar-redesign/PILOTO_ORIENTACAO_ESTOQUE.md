# Piloto: orientação de venda por veículo (Minha Loja)

Decisão do Felipe (28/09/2026): o Oper Radar é ferramenta estratégica pra vender melhor o **próprio**
estoque, não pra achar caminhão pra comprar. Prioridade: Minha Loja, por veículo e praça — cruzar preço
próprio, mediana/faixa de anúncios equivalentes, concorrentes, movimento e confiança, e orientar **manter
preço**, **avaliar redução** ou **avaliar outra praça**, com evidência e "amostra insuficiente" quando
couber. Integrar a decisão ao Plano de ação. Reavaliar "O que comprar" como "Onde vender meu estoque"
fica para depois (não tocado nesta rodada).

Orientação de execução (mesma data): decisão comercial precisa de dado real. Protótipo em DEMO primeiro
pra validar o fluxo (feito — ver abaixo), depois um piloto pequeno com poucos veículos **reais**, somente
leitura, sem ampliar ao estoque inteiro e sem publicar/recomendar preço real sem dado suficiente. Fixture
DEMO não é prova de mercado.

## O que foi construído

- `oper-radar-api/lib/orientacao_estoque.php` (`oper_loja_orienta_veiculo`, testado em
  `tests/orientacao_estoque_test.php`, 11 casos): decide `manter` / `avaliar_reducao` /
  `avaliar_outra_praca` / `sem_base`. Fail-closed: sem 5 preços válidos na praça usada como base, não
  decide. Usa a própria praça (UF do veículo) quando ela tem amostra; cai pro nacional só se a própria
  praça não tiver. Só sugere outra praça se ela for publicável, diferente da atual e sustentar preço
  próximo do anunciado — senão a resposta certa é revisar o preço, não mudar de lugar.
- `minha_loja_detalhe.php`: cada região ganhou `desvio_preco_loja_pct` (preço próprio vs mediana daquela
  praça, não só a nacional); novo campo `orientacao` no payload.
- Frontend: cartão "O que fazer com este veículo" fixo acima das abas do painel (visível em qualquer
  aba, é o motivo de abrir o veículo), com botão "Criar ação" quando há algo a decidir — nasce no Plano de
  ação com origem "Minha Loja" e a evidência real (motivo + desvio). Nunca aparece em `manter` nem
  `sem_base` (não há ação a tomar).
- DEMO: os 4 veículos fictícios cobrem os 4 casos (`avaliar_outra_praca`, `manter`, `sem_base` por amostra
  insuficiente, `sem_base` por fora da base) — conferido visualmente, os 4 corretos, "Criar ação" testado.

## Piloto com dado real (antes de liberar geral)

1. **Publicar só a API** (arquivos novos/aditivos: `lib/orientacao_estoque.php` +
   patch em `minha_loja_detalhe.php`). Não quebra nada existente; o frontend publicado ainda não lê o
   campo `orientacao`, então ninguém vê nada novo ainda.
2. **Ler ao vivo, autenticado, só leitura** (`minha_loja_detalhe.php?id=X`, GET, sem efeito colateral):
   1 a 3 veículos reais do estoque do Felipe, escolhidos por já terem alguma amostra (não os primeiros da
   lista por acaso). Sem escrever nada, sem publicar frontend ainda.
3. **Critério de sucesso** (todos precisam valer):
   - A ação bate com o que um gestor experiente diria olhando a mesma mediana/faixa/amostra na tela.
   - Amostra insuficiente nunca produz `manter` nem `avaliar_*` — só `sem_base`.
   - `avaliar_outra_praca` só aparece quando a praça sugerida é de fato diferente, publicável e sustenta
     preço próximo do anunciado (nunca uma UF com pouca amostra).
   - Todo número mostrado (desvio, mediana usada) é rastreável até `regioes[]` ou `mercado_nacional` do
     mesmo payload — nada inventado, nada além do que a API já expõe.
4. **Critério de fracasso** (qualquer um interrompe a liberação):
   - Orientação contraria os números mostrados na mesma tela.
   - Sugere praça sem amostra mínima ou não publicável.
   - Texto promete venda ou trata saída observada como prova.
5. Só depois do piloto aprovado (registrado abaixo), publicar o **frontend** (cartão de orientação
   visível). Sem isso, a orientação fica só no backend, sem UI pra ninguém ver.

## Registro do piloto

**Data/hora:** 01/10/2026 (publicação e leitura ao vivo, após 4 rodadas de revisão Codex em 29/09/2026
— ver commits `c18f124`, `0312f20`, `036986d` em `agent/portar-demo-real`, round 4 = `approve`).

**Publicação:** só API, aditiva — `lib/orientacao_estoque.php` (novo) + patch em `minha_loja_detalhe.php`,
via Terminal do cPanel (backup automático antes de escrever, `php -l` + checagem de cada
`require_once` + teste `curl` ao vivo depois de escrever). Frontend não tocado.

**Incidente durante a publicação (corrigido antes de declarar concluído):** a primeira tentativa
derrubou `minha_loja_detalhe.php?id=*` para TODOS os ids (500, corpo vazio — `display_errors` off
em produção). Causa: o arquivo publicado já trazia, de um trabalho anterior mesclado na `main` mas
nunca de fato publicado no servidor (DAT01, `lib/fipe_compat.php`), um `require_once` desse arquivo
— que nunca tinha sido enviado ao cPanel. `lib/orientacao_estoque.php` (a mudança desta sessão) não
era a causa. Revertido na hora (backup restaurado, `lib/orientacao_estoque.php` novo removido),
confirmado `DEPENDENCIAS_OK` e `HTTP 401` (sem sessão) antes da segunda tentativa, que publicou os
3 arquivos certos (`fipe_compat.php` + `orientacao_estoque.php` + `minha_loja_detalhe.php`) de uma
vez. Lição: antes de publicar um PHP que `require_once` outro arquivo, confirmar que TODO require
do arquivo já existe no servidor — merge na `main` não é publicação; o estado publicado não é
reproduzível só pelo commit Git (já registrado antes neste projeto, reconfirmado aqui).

**Hashes publicados** (nota: os 2 arquivos com fim de linha CRLF no Git tiveram o `\r` normalizado
pra LF ao colar no Terminal do cPanel — conteúdo idêntico, só fim de linha; confirmado comparando
contra o hash do arquivo local com `\r` removido antes de aceitar como correto):
- `lib/fipe_compat.php`: `91b12d0756601590cf4360bbd66dc5a704d1cfa805e6073d0cc0fffa77dc48bd`
- `lib/orientacao_estoque.php`: `6137a9e1d0ac84a00fa7c871975b258abfe1a71c82a625c5e0358e7f880b94a6`
- `minha_loja_detalhe.php`: `3a8c151b714a2c9d36341c367df604898b5ec7ef8f1ae88884c32bcf91913910`
- Backup: `/home1/pro93061/backups/api-orientacao-piloto-v2-20261001-093849`

**Efeito colateral esperado, fora do escopo desta feature:** publicar `fipe_compat.php` também liga
o bloqueio DAT01 (vínculo FIPE incompatível não sustenta comparação) pra TODO o estoque do Felipe
em produção, não só pro veículo do piloto — era trabalho já pronto e testado, só nunca publicado
antes. Nenhum vínculo foi alterado no banco; só a análise passa a ser suspensa quando incompatível.

**3 veículos reais lidos ao vivo (GET autenticado, sem gravar nada):**

| id (ref. interna) | veículo | preço anunciado | UF no cadastro | base usada | desvio | ação |
|---|---|---|---|---|---|---|
| 19 (`7394895`) | DAF XF 530 6x4 2022 (repasse) | R$ 420.000 | — (não cadastrada) | nacional (5 comparáveis) | 0,0% | **manter** — "Preço dentro da faixa competitiva da mediana nacional (0%)." |
| 71 (`8489180`) | MB Axor 2544 6x2 2020 | R$ 319.990 | — (não cadastrada) | nacional (25 comparáveis) | -11,1% | **manter** — "Preço já -11.1% abaixo da mediana nacional; posição competitiva." |
| 49 (`8252633`) | DAF XF 480 2024 (caso DAT01 conhecido) | R$ 549.990 | — (não cadastrada) | nenhuma | — | **sem_base** — vínculo FIPE incompatível (ano-modelo do item 2024 diverge do ano da referência FIPE vinculada, 2026); "comparação suspensa até revisão." |

**Contra o critério de sucesso (todos os 4 valeram):**
- Ação bate com o que um gestor diria: sim nos 3 — preço na mediana (manter), preço já abaixo
  (manter, não mexer num preço já competitivo), sem FIPE confiável (sem_base, não inventa número).
- Amostra insuficiente nunca produziu `manter`/`avaliar_*`: confirmado no id 49 (`sem_base`).
- `avaliar_outra_praca` não apareceu em nenhum dos 3 — **não testado com dado real nesta rodada**
  (nenhum veículo do Felipe está ≥5% acima do mercado agora; o próprio KPI da tela mostra "0 acima
  do mercado"). Já coberto por teste automatizado (12 casos PHP), mas sem confirmação com dado real
  ainda — fica como pendência pra quando houver um caso real acima do mercado.
- Todo número rastreável no mesmo payload: sim — `desvio_pct` bate com `mercado_nacional.preco_mediano`
  vs `item.preco_anunciado` nos 3 casos; nenhum número fora do que a API já expõe.

**Critério de fracasso:** nenhum incidente (contradição, praça inválida, promessa de venda).

**Achado de dado real, fora do escopo de correção agora:** `uf` vem `null` no cadastro dos 3
veículos conferidos (e aparentemente em boa parte do estoque importado por XML). Isso significa que
"própria praça" (preferir a UF do próprio veículo sobre o nacional) nunca ativa hoje — a orientação
sempre cai pro nacional ou sem_base. Não é bug da lógica (que está correta e testada); é o dado de
origem que não popula UF. Decisão de corrigir a importação (ou pedir a UF no cadastro) fica com o
Felipe — não tocado nesta sessão.

**Veredito:** piloto aprovado. Critérios de sucesso cumpridos nos 3 casos lidos; nenhum critério de
fracasso disparou. Falta só confirmar `avaliar_outra_praca` com um caso real quando surgir (não
bloqueia liberar o frontend, já coberto por teste automatizado).

**Próximo passo:** publicar o frontend (cartão "O que fazer com este veículo" visível) seguindo o
mesmo fluxo de sempre (`npm test` + `npm run build` na máquina do Felipe, upload do `dist/`); depois
disso sim, todo mundo passa a ver a orientação na tela, não só o backend.
