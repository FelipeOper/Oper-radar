#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
API_PUBLIC="$(dirname "$ROOT")/oper-radar-api"
ENV_FILE="${OPER_RADAR_ENV_FILE:-$HOME/.oper-radar.env}"
FRONTEND_ZIP="$ROOT/frontend-fipe-sugestoes-curadoria.zip"
BACKUP="$HOME/backups/fipe-sugestoes-$(date +%Y%m%d-%H%M%S)"

[[ -f "$ENV_FILE" ]] || { echo "ERRO: $ENV_FILE nao encontrado" >&2; exit 1; }
[[ -f "$FRONTEND_ZIP" ]] || { echo "ERRO: envie frontend-fipe-sugestoes-curadoria.zip para $ROOT" >&2; exit 1; }
[[ -d "$API_PUBLIC" ]] || { echo "ERRO: pasta publica da API nao encontrada: $API_PUBLIC" >&2; exit 1; }

set -a
# shellcheck disable=SC1090
. "$ENV_FILE"
set +a

mkdir -p "$BACKUP" "$HOME/logs"
chmod 700 "$BACKUP" "$HOME/logs"
cp -a "$ROOT/index.html" "$ROOT/assets" "$API_PUBLIC" "$BACKUP/"

MYSQL_PWD="$OPER_RADAR_DB_PASS" mysqldump \
  --no-tablespaces --single-transaction --quick --skip-lock-tables \
  -h "$OPER_RADAR_DB_HOST" -u "$OPER_RADAR_DB_USER" "$OPER_RADAR_DB_NAME" \
  > "$BACKUP/banco.sql"
unset MYSQL_PWD
chmod 600 "$BACKUP/banco.sql"
[[ -s "$BACKUP/banco.sql" ]] || { echo "ERRO: backup do banco ficou vazio" >&2; exit 1; }

cd "$ROOT"
php fase4-acesso/migrar_curadoria_anuncio.php

for arquivo in anuncio_detalhe.php anuncios.php fipe_status.php; do
  php -l "oper-radar-api/$arquivo"
  cp "oper-radar-api/$arquivo" "$API_PUBLIC/$arquivo"
  chmod 644 "$API_PUBLIC/$arquivo"
  php -l "$API_PUBLIC/$arquivo"
done

unzip -o "$FRONTEND_ZIP" -d "$ROOT"
chmod 644 "$ROOT/index.html"
find "$ROOT/assets" -type f -exec chmod 644 {} \;

cd "$ROOT/fase2-fipe"
python3 -u fipe_sync.py --modo=sugestoes --lote=10000 \
  | tee "$HOME/logs/fipe-sugestoes-inicial.log"

echo
echo "PUBLICACAO CONCLUIDA"
echo "Backup: $BACKUP"
echo "Log das sugestoes: $HOME/logs/fipe-sugestoes-inicial.log"
