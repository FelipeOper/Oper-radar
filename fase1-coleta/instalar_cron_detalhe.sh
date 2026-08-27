#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOME_OPER="${HOME_OPER:-/home1/pro93061}"
ENV_FILE="$HOME_OPER/.oper-radar.env"
LOG_DIR="$HOME_OPER/logs"
BACKUP_DIR="$HOME_OPER/backups-oper-radar"
MARCADOR_INICIO="# OPER_RADAR_DETALHE_INICIO"
MARCADOR_FIM="# OPER_RADAR_DETALHE_FIM"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERRO: arquivo $ENV_FILE nao encontrado."
  exit 1
fi

mkdir -p "$LOG_DIR" "$BACKUP_DIR"
chmod 700 "$LOG_DIR" "$BACKUP_DIR"

agora="$(date +%Y%m%d-%H%M%S)"
backup="$BACKUP_DIR/crontab-antes-detalhe-$agora.txt"
atual="$(mktemp)"
novo="$(mktemp)"
trap 'rm -f "$atual" "$novo"' EXIT

crontab -l > "$atual" 2>/dev/null || true
cp "$atual" "$backup"
chmod 600 "$backup"

# Remove somente o bloco criado por este instalador e preserva todos os outros crons.
awk -v inicio="$MARCADOR_INICIO" -v fim="$MARCADOR_FIM" '
  $0 == inicio { pulando=1; next }
  $0 == fim { pulando=0; next }
  !pulando { print }
' "$atual" > "$novo"

{
  echo "$MARCADOR_INICIO"
  echo "*/30 * * * * flock -n $LOG_DIR/detalhe.lock -c 'set -a; . $ENV_FILE; set +a; cd $SCRIPT_DIR && \"\${OPER_RADAR_PYTHON:-python3}\" -u scraper_detalhe.py --lote=80 --pausa-requisicoes=4' >> $LOG_DIR/detalhe.log 2>&1"
  echo "$MARCADOR_FIM"
} >> "$novo"

# O crontab valida o arquivo inteiro antes de substituir a configuracao atual.
crontab "$novo"

echo "Cron de detalhes instalado: OK"
echo "Backup anterior: $backup"
echo "Coleta de detalhes ativos: a cada 30 minutos, lote de 80"
crontab -l | grep -A2 -B1 "$MARCADOR_INICIO"
