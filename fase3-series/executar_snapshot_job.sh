#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOME_OPER="${HOME_OPER:-/home1/pro93061}"
ENV_FILE="$HOME_OPER/.oper-radar.env"
LOCK_FILE="$HOME_OPER/.oper-radar-snapshot.lock"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERRO: arquivo de ambiente nao encontrado em $ENV_FILE" >&2
  exit 1
fi

# Reabre o proprio script sob flock. Se outra execucao estiver ativa, sai sem sobrepor.
if [[ "${OPER_RADAR_SNAPSHOT_LOCKED:-0}" != "1" ]]; then
  export OPER_RADAR_SNAPSHOT_LOCKED=1
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

cd "$SCRIPT_DIR"
exec "$PYTHON_BIN" -u snapshot_diario.py
