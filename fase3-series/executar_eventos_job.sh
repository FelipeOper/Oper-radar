#!/bin/bash
set -euo pipefail

BASE="/home1/pro93061/agenciaoper.com.br/oper-radar/fase3-series"
ENV_FILE="/home1/pro93061/.oper-radar.env"

if [ ! -r "$ENV_FILE" ]; then
  echo "ERRO: ambiente protegido ausente: $ENV_FILE" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
. "$ENV_FILE"
set +a

cd "$BASE"
exec "${OPER_RADAR_PYTHON:-python3}" -u materializar_eventos.py --aplicar
