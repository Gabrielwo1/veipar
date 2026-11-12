-- Veipar · acessos da loja nova (veipar-loja). Cada visita, produto visto, item no carrinho e
-- checkout vira uma linha; o /painel da loja lê só os totais por loja_metricas().

create table if not exists public.loja_eventos (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  tipo text not null check (tipo in ('page_view', 'view_item', 'add_to_cart', 'begin_checkout')),
  visitante text not null,
  sessao text not null,
  caminho text,
  produto text,
  valor numeric(12, 2),
  origem text,
  campanha text,
  dispositivo text,
  estado text,
  cidade text
);

create index if not exists loja_eventos_created_at_idx on public.loja_eventos (created_at);

-- Só o servidor da loja (service role) lê e grava.
alter table public.loja_eventos enable row level security;

create or replace function public.loja_metricas(desde timestamptz, ate timestamptz)
returns jsonb
language sql
stable
set search_path = public
as $$
  with e as (
    select * from public.loja_eventos where created_at >= desde and created_at < ate
  ),
  sessoes as (
    -- Origem e dispositivo da sessão = os do primeiro evento dela.
    select distinct on (sessao) sessao, visitante, coalesce(origem, 'direto') as origem, dispositivo, estado
    from e order by sessao, created_at
  )
  select jsonb_build_object(
    'visitantes', (select count(distinct visitante) from e),
    'sessoes', (select count(*) from sessoes),
    'visualizacoes', (select count(*) from e where tipo = 'page_view'),
    'funil', jsonb_build_object(
      'visitas', (select count(*) from sessoes),
      'produto', (select count(distinct sessao) from e where tipo = 'view_item'),
      'carrinho', (select count(distinct sessao) from e where tipo = 'add_to_cart'),
      'checkout', (select count(distinct sessao) from e where tipo = 'begin_checkout')
    ),
    'por_dia', coalesce((
      select jsonb_agg(jsonb_build_object('dia', dia, 'visitantes', visitantes, 'visualizacoes', visualizacoes) order by dia)
      from (
        select to_char(created_at at time zone 'America/Sao_Paulo', 'YYYY-MM-DD') as dia,
               count(distinct visitante) as visitantes,
               count(*) filter (where tipo = 'page_view') as visualizacoes
        from e group by 1
      ) x
    ), '[]'::jsonb),
    'paginas', coalesce((
      select jsonb_agg(jsonb_build_object('nome', caminho, 'total', total) order by total desc)
      from (select caminho, count(*) as total from e where tipo = 'page_view' group by caminho order by total desc limit 10) x
    ), '[]'::jsonb),
    'produtos', coalesce((
      select jsonb_agg(jsonb_build_object('nome', produto, 'vistos', vistos, 'carrinho', carrinho) order by vistos desc)
      from (
        select produto,
               count(distinct sessao) filter (where tipo = 'view_item') as vistos,
               count(distinct sessao) filter (where tipo = 'add_to_cart') as carrinho
        from e where produto is not null group by produto order by vistos desc limit 10
      ) x
    ), '[]'::jsonb),
    'origens', coalesce((
      select jsonb_agg(jsonb_build_object('nome', origem, 'total', total) order by total desc)
      from (select origem, count(*) as total from sessoes group by origem order by total desc limit 8) x
    ), '[]'::jsonb),
    'dispositivos', coalesce((
      select jsonb_agg(jsonb_build_object('nome', coalesce(dispositivo, 'outro'), 'total', total) order by total desc)
      from (select dispositivo, count(*) as total from sessoes group by dispositivo) x
    ), '[]'::jsonb),
    'estados', coalesce((
      select jsonb_agg(jsonb_build_object('nome', estado, 'total', total) order by total desc)
      from (select estado, count(*) as total from sessoes where estado is not null group by estado order by total desc limit 10) x
    ), '[]'::jsonb)
  );
$$;

revoke all on function public.loja_metricas(timestamptz, timestamptz) from public, anon, authenticated;
