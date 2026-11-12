#!/bin/bash
# Copia de loja/.env.local para a Vercel (produção) as variáveis do /painel,
# sem mostrar os valores na tela.
cd "$(dirname "$0")/.." || exit 1
for k in SUPABASE_URL SUPABASE_SERVICE_ROLE_KEY PAINEL_CODIGO SHOPIFY_ADMIN_CLIENT_ID SHOPIFY_ADMIN_CLIENT_SECRET; do
  v=$(grep "^$k=" .env.local | tail -1 | cut -d= -f2-)
  if [ -z "$v" ]; then echo "$k: não está no .env.local"; continue; fi
  vercel env rm "$k" production --yes >/dev/null 2>&1
  if printf %s "$v" | vercel env add "$k" production --sensitive >/dev/null 2>&1; then echo "$k: ok"; else echo "$k: falhou"; fi
done
echo "Pronto! Pode voltar ao chat."
