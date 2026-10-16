-- Veipar · conversas no painel + atendente de IA

-- Quem escreveu cada mensagem: cliente, IA ou equipe (pelo painel ou pelo celular).
alter table public.messages add column if not exists author text;
update public.messages set author = case when direction = 'in' then 'customer' else 'human' end where author is null;
alter table public.messages alter column author set not null;
alter table public.messages drop constraint if exists messages_author_check;
alter table public.messages add constraint messages_author_check check (author in ('customer', 'ai', 'human'));

-- Estado do atendimento de cada conversa.
alter table public.contacts add column if not exists ai_enabled      boolean not null default true; -- false = equipe assumiu
alter table public.contacts add column if not exists handoff_at      timestamptz;                  -- IA encaminhou; limpo quando a equipe responde/assume
alter table public.contacts add column if not exists handoff_summary jsonb;                        -- pedido coletado pela IA
alter table public.contacts add column if not exists last_preview    text;                         -- trecho da última mensagem (lista de conversas)

create index if not exists contacts_handoff_idx on public.contacts (handoff_at desc) where handoff_at is not null;

-- register_inbound: grava autor e prévia.
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

  insert into public.messages (id, wa_id, direction, author, type, body, line, sent_at)
  values (p_message_id, p_wa_id, 'in', 'customer', p_type, p_body, p_line, p_sent_at)
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
    last_notified_at = case when v_notify then now() else last_notified_at end,
    last_preview     = left(coalesce(p_body, '[' || p_type || ']'), 140)
  where wa_id = p_wa_id;

  return query select false, v_new, v_notify;
end;
$$;

-- register_outbound: resposta da equipe pelo celular. A equipe assumiu, então a IA para.
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

  insert into public.messages (id, wa_id, direction, author, type, body, line, sent_at)
  values (p_message_id, p_wa_id, 'out', 'human', p_type, p_body, p_line, p_sent_at)
  on conflict (id) do nothing;

  if found then
    update public.contacts set
      first_reply_at = coalesce(first_reply_at, p_sent_at),
      last_reply_at  = greatest(coalesce(last_reply_at, p_sent_at), p_sent_at),
      ai_enabled     = false,
      handoff_at     = null,
      last_preview   = left(coalesce(p_body, '[' || p_type || ']'), 140)
    where wa_id = p_wa_id;
  end if;
end;
$$;

-- Mensagens enviadas pela API (IA ou painel). Idempotente pelo messageId da Z-API.
create or replace function public.register_sent(
  p_message_id text,
  p_wa_id      text,
  p_author     text,
  p_body       text,
  p_sent_at    timestamptz
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.messages (id, wa_id, direction, author, type, body, line, sent_at)
  values (p_message_id, p_wa_id, 'out', p_author, 'text', p_body, null, p_sent_at)
  on conflict (id) do nothing;

  if found then
    update public.contacts set
      first_reply_at = coalesce(first_reply_at, p_sent_at),
      last_reply_at  = greatest(coalesce(last_reply_at, p_sent_at), p_sent_at),
      last_preview   = left(p_body, 140)
    where wa_id = p_wa_id;
  end if;
end;
$$;

revoke all on function public.register_inbound  from public, anon, authenticated;
revoke all on function public.register_outbound from public, anon, authenticated;
revoke all on function public.register_sent     from public, anon, authenticated;
