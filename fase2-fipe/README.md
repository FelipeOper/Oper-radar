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
