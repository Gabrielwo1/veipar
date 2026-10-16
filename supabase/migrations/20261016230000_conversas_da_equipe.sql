-- Veipar · conversas iniciadas pela equipe (pelo celular) também aparecem no painel.
-- register_outbound passa a criar o contato quando ele ainda não existe (sem contar como lead: message_count = 0).
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
  insert into public.contacts (wa_id, line, first_seen_at, last_message_at, ai_enabled)
  values (p_wa_id, p_line, p_sent_at, p_sent_at, false)
  on conflict (wa_id) do nothing;

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

revoke all on function public.register_outbound from public, anon, authenticated;

create index if not exists contacts_last_reply_idx on public.contacts (last_reply_at desc);
