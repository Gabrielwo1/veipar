-- Vapar · gestão de contatos do WhatsApp
-- Rode no SQL Editor do Supabase (ou `supabase db push`).

create table if not exists public.contacts (
  wa_id               text primary key,          -- telefone no formato do WhatsApp (DDI+DDD+número)
  name                text,                      -- nome do perfil do WhatsApp
  line                text,                      -- número da empresa (connectedPhone) que recebeu o 1º contato
  first_seen_at       timestamptz not null,
  last_message_at     timestamptz not null,
  message_count       integer not null default 0,
  last_notified_at    timestamptz,               -- último aviso enviado ao gerente
  first_reply_at      timestamptz,               -- 1ª resposta da equipe (enviada pelo app)
  last_reply_at       timestamptz,
  ad_source_id        text,                      -- anúncio Click-to-WhatsApp que originou o 1º contato
  ad_headline         text,
  created_at          timestamptz not null default now()
);

create index if not exists contacts_last_message_idx on public.contacts (last_message_at desc);
create index if not exists contacts_first_seen_idx   on public.contacts (first_seen_at desc);

create table if not exists public.messages (
  id               text primary key,             -- messageId (garante idempotência: webhooks podem chegar repetidos)
  wa_id            text not null references public.contacts (wa_id) on delete cascade,
  direction        text not null check (direction in ('in', 'out')),
  type             text not null,
  body             text,                         -- só preenchido se STORE_MESSAGE_TEXT=true
  line             text,
  sent_at          timestamptz not null,
  created_at       timestamptz not null default now()
);

create index if not exists messages_wa_id_idx on public.messages (wa_id, sent_at desc);

create table if not exists public.notifications (
  id          bigint generated always as identity primary key,
  wa_id       text not null references public.contacts (wa_id) on delete cascade,
  recipient   text not null,
  ok          boolean not null,
  error       text,
  created_at  timestamptz not null default now()
);

-- Acesso apenas pelo backend (service role). Sem policies = anon/authenticated bloqueados.
alter table public.contacts      enable row level security;
alter table public.messages      enable row level security;
alter table public.notifications enable row level security;

-- Registra uma mensagem recebida de forma atômica e decide se o gerente deve ser avisado.
-- Retorna duplicate=true quando o messageId já foi processado (reenvio do webhook).
create or replace function public.register_inbound(
  p_message_id      text,
  p_wa_id           text,
  p_name            text,
  p_line text,
  p_type            text,
  p_body            text,
  p_sent_at         timestamptz,
  p_return_hours    integer,
  p_ad_source_id    text default null,
  p_ad_headline     text default null
)
returns table (duplicate boolean, is_new boolean, should_notify boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  c public.contacts%rowtype;
  v_new boolean;
  v_notify boolean;
begin
  insert into public.contacts (wa_id, name, line, first_seen_at, last_message_at, ad_source_id, ad_headline)
  values (p_wa_id, p_name, p_line, p_sent_at, p_sent_at, p_ad_source_id, p_ad_headline)
  on conflict (wa_id) do nothing;

  select * into c from public.contacts where wa_id = p_wa_id for update;

  insert into public.messages (id, wa_id, direction, type, body, line, sent_at)
  values (p_message_id, p_wa_id, 'in', p_type, p_body, p_line, p_sent_at)
  on conflict (id) do nothing;

  if not found then
    return query select true, false, false;
    return;
  end if;

  v_new := c.message_count = 0;
  v_notify := c.last_notified_at is null
           or (p_return_hours > 0 and c.last_message_at < p_sent_at - make_interval(hours => p_return_hours));

  update public.contacts set
    name             = coalesce(nullif(p_name, ''), name),
    last_message_at  = greatest(last_message_at, p_sent_at),
    message_count    = message_count + 1,
    last_notified_at = case when v_notify then now() else last_notified_at end
  where wa_id = p_wa_id;

  return query select false, v_new, v_notify;
end;
$$;

-- Registra uma resposta enviada pela equipe no app (webhook fromMe da Z-API).
create or replace function public.register_outbound(
  p_message_id      text,
  p_wa_id           text,
  p_line text,
  p_type            text,
  p_body            text,
  p_sent_at         timestamptz
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.contacts where wa_id = p_wa_id) then
    return; -- conversa iniciada pela empresa com quem nunca chamou: fora do escopo
  end if;

  insert into public.messages (id, wa_id, direction, type, body, line, sent_at)
  values (p_message_id, p_wa_id, 'out', p_type, p_body, p_line, p_sent_at)
  on conflict (id) do nothing;

  if found then
    update public.contacts set
      first_reply_at = coalesce(first_reply_at, p_sent_at),
      last_reply_at  = greatest(coalesce(last_reply_at, p_sent_at), p_sent_at)
    where wa_id = p_wa_id;
  end if;
end;
$$;

revoke all on function public.register_inbound  from public, anon, authenticated;
revoke all on function public.register_outbound from public, anon, authenticated;

-- Vendas registradas manualmente no painel (um contato pode comprar várias vezes).
create table if not exists public.sales (
  id          bigint generated always as identity primary key,
  wa_id       text not null references public.contacts (wa_id) on delete cascade,
  amount      numeric(12, 2) not null check (amount > 0),
  sold_at     timestamptz not null default now(),
  note        text,
  created_at  timestamptz not null default now()
);

create index if not exists sales_sold_at_idx on public.sales (sold_at desc);
create index if not exists sales_wa_id_idx   on public.sales (wa_id);

alter table public.sales enable row level security;
