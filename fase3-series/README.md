# Fase 3 — séries e eventos observados

Preserva o estado diário dos anúncios e transforma diferenças comprováveis entre snapshots
em fatos auditáveis. Nenhuma ausência do portal é chamada de venda.

## Produção atual

O `snapshot_diario.py` está ativo em produção desde 03/08/2026, diariamente às 23h10. Ele:

- materializa uma linha por anúncio e dia em `anuncio_snapshot`;
- detecta mudanças de preço em relação ao snapshot anterior;
- continua compatível com a coluna antiga `dias_no_ar`, enquanto passa a preencher
  `dias_observados` depois da migração semântica.

`executar_snapshot_job.sh` carrega o ambiente protegido e `instalar_cron_series.sh` mantém
o bloco de cron de forma idempotente.

## Fundação de eventos preparada neste branch

- `migrar_eventos.py`: simula por padrão; com `--aplicar`, cria `anuncio_evento` e adiciona
  colunas semânticas sem remover as antigas.
- `materializar_eventos.py`: simula por padrão; com `--aplicar`, grava eventos idempotentes.
  Aceita um dia (`--dia`) ou intervalo inclusivo (`--inicio` e `--fim`) de até 366 dias.
- `executar_eventos_job.sh`: executor protegido, preparado mas não agendado.
- `oper-radar-api/eventos.php`: leitura autenticada por anúncio ou resumo diário.

Eventos possíveis:

- `primeira_observacao`;
- `mudanca_preco`;
- `ausencia_detectada`;
- `saida_detectada`;
- `reaparecimento`;
- `mudanca_status` para demais transições.

O materializador bloqueia transições quando falta um dos dois snapshots ou quando o volume
do dia cai abaixo da proporção mínima de segurança. Isso evita transformar falha de coleta
em falsa saída.

## Ordem segura para uma publicação futura

1. Confirmar backup íntegro do banco.
2. Simular: `python3 migrar_eventos.py`.
3. Aplicar a migração: `python3 migrar_eventos.py --aplicar`.
4. Simular um dia explícito: `python3 materializar_eventos.py --dia=AAAA-MM-DD`.
5. Simular o histórico disponível: `python3 materializar_eventos.py --inicio=AAAA-MM-DD --fim=AAAA-MM-DD`.
6. Aplicar manualmente o mesmo intervalo e conferir contagens.
7. Publicar `eventos.php` e o executor.
8. Só então decidir se o job será agendado após o snapshot diário.

Nada desta nova fundação é ativado no servidor apenas por existir no repositório.
