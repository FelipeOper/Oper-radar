#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOME_OPER="${HOME_OPER:-/home1/pro93061}"
ENV_FILE="$HOME_OPER/.oper-radar.env"
LOCK_FILE="$HOME_OPER/.oper-radar-monitoramento.lock"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERRO: arquivo de ambiente nao encontrado em $ENV_FILE" >&2
  exit 1
fi

if [[ "${OPER_RADAR_MONITOR_LOCKED:-0}" != "1" ]]; then
  export OPER_RADAR_MONITOR_LOCKED=1
  exec flock -n "$LOCK_FILE" bash "$0" "$@"
fi

set -a
# shellcheck disable=SC1090
. "$ENV_FILE"
set +a

PYTHON_BIN="${OPER_RADAR_PYTHON:-python3}"
if ! command -v "$PYTHON_BIN" >/dev/null 2>&1; then
  echo "ERRO: interpretador Python nao encontrado: $PYTHON_BIN" >&2
  exit 2
fi

set +e
saida="$("$PYTHON_BIN" "$SCRIPT_DIR/verificar_saude.py" 2>&1)"
status=$?
set -e

printf '%s\n' "$saida"

if (( status != 0 )) && [[ -n "${OPER_RADAR_ALERT_EMAIL:-}" ]]; then
  assunto="[OPER RADAR] Monitoramento critico"
  if command -v mail >/dev/null 2>&1; then
    printf '%s\n' "$saida" | mail -s "$assunto" "$OPER_RADAR_ALERT_EMAIL"
  elif command -v mailx >/dev/null 2>&1; then
    printf '%s\n' "$saida" | mailx -s "$assunto" "$OPER_RADAR_ALERT_EMAIL"
  else
    echo "AVISO: alerta por e-mail configurado, mas mail/mailx nao esta disponivel" >&2
  fi
fi

exit "$status"
