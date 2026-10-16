# Prompt base · Gestão de contatos do WhatsApp

Use este prompt numa sessão nova do Claude Code para criar o mesmo sistema para outro cliente.
Troque o que está entre `< >`.

---

Crie um sistema de gestão de contatos do WhatsApp para **<NOME DO CLIENTE>** (<ramo de atuação, cidade>).

**Objetivo:** o atendimento continua no app WhatsApp Business do celular. O sistema só observa: registra cada número
que chama, avisa o gerente (e opcionalmente um grupo) quando chega contato novo e mostra tudo num painel interno
onde a equipe lança o valor das vendas.

**Stack:**
- Deploy na **Vercel** (funções em `/api`, TypeScript, Web `Request/Response`), versionamento no **GitHub** (repo privado).
- Banco **Supabase** (Postgres) com migrations via Supabase CLI; RLS ligado sem policies (só o backend acessa com a service role).
- WhatsApp via **Z-API** (instância conectada por QR code ao app WhatsApp Business):
  - webhook "Ao receber" em `/api/webhook?secret=<WEBHOOK_SECRET>`, conferindo `instanceId`;
  - "Notificar as enviadas por mim" ligado, para medir o tempo da 1ª resposta (`fromMe`), ignorando `fromApi`;
  - ignora grupos, canais, status, reações e listas de transmissão;
  - envio de texto via `send-text` com header `Client-Token`.
- Painel em **Vite + React + Tailwind v4 + shadcn/ui**, gráficos com Recharts (componentes `chart` do shadcn).

**Dados:**
- `contacts` (wa_id PK, nome, linha, 1º contato, última msg, nº de msgs, 1ª/última resposta, anúncio de origem via `externalAdReply`).
- `messages` (messageId PK, garante idempotência), `notifications` (log dos avisos), `sales` (vendas lançadas no painel).
- Funções SQL atômicas `register_inbound` (decide se avisa: 1º contato ou retorno após N horas) e `register_outbound`.
- LGPD: não gravar o texto das mensagens por padrão (`STORE_MESSAGE_TEXT=false`); o aviso ao gerente nunca inclui o conteúdo.

**Painel (senha única via `DASHBOARD_PASSWORD`, Bearer):**
- Filtro de período (Hoje, 7, 30, 90 dias) com comparação ao período anterior.
- Indicadores: faturamento (destaque com mini gráfico), vendas, ticket médio, conversão, novos contatos, mensagens,
  via anúncio, aguardando resposta, tempo mediano da 1ª resposta.
- Gráficos: faturamento por dia (barras), novos contatos por dia empilhado anúncio × orgânico, faturamento por origem,
  horário dos contatos. Tooltips no hover, sem eixo duplo.
- Tabela de clientes: data, cliente, telefone, origem, status (aguardando/respondido/vendido), total vendido
  (abre histórico com exclusão e venda com data retroativa), campo para lançar venda (Enter), botão "Chamar" no WhatsApp,
  busca, filtros, ordenação, CSV, atualização a cada 30 s.

**Identidade visual:** fundo branco, tinta escura, cores da marca <cores hex>, logo em <caminho dos arquivos>.

**Atalho:** o projeto `/Users/syntax/vapar` (ou `/Users/syntax/vicofarma/whatsapp-gestao`) já implementa tudo isso.
Copie-o, troque `web/src/brand.ts`, as cores em `web/src/index.css`, os textos do README e crie Supabase, Vercel e
GitHub novos.

---
