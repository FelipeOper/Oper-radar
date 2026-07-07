# OPER RADAR — Documento interno de produto e design

*Análise competitiva, diferenciais e direção de design. Uso interno da Agência Oper.*

---

## 1. Posicionamento: o que o OPER RADAR é (e o que os concorrentes NÃO são)

Pesquisei as principais plataformas de inteligência de mercado para revendas de veículos
(mercado americano, que é o mais maduro): CarGurus PriceVantage, vAuto ProfitTime GPS,
vAuto Provision, Carbly, VinAssessment, MarketCheck, Lotlinx, Catalyst IQ MarketAI, autoniq.

**Todas elas resolvem a mesma pergunta:** "quanto o *meu* carro no *meu* pátio vale, e por
quanto devo anunciá-lo?". Elas cruzam o estoque do próprio lojista com dados de mercado para
recomendar preço.

**O OPER RADAR responde uma pergunta diferente — e que nenhuma delas responde bem:**
> "O que o mercado *inteiro ao meu redor* está fazendo — o que meus concorrentes têm em
> estoque, por quanto anunciam, e o que está efetivamente vendendo (girando) na minha região?"

Essa diferença é estratégica:
- As ferramentas americanas partem do estoque interno (precisam de integração com o DMS/IMS
  do lojista). O OPER RADAR parte do **mercado público** — ele enxerga o estoque dos
  concorrentes, não só o seu.
- O sinal central do OPER RADAR — **anúncio que some = venda estimada** — dá uma métrica de
  *giro do concorrente* que nenhuma dessas ferramentas oferece, porque elas só veem o próprio
  pátio do cliente.
- Nicho: todas são de veículos leves nos EUA. **Não há concorrente direto** para pesados e
  extrapesados no Brasil. O portal Caminhões e Carretas é a maior base do nicho no país.

**Frase de posicionamento:** *OPER RADAR é o radar de mercado do transporte pesado brasileiro —
mostra o estoque, o preço e o giro dos concorrentes em tempo quase real, antes de você precisar
pedir um relatório.*

---

## 2. Diferenciais a implementar (roubados dos melhores, adaptados ao nosso ângulo)

Cada item abaixo veio de um concorrente real, adaptado para o que só o OPER RADAR consegue fazer
(ver mercado inteiro, não só o pátio do cliente).

### 2.1. Giro regional / "Market Days Supply" (de Carbly + vAuto Provision)
Quantos exemplares do modelo X estão anunciados na região, e quão rápido eles somem. Diz o que
está **quente** (some rápido, pouca oferta) vs **saturado** (muita oferta, gira devagar). É a
métrica mais acionável para decidir o que comprar para revenda.

### 2.2. Velocidade de venda por revenda concorrente (exclusivo do OPER RADAR)
Ranking de quais revendas giram mais rápido o estoque (mais anúncios confirmados como removidos
por mês). Ninguém mais tem isso porque ninguém mais vê o giro dos concorrentes.

### 2.3. Posicionamento de preço por anúncio (de CarGurus PriceVantage + VinAssessment)
Onde cada anúncio está em relação aos comparáveis do mercado (abaixo / na média / acima) e vs
FIPE. "Match levels": comparar exato (mesmo modelo/ano) → aproximado (mesma família). Precisa da
Fase 2 (FIPE) e de um volume mínimo de comparáveis.

### 2.4. Alertas de anúncio "parado" / aging (de Carbly + Lotpop)
Insight da Lotpop: depois de ~30-35 dias parado, cada dia a mais custa dinheiro. Um anúncio que
está no ar há muito tempo é oportunidade — o vendedor provavelmente vai baixar o preço ou topar
negociar. O OPER RADAR sinaliza esses anúncios "maduros" dos concorrentes como oportunidade de
compra/arbitragem.

### 2.5. Camada de AÇÃO, não só dashboard (o insight central da Lotpop)
> "Market data tells you what to do. LotWalk tells you whether you did it."

A maioria das ferramentas para no dashboard. O diferencial real é transformar o insight em uma
**ação rastreável**: transformar um alerta ("Scania R450 20% abaixo da FIPE em Maringá") em uma
tarefa que alguém do time pega, executa e marca como feita. Sem isso, é só mais um painel que
ninguém olha. Essa é a diferença entre "análise de mercado" e "ferramenta que muda o resultado".

### 2.6. Feed de sinais em tempo quase real (de MarketCheck + Catalyst IQ)
Um fluxo cronológico do que mudou: anúncios novos, quedas de preço, anúncios que sumiram (venda
provável). É o "batimento cardíaco" do mercado — o que abre o app pra ver todo dia.

### 2.7. Mapa de calor regional (de Catalyst IQ MarketAI)
Onde está a oferta e onde está o giro, por cidade/modelo. Visão geográfica de onde há mais
demanda vs mais estoque parado.

---

## 3. Reestruturação das seções do app

