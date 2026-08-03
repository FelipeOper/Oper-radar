#!/usr/bin/env bash
set -euo pipefail

MODO="${1:-}"
MARCADOR="${2:-/home1/pro93061/.oper-radar-fipe-bootstrap-ok}"

ATUALIZAR_TODOS=()
LOTE=1000
if [[ -n "${FIPE_API_TOKEN:-}" && "${FIPE_API_UNLIMITED:-0}" == "1" ]]; then
  LIMITE_API=0
  # Mantem cada rodada abaixo do limite de processo da hospedagem compartilhada.
  MAX_REFRESH="${FIPE_MONTHLY_BATCH:-2500}"
  if [[ ! "$MAX_REFRESH" =~ ^[0-9]+$ ]] || (( MAX_REFRESH < 100 || MAX_REFRESH > 5000 )); then
    echo "ERRO: FIPE_MONTHLY_BATCH deve estar entre 100 e 5000" >&2
    exit 2
  fi
  LOTE=10000
  ATUALIZAR_TODOS=(--atualizar-todos-precos)
  export FIPE_API_PAUSE="${FIPE_API_PAUSE:-0.05}"
elif [[ -n "${FIPE_API_TOKEN:-}" ]]; then
  COTA_API="${FIPE_API_DAILY_LIMIT:-1000}"
  if [[ ! "$COTA_API" =~ ^[0-9]+$ ]] || (( COTA_API < 100 )); then
    echo "ERRO: FIPE_API_DAILY_LIMIT deve ser um numero maior ou igual a 100" >&2
    exit 2
  fi
  LIMITE_API="$((COTA_API - 50))"
  MAX_REFRESH="$((LIMITE_API - 1))"
else
  LIMITE_API=480
  MAX_REFRESH=479
fi

case "$MODO" in
  local)
    python3 -u fipe_sync.py --modo=local --lote=1000
    exec python3 -u fipe_sync.py --modo=sugestoes --lote=10000
    ;;
  mensal)
    # Uma chamada consulta /references; as demais renovam precos.
    exec python3 -u fipe_sync.py --modo=mensal \
      --max-req="$LIMITE_API" --max-refresh="$MAX_REFRESH" "${ATUALIZAR_TODOS[@]}"
    ;;
  bootstrap)
    exec python3 -u fipe_sync.py --modo=bootstrap --lote="$LOTE" \
      --max-req="$LIMITE_API" --marcador-conclusao="$MARCADOR"
    ;;
  *)
    echo "Uso: $0 {local|mensal|bootstrap} [arquivo-marcador]" >&2
    exit 2
    ;;
esac
