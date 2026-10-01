# Fase 2 — Referência FIPE local e mensal

Cruza os caminhões do radar com preços médios FIPE sem consultar a API a cada abertura
do app ou a cada coleta. A fonte externa é a API v2 da Fipe Online: o acesso público é
limitado, enquanto o plano PRO contratado permite consultas ilimitadas e CSV completo.

## Arquitetura

O catálogo fica dentro do MySQL:

- `fipe_modelo`: catálogo de modelos de caminhão;
- `fipe_preco`: preço vigente por modelo e ano, com o código da referência mensal;
- `anuncio.fipe_preco_id`: vínculo auditável entre anúncio e preço local.

Existem três modos independentes:

| Modo | Objetivo | Usa API externa |
|---|---|---|
| `local` | Vincula anúncios usando preços já armazenados | Não |
| `bootstrap` | Descobre combinações novas presentes no radar | Sim, até o limite informado |
| `mensal` | Renova somente os preços existentes quando a referência muda | Sim, 1 chamada por preço |

Ambiguidades de linha ou eixo continuam sem vínculo automático. Ausências do cache no modo
local permanecem na fila, sem serem marcadas erroneamente como “sem ano”.

### Diagnóstico isolado P0 — série/geração (01/10/2026)

O matching automático antes aceitava número igual quando a série Scania aparecia só
em um lado (`R440` × `440`), com score 0,60. Também aceitava `DAF XF 530` ×
`XF105 530` com score 0,99 quando a configuração coincidia: a geração 105 estava
explícita só na FIPE. Isso podia produzir vínculo de modelo incorreto mesmo com
um único preço em cache. A correção exige série compatível nos dois lados quando
ela for explícita e não atribui geração 105/85 a um anúncio que não a informa.
Para série/geração explícita, só um candidato com score ≥ 0,95 pode seguir para
a verificação de ano/preço; empate ou evidência insuficiente permanece sem vínculo.

Matriz sintética, sem anúncios reais nem PII, medida pelos testes puros:

| Caso | Antes | Depois |
|---|---:|---:|
| Scania R440 × FIPE 440 sem série | 0,60 | 0,00 |
| Scania 440 sem série × FIPE R-440 | 0,60 | 0,00 |
| DAF XF 530 × FIPE XF105 FTT530 | 0,99 | 0,00 |
| DAF XF105 530 sem configuração × único XF105 FTT530 | 0,90, elegível | sem vínculo (confiança insuficiente) |
| Scania R440 × FIPE R-440, único | 0,95 | 0,95, alto |
| DAF XF105 FTT530 × FIPE XF105 FTT530, único | 0,99 | 0,99, alto |

**Métrica do conjunto sintético:** 4/4 casos sem evidência suficiente eram
elegíveis antes, 0/4 depois; 2/2 positivos de alta confiança preservados.
Os testes de regressão locais somam 42/42. Não se mediu cobertura em banco real
nem distribuição de scores de produção. Nenhum dado foi escrito e F4 segue bloqueada.
Sugestões de curadoria humana (`pontua_sugestao`) não foram alteradas.

### Diagnóstico isolado P0 — eixo/tração (01/10/2026)

Para eixo/tração 4x2, 6x2, 6x4 ou 8x2 explícito no anúncio, o matching automático
exige o mesmo eixo no nome FIPE, um único candidato após os filtros e score de pelo
menos 0,95 (`alto`). Um nome FIPE sem eixo não confirma a configuração. Se o anúncio
não declara eixo e o catálogo traz variantes de eixos diferentes, o nome base não
resolve a ambiguidade. Esses casos ficam sem vínculo automático para curadoria.

Ensaio offline em `test_fipe_sync.py` (catálogo sintético, sem F3/banco):

