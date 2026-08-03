#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOME_OPER="${HOME_OPER:-/home1/pro93061}"
LOG_DIR="$HOME_OPER/logs"
BACKUP_DIR="$HOME_OPER/backups-oper-radar"
MARCADOR_INICIO="# OPER_RADAR_MONITORAMENTO_INICIO"
MARCADOR_FIM="# OPER_RADAR_MONITORAMENTO_FIM"

mkdir -p "$LOG_DIR" "$BACKUP_DIR"
chmod 700 "$LOG_DIR" "$BACKUP_DIR"

agora="$(date +%Y%m%d-%H%M%S)"
backup="$BACKUP_DIR/crontab-antes-monitoramento-$agora.txt"
atual="$(mktemp)"
novo="$(mktemp)"
trap 'rm -f "$atual" "$novo"' EXIT

crontab -l > "$atual" 2>/dev/null || true
cp "$atual" "$backup"
chmod 600 "$backup"

awk -v inicio="$MARCADOR_INICIO" -v fim="$MARCADOR_FIM" '
  $0 == inicio { pulando=1; next }
  $0 == fim { pulando=0; next }
  !pulando { print }
' "$atual" > "$novo"

{
  echo "$MARCADOR_INICIO"
  echo "15 12 * * * bash $SCRIPT_DIR/executar_monitoramento_job.sh >> $LOG_DIR/monitoramento.log 2>&1"
  echo "30 23 * * * bash $SCRIPT_DIR/executar_monitoramento_job.sh >> $LOG_DIR/monitoramento.log 2>&1"
  echo "$MARCADOR_FIM"
} >> "$novo"

crontab "$novo"

echo "Cron de monitoramento instalado: OK"
echo "Backup anterior: $backup"
echo "Verificacoes: 12h15 e 23h30"
crontab -l | grep -A3 -B1 "$MARCADOR_INICIO"
