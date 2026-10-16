# Veipar · Gestão de contatos do WhatsApp

Registra todo número que chama no WhatsApp Business da Veipar, mostra num painel interno e
avisa o gerente no WhatsApp quando chega um contato novo. **O atendimento continua no app
WhatsApp Business**, como hoje; o sistema só observa e registra.

```
Cliente ──msg──▶ WhatsApp Business (app no celular, conectado à Z-API via QR code)
                       │ webhook "Ao receber" (+ "enviadas por mim")
                       ▼
            Vercel  /api/webhook ──▶ Supabase (contacts, messages, notifications)
                       │                     ▲
                       │ Z-API send-text     │
                       ▼                     │
         WhatsApp do gerente/grupo   painel React (web/) ── /api/contacts, /api/sales
```

## O que faz

- **Registro de contatos**: nome do perfil, telefone, linha (unidade), 1º contato, última mensagem, nº de mensagens.
- **Aviso ao gerente e a grupos**: mensagem de texto pela Z-API, para os números de `MANAGER_PHONES` e os grupos
  de `NOTIFY_GROUP_IDS`, no 1º contato e quando o número volta depois de
  `NOTIFY_RETURN_AFTER_HOURS` (padrão 24h) sem conversar.
- **Tempo de resposta**: com "Notificar as enviadas por mim" ligado na Z-API, as mensagens que a equipe manda
  pelo app também chegam ao webhook, e o painel calcula o tempo até a 1ª resposta e quem está aguardando.
- **Origem**: quando a conversa vem de um anúncio Click-to-WhatsApp, grava o ID e o título do anúncio.
- **Painel** (`/`): faturamento, vendas, ticket médio, conversão, contatos e tempo de resposta por período;
  gráficos de faturamento, novos contatos, origem (anúncio × orgânico) e horário; tabela de clientes com
  lançamento de venda, histórico de vendas, botão de chamar no WhatsApp e exportação CSV. Protegido por senha.
- **Idempotência**: webhooks podem chegar repetidos; o `messageId` de cada mensagem é chave primária, então nada duplica
  e o gerente não recebe aviso repetido.

## LGPD

Mensagens de clientes podem conter dados pessoais. Por padrão
`STORE_MESSAGE_TEXT=false`: o banco guarda só metadados (quem, quando, tipo da mensagem), nunca o conteúdo.
O painel tem `noindex`, exige senha e o banco tem RLS sem policies (só o backend acessa).

## Estrutura

```
api/webhook.ts        callback da Z-API (segredo na URL + instância conferida)
api/contacts.ts       dados do painel (Bearer DASHBOARD_PASSWORD)
api/sales.ts          lançar (POST) e excluir (DELETE) vendas
api/groups.ts         lista os grupos do WhatsApp conectado, para achar o ID do grupo de aviso
lib/                  parser do webhook, banco, envio WhatsApp, formatação
web/                  painel em React + Tailwind v4 + shadcn/ui (gráficos com Recharts)
supabase/migrations/  schema + funções atômicas register_inbound / register_outbound
tests/                vitest
```

## Colocando no ar

### 1. Supabase
1. Crie um projeto (região São Paulo).
2. `supabase link --project-ref <ref>` + `supabase db push` (ou cole `supabase/migrations/20261016120000_init.sql` no SQL Editor).
3. Anote `Project URL` e a `service_role key` (Settings → API). A service role **nunca** vai para o front.

### 2. Z-API
1. Em [z-api.io](https://www.z-api.io) crie uma instância e leia o QR code com o **app WhatsApp Business da Veipar**
   (Aparelhos conectados → Conectar aparelho). O atendimento continua normalmente no celular.
2. Anote o **ID** e o **Token** da instância e o **Token de segurança da conta** (Segurança → Client-Token).

### 3. Vercel
1. Importe este repositório do GitHub na Vercel. O `vercel.json` já define o build (`npm run build`) e a saída (`dist`).
2. Em **Settings → Environment Variables**, preencha tudo do `.env.example`.
3. Faça o deploy e anote a URL (ex.: `https://veipar.vercel.app`).

### 4. Webhook na Z-API
Na instância → **Webhooks e configurações gerais**:
- **Ao receber**: `https://<sua-url>/api/webhook?secret=<WEBHOOK_SECRET>`
- Ligue **Notificar as enviadas por mim** (necessário para medir o tempo de resposta).
- Os demais webhooks (status, desconectado etc.) podem ficar vazios.

**Aviso em grupo (opcional):** adicione o número da Veipar ao grupo da equipe, abra
`https://<sua-url>/api/groups` com o header `Authorization: Bearer <DASHBOARD_PASSWORD>`
(ou `curl -H "Authorization: Bearer ..." https://<sua-url>/api/groups`), copie o `phone` do grupo
(termina em `-group`) para `NOTIFY_GROUP_IDS` e faça redeploy.

Teste: mande uma mensagem de outro celular para o número da Veipar e confira o painel e o WhatsApp do gerente.

### Cuidados com a Z-API
- A Z-API **não é a API oficial da Meta**: ela opera uma sessão do WhatsApp Web. Há risco de bloqueio do número se
  ele for usado para disparo em massa. Aqui só saem avisos ao gerente, o que é um volume baixíssimo.
- Se o celular ficar muito tempo offline ou a sessão cair, o webhook para. Vale cadastrar o webhook
  **Ao desconectar** para um alerta futuro.
- A Z-API não assina os webhooks; por isso o `WEBHOOK_SECRET` na URL e a checagem do `instanceId`.

## Desenvolvimento

```bash
npm install
npm test           # testes do backend (parser, aviso, valores de venda)
npm run typecheck  # API + painel
vercel dev         # painel + API juntos, com as envs de .env.local
```

Só o painel, apontando a API para outro servidor: `VITE_API_PROXY=http://localhost:3000 npm run dev:web`.

### Design system
- Componentes [shadcn/ui](https://ui.shadcn.com) em `web/src/components/ui` (adicione outros com `npx shadcn@latest add <nome>`).
- Tokens da marca em `web/src/index.css`: fundo branco, tinta escura `#0f1720`, cores **provisórias** (azul `#2a78d6` e grafite `#4e5a63`).
  Troque `--brand*` e `--chart-*` pelas cores oficiais da Veipar.
- Nome, monograma e saudação do WhatsApp em `web/src/brand.ts`.
- Para usar a logo: salve `web/public/logo-icone.png` e troque o `<Monogram />` em `web/src/components/Brand.tsx` por `<img src="/logo-icone.png" className="size-10" alt="" />`.

## Replicar para outro cliente

Veja [docs/PROMPT-BASE.md](docs/PROMPT-BASE.md).

## Próximos passos possíveis
- Chatbot de triagem (horário, unidade, primeiras perguntas) antes do atendente humano.
- Login individual por atendente no painel (Supabase Auth) em vez de senha única.
- Alerta quando a instância da Z-API desconectar.
- Enviar conversões (venda lançada) para a Meta via Conversions API, usando o `ctwaClid` do anúncio.
