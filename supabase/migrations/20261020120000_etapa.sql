-- Veipar · etapa da conversa: esperando contato → pedido realizado → faturamento realizado.
alter table public.contacts add column if not exists stage text not null default 'esperando';
alter table public.contacts drop constraint if exists contacts_stage_check;
alter table public.contacts add constraint contacts_stage_check check (stage in ('esperando', 'pedido', 'faturado'));

-- Quem já tem venda lançada está faturado.
update public.contacts c set stage = 'faturado' where exists (select 1 from public.sales s where s.wa_id = c.wa_id);

-- Lançar venda marca "faturamento realizado".
create or replace function public.sales_mark_billed()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  update public.contacts set stage = 'faturado' where wa_id = new.wa_id;
  return new;
end;
$$;

drop trigger if exists sales_mark_billed on public.sales;
create trigger sales_mark_billed after insert on public.sales
  for each row execute function public.sales_mark_billed();
