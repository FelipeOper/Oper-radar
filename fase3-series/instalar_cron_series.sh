#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOME_OPER="${HOME_OPER:-/home1/pro93061}"
LOG_DIR="$HOME_OPER/logs"
BACKUP_DIR="$HOME_OPER/backups-oper-radar"
MARCADOR_INICIO="# OPER_RADAR_SERIES_INICIO"
MARCADOR_FIM="# OPER_RADAR_SERIES_FIM"

mkdir -p "$LOG_DIR" "$BACKUP_DIR"
chmod 700 "$LOG_DIR" "$BACKUP_DIR"

agora="$(date +%Y%m%d-%H%M%S)"
backup="$BACKUP_DIR/crontab-antes-fase3-$agora.txt"
atual="$(mktemp)"
novo="$(mktemp)"
trap 'rm -f "$atual" "$novo"' EXIT

crontab -l > "$atual" 2>/dev/null || true
cp "$atual" "$backup"
chmod 600 "$backup"

# Remove somente um bloco anterior da Fase 3 e preserva todos os outros crons.
awk -v inicio="$MARCADOR_INICIO" -v fim="$MARCADOR_FIM" '
  $0 == inicio { pulando=1; next }
  $0 == fim { pulando=0; next }
  !pulando { print }
' "$atual" > "$novo"

{
  echo "$MARCADOR_INICIO"
  echo "10 23 * * * bash $SCRIPT_DIR/executar_snapshot_job.sh >> $LOG_DIR/snapshot-diario.log 2>&1"
  echo "$MARCADOR_FIM"
} >> "$novo"

# O crontab valida o arquivo inteiro antes de substituir a configuracao atual.
crontab "$novo"

echo "Cron da Fase 3 instalado: OK"
echo "Backup anterior: $backup"
echo "Snapshot diario: 23h10"
crontab -l | grep -A2 -B1 "$MARCADOR_INICIO"
