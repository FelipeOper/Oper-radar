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

### Uplift de confiança para a linha CF (decisão Master aprovada)

A CF não tem letra de configuração (`FT`/`FTS`/`FTT`) para `avalia()` confirmar o modelo, então o
score fica travado em 0,90 ("potência") mesmo quando o candidato é o único certo — e o gate geral
de confiança (`>= 0,95`) rejeitaria esses casos por engano. `escolhe()` faz um uplift pontual para
0,95 SOMENTE quando **família CF, potência, eixo e cabine batem explicitamente dos dois lados**
(anúncio E FIPE, nenhum lado `None`) e sobra um único candidato:

- a potência é reconferida por conta própria (`potencia_daf` nos dois lados), não herdada do score
  que o candidato trouxe — defesa em profundidade contra um candidato que chegasse com score alto
  por outro motivo;
- emissão (E5/E6): o bloco de `emissao_preferida` mais acima tem um fallback que aceita um
  candidato FIPE SEM a tag quando nada contradiz; o uplift reconfere e exige a tag igual quando o
  ANÚNCIO declara a emissão explicitamente — sem a tag na FIPE, não há uplift;
- o ano-modelo **não entra aqui**: `escolhe()` só recebe o nome do modelo FIPE, sem ano-código; a
  conferência real do ano acontece depois, em `processa_anuncios()` →
  `busca_ou_cria_preco`/`busca_preco_cache` por `modelo_ano`. Confiança "alto" pelo uplift não
  dispensa essa etapa: sem o ano no cache local (modo `permitir_api=False`), nada é gravado, fica
  em `aguardando_cache` — nunca "vinculado" por confiança emprestada de outro sinal
  (`test_cf_uplift_ano_ainda_e_conferido_no_fluxo_final_sem_vinculo_por_cache_vazio`).

Ausência de evidência em qualquer ponto (só um lado declara, candidato sem tag, potência
divergente) nunca cai para confiança "média": fica sem vínculo. Testes em `test_fipe_sync.py`,
prefixo `test_cf_uplift_*` (positivos e os negativos espelhados de cada sinal).

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
