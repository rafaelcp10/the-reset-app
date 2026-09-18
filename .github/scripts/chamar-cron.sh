#!/usr/bin/env bash
#
# Chama uma rota de cron do app e falha o job se ela não responder 200 —
# assim o GitHub avisa em vez de silenciar.
#
# Isto é um arquivo .sh, e não um `run:` embutido no YAML, de propósito: a
# versão embutida usava continuação de linha com barra invertida, uma barra
# se perdeu ao editar o arquivo e o YAML inteiro ficou inválido. O GitHub
# então parou de rodar o workflow por completo, inclusive o check-in
# noturno, que não tinha nada a ver com a alteração. Script em arquivo
# próprio não tem como derrubar o workflow por erro de sintaxe do YAML.
set -uo pipefail

rota="${1:?uso: chamar-cron.sh <rota>}"

if [ -z "${APP_URL:-}" ] || [ -z "${CRON_SECRET:-}" ]; then
  echo "faltam os secrets APP_URL ou CRON_SECRET"
  exit 1
fi

resposta=$(curl -s -w "\n%{http_code}" -H "Authorization: Bearer ${CRON_SECRET}" "${APP_URL}/api/cron/${rota}")
corpo=$(printf '%s' "$resposta" | sed '$d')
status=$(printf '%s' "$resposta" | tail -n 1)

echo "rota: ${rota}"
echo "status: ${status}"
echo "resposta: ${corpo}"

if [ "$status" != "200" ]; then
  exit 1
fi
