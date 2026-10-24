#!/usr/bin/env bash
# OPER RADAR — diagnostico completo da instalacao (SOMENTE LEITURA, sem segredos na saida).
# Cobre: codigo no servidor, API publicada x repositorio, crons e logs, erros de PHP, banco, FIPE, fila de vinculo.
# Uso na VPS:  bash /home1/pro93061/agenciaoper.com.br/oper-radar/scripts/diagnostico_instalacao.sh
set -uo pipefail

HOME_OPER="${OPER_RADAR_HOME:-/home1/pro93061}"
SITE="$HOME_OPER/agenciaoper.com.br"
CLONE="$SITE/oper-radar"
API="$SITE/oper-radar-api"
LOGS="$HOME_OPER/logs"
ENV_FILE="$HOME_OPER/.oper-radar.env"
PYTHON_BIN="${OPER_RADAR_PYTHON:-python3}"

secao() { printf '\n##### %s\n' "$1"; }

secao "1. CODIGO NO SERVIDOR"
git -C "$CLONE" log --oneline -1 2>&1 | sed 's/^/  HEAD: /'
git -C "$CLONE" fetch -q origin 2>/dev/null && echo "  atras do GitHub (main): $(git -C "$CLONE" rev-list --count HEAD..origin/main 2>/dev/null) commit(s)"
echo "  arquivos apagados/alterados na copia de trabalho: $(git -C "$CLONE" status --short 2>/dev/null | grep -vc '^??')"
git -C "$CLONE" status --short 2>/dev/null | grep -v '^??' | head -5 | sed 's/^/    /'

secao "2. API PUBLICADA x REPOSITORIO (ignora fim de linha)"
if [ -d "$CLONE/oper-radar-api" ] && [ -d "$API" ]; then
  iguais=0; diferentes=0; faltam=0
  while IFS= read -r arquivo; do
    rel="${arquivo#"$CLONE/oper-radar-api/"}"
    if [ ! -f "$API/$rel" ]; then
      printf '  FALTA      %s\n' "$rel"; faltam=$((faltam+1))
    elif cmp -s <(tr -d '\r' < "$arquivo") <(tr -d '\r' < "$API/$rel"); then
      iguais=$((iguais+1))
    else
      printf '  DIFERENTE  %s\n' "$rel"; diferentes=$((diferentes+1))
    fi
  done < <(find "$CLONE/oper-radar-api" -name '*.php' ! -path '*/tests/*' | sort)
  echo "  resumo: $iguais iguais, $diferentes diferentes, $faltam ausentes no servidor"
else
  echo "  pasta da API ou clone nao encontrada"
fi

secao "3. CRONS DA OPER RADAR"
crontab -l 2>/dev/null | grep -E 'fipe|coleta|classifica|peneira|monitoramento|snapshot|eventos|detalhe' | sed -E 's#(\. /home1/[^;]*;)#. <env>;#; s#^#  #' | cut -c1-210

secao "4. LOGS (ultima gravacao e ultimas linhas)"
for log in coleta-expansao.log detalhe.log fipe-local.log fipe-mensal.log fipe-bootstrap.log monitoramento.log classifica-conjunto.log peneira-estoque.log; do
  if [ -f "$LOGS/$log" ]; then
    printf '  %-24s %s\n' "$log" "$(stat -c '%y' "$LOGS/$log" 2>/dev/null | cut -c1-16)"
  else
    printf '  %-24s (nao existe)\n' "$log"
  fi
done
echo "  --- fipe-local.log (ultimas linhas)"
tail -n 12 "$LOGS/fipe-local.log" 2>/dev/null | cut -c1-200 | sed 's/^/    /'
echo "  --- fipe-bootstrap.log (ultimas linhas)"
tail -n 8 "$LOGS/fipe-bootstrap.log" 2>/dev/null | cut -c1-200 | sed 's/^/    /'
echo "  --- fipe-mensal.log (ultimas linhas)"
tail -n 6 "$LOGS/fipe-mensal.log" 2>/dev/null | cut -c1-200 | sed 's/^/    /'

secao "5. ERROS DE PHP RECENTES (API)"
tail -n 12 "$API/error_log" 2>/dev/null | cut -c1-220 | sed 's/^/  /'

if [ -f "$ENV_FILE" ]; then
  set -a; . "$ENV_FILE"; set +a
  cd "$CLONE/fase2-fipe" && "$PYTHON_BIN" diagnostico_instalacao.py
else
  echo "ERRO: $ENV_FILE nao encontrado"
fi
echo
echo "##### FIM DO DIAGNOSTICO"