Estrutura atual (protótipo): Dashboard · Anúncios · Análise · Lojistas · Configuração.
Problema: é organizada por "tipo de tela", não pela decisão que o usuário precisa tomar. As
ferramentas boas se organizam por **trabalho a ser feito** (jobs to be done).

Estrutura proposta:

| Nova seção        | Substitui / vem de        | Trabalho que resolve |
|-------------------|---------------------------|----------------------|
| **Hoje** (feed)   | novo (era o "Dashboard")  | "o que mudou desde ontem?" — feed de sinais + KPIs no topo |
| **Mercado**       | Anúncios + Análise        | "o que tem à venda, por quanto, e como está o giro?" |
| **Oportunidades** | novo                      | "onde há dinheiro na mesa agora?" — abaixo da FIPE, anúncios parados, quedas de preço |
| **Concorrentes**  | Lojistas                  | "quem são os players, quem gira mais rápido?" |
| **Ações**         | novo                      | "o que meu time precisa fazer com esses insights?" (a camada de ação da Lotpop) |
| **Ajustes**       | Configuração              | papéis, campos, coleta |

Racional: "Hoje" vira a home porque a pergunta diária é "o que mudou?", não "me dê todos os
números". "Oportunidades" e "Ações" são as seções que separam o OPER RADAR de um dashboard
comum — são onde o dado vira decisão e a decisão vira execução.

---

## 4. Direção de design

**Brief do Felipe:** elegante e futurista, "como um Apple", com a sofisticação de uma fintech de
renome (Nubank). Manter a identidade de instrumentação/radar que já existe (fundo escuro).

Não vou copiar o roxo do Nubank (é a marca deles) nem cair no dark-mode-com-verde-neon genérico.
A identidade certa pro OPER RADAR é **instrumento de precisão** — um painel de radar/aviação:
escuro, calmo, com um único sinal de cor que representa "o radar detectou algo".

### Tokens de design

**Cor** (evolução da paleta atual, mais profunda e disciplinada):
- `--bg` (fundo profundo): `#0B0E13` — mais escuro e azulado que o atual, sensação de "tela de radar"
- `--surface` (cartões): `#141922`
- `--surface-2` (elevado): `#1B212C`
- `--ink` (texto): `#EDEFF3`
- `--ink-muted`: `#8A94A6`
- `--signal` (o acento único — âmbar de radar): `#F5A623`
- `--positive` (giro/venda): `#3DD68C`
- `--alert` (oportunidade quente): `#FF6B4A`
- `--line` (bordas hairline): `rgba(255,255,255,0.07)`

**Tipografia:**
- Display/números: uma fonte com caráter técnico e dígitos tabulares (ex: *Space Grotesk* ou
  *Geist* para títulos e KPIs — números que "parecem instrumento").
- Corpo: uma sans neutra e legível (ex: *Inter*).
- Dados/mono: uma mono para IDs, preços e timestamps (ex: *Geist Mono* / *JetBrains Mono*) —
  reforça o clima de instrumento e alinha números em coluna.

**Layout:**
- Mais respiro (espaçamento generoso, ao estilo Apple — a informação respira).
- Cartões com borda hairline em vez de sombra pesada; profundidade por camadas de cor, não por
  drop-shadow forte.
- Hierarquia clara: um número grande por cartão, rótulo pequeno, sem poluição.

**Assinatura (o elemento memorável):**
Um **indicador de radar "ao vivo"** — um pulso sutil que mostra que o monitoramento está ativo
(última coleta há X horas), presente no topo de forma constante. É o que diz, num relance, "este
sistema está vivo e vigiando o mercado por você". Nenhum concorrente comunica o "estou vigiando
agora" — todos parecem relatórios estáticos.

**Movimento:** contido. Um pulso ambiente no indicador de radar, transições suaves de 150-200ms
nos hovers, revelação sutil ao carregar. Nada de animação decorativa que faça parecer template.

---

## 5. O que fica para depois (honestidade sobre o estado atual)

- **Preço vs FIPE** (2.3) e **oportunidades por preço** (parte da 2.4) dependem da **Fase 2**
  (mapeamento marca/modelo → FIPE), que ainda não existe. No redesign, essas telas mostram a
  estrutura pronta com um estado "aguardando Fase 2", em vez de número inventado.
- **Aging real** precisa de histórico de várias coletas — hoje temos 1-2 ciclos. A métrica fica
  correta sozinha conforme o cron roda por mais dias.
- **Mapa de calor** (2.7) começa como visão por cidade em lista/tabela; o mapa geográfico visual
  entra quando houver volume de dados de mais estados (hoje só PR está sendo coletado).

O redesign entrega a **estrutura e o visual** de tudo isso agora, com os dados reais que já
existem (337 revendas, 7.344 anúncios) preenchendo o que é possível, e estados vazios honestos
("aguardando Fase 2", "coletando histórico") no resto — nunca número inventado.
