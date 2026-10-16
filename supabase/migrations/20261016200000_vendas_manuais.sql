-- Veipar · clientes e vendas lançados à mão (vendas que não passaram pelo WhatsApp)

alter table public.contacts add column if not exists source text not null default 'whatsapp';
alter table public.contacts drop constraint if exists contacts_source_check;
alter table public.contacts add constraint contacts_source_check check (source in ('whatsapp', 'manual'));

-- Se um cliente manual chamar no WhatsApp depois, ele passa a ser um contato do WhatsApp normal.
create or replace function public.contacts_promote_manual()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.direction = 'in' then
    update public.contacts
       set source = 'whatsapp', first_seen_at = new.sent_at, ai_enabled = true
     where wa_id = new.wa_id and source = 'manual';
  end if;
  return new;
end;
$$;

drop trigger if exists messages_promote_manual on public.messages;
create trigger messages_promote_manual after insert on public.messages
  for each row execute function public.contacts_promote_manual();
