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

_(preencher após a leitura ao vivo)_
