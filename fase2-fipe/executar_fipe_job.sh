#!/usr/bin/env bash
set -euo pipefail

MODO="${1:-}"
MARCADOR="${2:-/home1/pro93061/.oper-radar-fipe-bootstrap-ok}"

if [[ -n "${FIPE_API_TOKEN:-}" ]]; then
  COTA_API="${FIPE_API_DAILY_LIMIT:-1000}"
  if [[ ! "$COTA_API" =~ ^[0-9]+$ ]] || (( COTA_API < 100 )); then
    echo "ERRO: FIPE_API_DAILY_LIMIT deve ser um numero maior ou igual a 100" >&2
    exit 2
  fi
  LIMITE_API="$((COTA_API - 50))"
else
  LIMITE_API=480
fi

case "$MODO" in
  local)
    exec python3 -u fipe_sync.py --modo=local --lote=1000
    ;;
  mensal)
    # Uma chamada consulta /references; as demais renovam precos.
    exec python3 -u fipe_sync.py --modo=mensal \
      --max-req="$LIMITE_API" --max-refresh="$((LIMITE_API - 1))"
    ;;
  bootstrap)
    exec python3 -u fipe_sync.py --modo=bootstrap --lote=1000 \
      --max-req="$LIMITE_API" --marcador-conclusao="$MARCADOR"
    ;;
  *)
    echo "Uso: $0 {local|mensal|bootstrap} [arquivo-marcador]" >&2
    exit 2
    ;;
esac
