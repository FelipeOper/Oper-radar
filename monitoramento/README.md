# Monitoramento operacional

`verificar_saude.py` faz uma verificação consolidada e somente de leitura do banco:

- atraso da coleta principal;
- falhas de revendas nas últimas 24 horas;
- volume de anúncios ativos;
- presença e atualidade do snapshot diário;
- progresso da referência FIPE e anúncios ativos ainda ligados ao mês anterior.

O script imprime `OPER_RADAR_SAUDE=OK`, `ATENCAO` ou `CRITICO`. Retorna código diferente de
zero apenas no estado crítico, permitindo integração posterior com cron e canal de alerta.

Uso manual no servidor:

```bash
set -a
. /home1/pro93061/.oper-radar.env
set +a
cd /home1/pro93061/agenciaoper.com.br/oper-radar
python3 monitoramento/verificar_saude.py
```

O script não altera tabelas, arquivos, crons ou integrações externas.
