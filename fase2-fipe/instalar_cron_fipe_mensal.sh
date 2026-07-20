#!/usr/bin/env bash
set -euo pipefail

HOME_OPER="/home1/pro93061"
RAIZ="$HOME_OPER/agenciaoper.com.br/oper-radar/fase2-fipe"
ENV_FILE="$HOME_OPER/.oper-radar.env"
LOG_DIR="$HOME_OPER/logs"
BACKUP_DIR="$HOME_OPER/backups"
MARCADOR="$HOME_OPER/.oper-radar-fipe-bootstrap-ok"
CRON_NOVO="$BACKUP_DIR/crontab-fipe-mensal.txt"
BACKUP="$BACKUP_DIR/crontab-antes-fipe-mensal.txt"

mkdir -p "$LOG_DIR" "$BACKUP_DIR"
chmod 700 "$LOG_DIR" "$BACKUP_DIR"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERRO: credenciais nao encontradas em $ENV_FILE" >&2
  exit 1
fi

crontab -l 2>/dev/null > "$BACKUP" || true

{
  grep -vE 'fipe_sync\.py|executar_fipe_job\.sh|oper-radar-fipe-bootstrap-ok' "$BACKUP" || true
  # O cruzamento local nao acessa a internet e acompanha as duas coletas diarias.
  echo "45 12 * * * bash -lc 'set -a; . $ENV_FILE; set +a; cd $RAIZ && bash executar_fipe_job.sh local >> $LOG_DIR/fipe-local.log 2>&1'"
  echo "45 23 * * * bash -lc 'set -a; . $ENV_FILE; set +a; cd $RAIZ && bash executar_fipe_job.sh local >> $LOG_DIR/fipe-local.log 2>&1'"
  # Verifica a referencia nos dez primeiros dias: se ainda for a mesma, gasta so 1 chamada.
  echo "15 13 1-10 * * bash -lc 'set -a; . $ENV_FILE; set +a; cd $RAIZ && bash executar_fipe_job.sh mensal >> $LOG_DIR/fipe-mensal.log 2>&1'"
  # Reabre a descoberta semanalmente; nos demais dias o marcador evita chamadas desnecessarias.
  echo "10 14 11,18,25 * * rm -f $MARCADOR"
  echo "30 14 11-31 * * bash -lc 'test -f $MARCADOR || { set -a; . $ENV_FILE; set +a; cd $RAIZ && bash executar_fipe_job.sh bootstrap $MARCADOR >> $LOG_DIR/fipe-bootstrap.log 2>&1; }'"
} > "$CRON_NOVO"

crontab "$CRON_NOVO"
chmod 600 "$BACKUP" "$CRON_NOVO"

echo "Cron FIPE mensal instalado: OK"
echo "Backup anterior: $BACKUP"
echo "Cruzamento local: 12h45 e 23h45 (zero requisicoes FIPE)"
echo "Atualizacao mensal: dias 1-10, 13h15 (so renova quando a referencia mudar)"
echo "Combinacoes novas: dias 11-31, 14h30; fila reaberta semanalmente"
echo "Limite automatico: cota contratada menos 50 com token; 480 sem token"
echo
crontab -l | grep -E 'executar_fipe_job\.sh|oper-radar-fipe-bootstrap-ok'