| Eixo do anúncio | FIPE igual | FIPE 4x2/6x2/6x4/8x2 diferente | FIPE sem eixo |
|---|---|---|---|
| 4x2 | único + score ≥ 0,95: `alto` | excluído | excluído |
| 6x2 | único + score ≥ 0,95: `alto` | excluído | excluído |
| 6x4 | único + score ≥ 0,95: `alto` | excluído | excluído |
| 8x2 | único + score ≥ 0,95: `alto` | excluído | excluído |

Dois modelos do eixo correto ou score menor que 0,95 ficam ambíguos; sem nenhum,
`sem match eixo`. Série Scania divergente (R/G) é rejeitada mesmo com eixo igual;
DAF XF FTT530 6x4 Super Space mantém somente cabine/configuração compatíveis.
IVECO TECTOR 240E25 8x2 com código e eixo exatos ainda recebe score 0,60 da
regra preexistente e **não** vira vínculo `alto`. A cobertura em anúncios reais
não foi medida: as linhas deslocadas do F3 não permitem essa inferência.

### Diagnóstico isolado P0 — cabine DAF (01/10/2026)

Na DAF, a FIPE também separa cabine (`Day`, `Sleeper`, `Space`, `Super Space Cab`; `cabine_daf`
em `fipe_sync.py`). Sem a palavra no anúncio, o matcher não escolhe uma versão por conta própria:
dois candidatos com cabines declaradas diferentes (ex.: `SPACE`/`SUPER SPACE`) ficam ambíguos, e o
mesmo vale quando só UM dos candidatos declara a cabine e o outro não diz nada (`XF FTT530 6x4`
genérico ao lado de `XF FTT530 6x4 Space Cab`) — um nome genérico na FIPE não é evidência de que
aquela é a versão certa, então ele entra na ambiguidade junto com o declarado. Só vincula sem a
palavra no anúncio quando TODOS os candidatos daquele número/série são igualmente genéricos (não
há cabine para desambiguar). Quando o ANÚNCIO declara a cabine explicitamente (ex.: "Super
Space"), exige-se a tag correspondente em algum candidato — mesmo que exista um único candidato
genérico com score alto (achado CUSTODIA/VELOX, 28/09): candidato único e confiança alta não
substituem a confirmação da cabine; sem nenhum candidato com a tag pedida, não vincula (`sem match
cabine <TAG>`), mesmo que todos os candidatos do grupo sejam igualmente genéricos. Testes em
`test_fipe_sync.py` (`test_daf_candidato_sem_tag_de_cabine_ao_lado_de_um_com_tag_fica_ambiguo`,
`test_daf_cabine_explicita_sem_nenhum_candidato_tagueado_nao_vincula` e vizinhos).

### Diagnóstico isolado P0 — DAF/IVECO (01/10/2026)

No matching DAF/IVECO, a vinculação automática exige um único modelo candidato com
confiança alta. XF105 não se mistura à geração XF mesmo quando um nome FIPE omite
potência; FT, FTS e FTT não se cruzam quando ambos os códigos são explícitos; códigos
IVECO 240E25/240E28 e potências S44T/S48T distintas são incompatíveis. Casos sem
evidência suficiente ficam sem vínculo automático para revisão. Essas regras só
mudam a seleção em memória; não adicionam consultas, índices nem migração de dados.
Se o anúncio DAF declara cabine, o modelo FIPE precisa declarar a mesma cabine;
nome FIPE sem cabine não basta mesmo com score numérico alto.
No IVECO, código composto exato recebe score alto somente com família, eixo e
cabine explícitos e iguais nos dois lados; sem essa evidência o score fica abaixo
do portão automático de 0,95.
A matriz de interação e seus limites estão em [P0-DAF-IVECO-MATRIZ.md](P0-DAF-IVECO-MATRIZ.md).

## Instalação em banco existente

```bash
set -a; . /home1/USUARIO/.oper-radar.env; set +a
cd /home1/USUARIO/agenciaoper.com.br/oper-radar/fase2-fipe
python3 migrar_fipe_mensal.py
```

A migração é idempotente: pode ser executada novamente sem duplicar coluna ou índice.

## Carga inicial por CSV

Quando houver um arquivo completo como `tabela-fipe-335.csv`, ele é a forma mais eficiente
de iniciar a referência. O importador lê somente `Type=TRUCK`, atualiza o catálogo completo
de caminhões e grava os preços das combinações necessárias aos anúncios ativos. Nenhuma
requisição externa é consumida.

```bash
python3 importar_fipe_csv.py /CAMINHO/tabela-fipe-335.csv --validar
python3 importar_fipe_csv.py /CAMINHO/tabela-fipe-335.csv --todos-os-precos
python3 fipe_sync.py --modo=local --lote=1000
```

No plano PRO, `--todos-os-precos` mantém os 11.386 preços de caminhões disponíveis para
consulta interna. O código da referência é lido do nome do arquivo (`335`) e também pode
ser informado com `--referencia-codigo`. O CSV não deve ser versionado no Git.

### Token da assinatura

Guardar o token somente em `/home1/USUARIO/.oper-radar.env` (permissão `600`):

```bash
FIPE_API_TOKEN='COLE_O_TOKEN_FORNECIDO'
FIPE_API_UNLIMITED=1
```

Não colocar o token no repositório, no cron ou em comandos salvos no histórico. Com
`FIPE_API_UNLIMITED=1`, o executor usa autenticação Bearer, renova o catálogo completo e
reduz a pausa entre chamadas. Sem token, mantém o limite público de 480.

## Validação

Diagnóstico do matching, sem API:

```bash
python3 fipe_sync.py --modo=debug
```

Cruzamento local, sem API:

```bash
python3 fipe_sync.py --modo=local --lote=1000
```

Piloto de combinações novas:

```bash
python3 fipe_sync.py --modo=bootstrap --lote=20 --max-req=50
```

Atualização mensal manual:

```bash
bash executar_fipe_job.sh mensal
```

A primeira requisição mensal consulta `/references`. No PRO, a execução renova todo o
catálogo local; se houver interrupção, a próxima execução continua pelos registros ainda
na referência anterior. Sem PRO, somente preços ligados a anúncios ativos entram na fila.

## Cron recomendado

Depois da migração e dos testes:

```bash
bash instalar_cron_fipe_mensal.sh
```

O instalador preserva o cron atual, remove agendamentos FIPE antigos e adiciona:

- 12h45 e 23h45: vínculo local, sem chamadas externas;
- dias 1–10 às 13h15: verifica a referência e atualiza somente quando o mês publicado mudar;
- dias 11–31 às 14h30: descobre combinações novas; a fila reabre nos dias 11, 18 e 25.

Um marcador interrompe automaticamente o bootstrap quando não restar fila. Ele é removido
nos dias 11, 18 e 25 para que combinações novas esperem no máximo uma semana.

## Limitações honestas

- A FIPE de veículos não cobre carretas e implementos.
- Veículos profissionais, carrocerias e acessórios podem valer muito mais que o caminhão-base.
- A referência é nacional; o preço praticado varia por região e estado do veículo.
- Os 128 anúncios atuais sem número identificável precisam de uma fila de revisão separada.

## Auditoria depois de mudanças de regra

```bash
python3 auditar_fipe_incompativeis.py
python3 auditar_fipe_incompativeis.py --aplicar
python3 fipe_sync.py --modo=local --lote=5000
```

O primeiro comando é dry-run. A aplicação nunca toca vínculos manuais e preserva o vínculo
anterior até o processamento local concluir. As regras bloqueiam conflito entre famílias
comerciais e exigem o código IVECO composto completo (`240E25` não é `240E28`).
Na URL canônica, o matching usa somente os segmentos do veículo e ignora o slug final da
revenda, evitando que nomes de lojas como “Cargo Modal” sejam tratados como família Ford Cargo.
Reprocessamentos que perderam marca ou ano são encerrados com motivo explícito (`sem_match`
ou `sem_ano`) e não permanecem indefinidamente numa fila à qual nunca seriam elegíveis.
