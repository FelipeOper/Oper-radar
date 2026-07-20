#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${HOME}/.oper-radar.env"
LOG_DIR="${HOME}/logs"
BACKUP_DIR="${HOME}/backups"
MARCADOR_INICIO="# OPER_RADAR_EXPANSAO_INICIO"
MARCADOR_FIM="# OPER_RADAR_EXPANSAO_FIM"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERRO: arquivo $ENV_FILE nao encontrado."
  exit 1
fi

mkdir -p "$LOG_DIR" "$BACKUP_DIR"
chmod 700 "$LOG_DIR" "$BACKUP_DIR"
agora="$(date +%Y%m%d-%H%M%S)"
backup="$BACKUP_DIR/crontab-antes-expansao-$agora.txt"
atual="$(mktemp)"
novo="$(mktemp)"
trap 'rm -f "$atual" "$novo"' EXIT

crontab -l > "$atual" 2>/dev/null || true
cp "$atual" "$backup"
chmod 600 "$backup"

# Remove apenas um bloco antigo criado por este instalador; preserva todo o restante.
awk -v inicio="$MARCADOR_INICIO" -v fim="$MARCADOR_FIM" '
  $0 == inicio { pulando=1; next }
  $0 == fim { pulando=0; next }
  !pulando { print }
' "$atual" > "$novo"

{
  echo "$MARCADOR_INICIO"
  echo "0 1 * * * set -a; . $ENV_FILE; set +a; cd $SCRIPT_DIR && python3 coleta_multi_uf.py --plano=expansao --janela=07h >> $LOG_DIR/coleta-expansao.log 2>&1"
  echo "0 13 * * * set -a; . $ENV_FILE; set +a; cd $SCRIPT_DIR && python3 coleta_multi_uf.py --plano=expansao --janela=19h >> $LOG_DIR/coleta-expansao.log 2>&1"
  echo "$MARCADOR_FIM"
} >> "$novo"

crontab "$novo"
echo "Expansao agendada: OK"
echo "Backup do cron anterior: $backup"
echo "Centro-Oeste, Nordeste e Norte: 01h e 13h"
