#!/usr/bin/env bash
set -euo pipefail

HOME_OPER="/home1/pro93061"
RAIZ="$HOME_OPER/agenciaoper.com.br/oper-radar/fase2-fipe"
ENV_FILE="$HOME_OPER/.oper-radar.env"
LOG_DIR="$HOME_OPER/logs"
BACKUP_DIR="$HOME_OPER/backups"
CRON_NOVO="$BACKUP_DIR/crontab-peneira-estoque.txt"
BACKUP="$BACKUP_DIR/crontab-antes-peneira-estoque.txt"
MARCADOR="peneira_estoque.py"

mkdir -p "$LOG_DIR" "$BACKUP_DIR"
chmod 700 "$LOG_DIR" "$BACKUP_DIR"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERRO: credenciais nao encontradas em $ENV_FILE" >&2
  exit 1
fi

crontab -l 2>/dev/null > "$BACKUP" || true

{
  grep -vF "$MARCADOR" "$BACKUP" || true
  echo "*/30 * * * * flock -n $LOG_DIR/peneira-estoque.lock -c 'set -a; . $ENV_FILE; set +a; cd $RAIZ && python3 $MARCADOR' >> $LOG_DIR/peneira-estoque.log 2>&1"
} > "$CRON_NOVO"

crontab "$CRON_NOVO"
chmod 600 "$BACKUP" "$CRON_NOVO"

echo "Cron da peneira de estoque instalado: OK"
echo "Backup anterior: $BACKUP"
echo "Frequencia: a cada 30 min, sem chamadas FIPE (so reusa assinatura resolvida)"
echo
crontab -l | grep -F "$MARCADOR"
