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

## Execução recorrente

`executar_monitoramento_job.sh` carrega o ambiente protegido, usa `flock` e executa a
verificação. Se o estado for crítico e `OPER_RADAR_ALERT_EMAIL` estiver definido no arquivo
de ambiente, tenta enviar o resultado por `mail` ou `mailx`. O endereço nunca fica no Git.

`instalar_cron_monitoramento.sh` preserva e faz backup do crontab atual, substitui somente o
bloco deste monitor e agenda verificações às 12h15 e 23h30. Sem e-mail configurado, os
resultados continuam disponíveis em `/home1/pro93061/logs/monitoramento.log`.
