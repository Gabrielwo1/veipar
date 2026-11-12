import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { connection } from 'next/server'
import { Suspense } from 'react'
import { prettyTitle } from '@/components/product-grid'
import { eventosConfigurados, lerMetricas, type Metricas } from '@/lib/eventos'
import { adminConfigurado, pedidosDesde, type Pedido } from '@/lib/shopify-admin'
import { sair } from './actions'
import { COOKIE, cookieValido } from './auth'
import { BarrasPorDia, Funil, Lista } from './charts'
import { LoginForm } from './login-form'

export const metadata: Metadata = { title: 'Painel', robots: { index: false, follow: false } }

const PERIODOS = [
  { dias: 1, label: 'Hoje' },
  { dias: 7, label: '7 dias' },
  { dias: 30, label: '30 dias' },
  { dias: 60, label: '60 dias' },
]

export default function PainelPage({ searchParams }: PageProps<'/painel'>) {
  return (
    <Suspense fallback={<div className="mx-auto min-h-[60vh] max-w-7xl px-4 py-10 text-muted">Carregando…</div>}>
      <Painel searchParams={searchParams} />
    </Suspense>
  )
}

const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const num = (n: number) => n.toLocaleString('pt-BR')
const pct = (a: number, b: number) => (b > 0 ? `${((a / b) * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%` : '—')

function inicioDoPeriodo(dias: number) {
  // Meia-noite de São Paulo (UTC-3) de (dias - 1) dias atrás.
  const agora = new Date(Date.now() - 3 * 3600_000)
  const d = new Date(Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth(), agora.getUTCDate() - (dias - 1), 3))
  return d
}

const diaSP = (iso: string) => new Date(new Date(iso).getTime() - 3 * 3600_000).toISOString().slice(0, 10)

function resumirVendas(pedidos: Pedido[]) {
  const validos = pedidos.filter((p) => !p.cancelledAt && p.displayFinancialStatus !== 'VOIDED')
  const valor = (p: Pedido) => Number(p.totalPriceSet.shopMoney.amount)
  const faturamento = validos.reduce((s, p) => s + valor(p), 0)
  const contar = <K extends string>(chaves: K[]) => {
    const m = new Map<K, number>()
    for (const k of chaves) m.set(k, (m.get(k) ?? 0) + 1)
    return [...m].map(([nome, total]) => ({ nome, total })).sort((a, b) => b.total - a.total)
  }
  const porDia = new Map<string, number>()
  for (const p of validos) porDia.set(diaSP(p.createdAt), (porDia.get(diaSP(p.createdAt)) ?? 0) + valor(p))
  const produtos = new Map<string, number>()
  for (const p of validos) for (const li of p.lineItems.nodes) produtos.set(prettyTitle(li.title), (produtos.get(prettyTitle(li.title)) ?? 0) + li.quantity)

  return {
    pedidos: validos.length,
    cancelados: pedidos.length - validos.length,
    faturamento,
    ticket: validos.length ? faturamento / validos.length : 0,
    pendentes: validos.filter((p) => p.displayFinancialStatus === 'PENDING').length,
    porDia,
    produtos: [...produtos].map(([nome, total]) => ({ nome, total })).sort((a, b) => b.total - a.total).slice(0, 10),
    estados: contar(validos.map((p) => p.shippingAddress?.provinceCode ?? '—')).slice(0, 10),
    canais: contar(validos.map((p) => p.sourceName ?? 'outro')),
    novos: validos.filter((p) => p.customer?.numberOfOrders === '1').length,
  }
}

async function Painel({ searchParams }: { searchParams: PageProps<'/painel'>['searchParams'] }) {
  const store = await cookies()
  if (!cookieValido(store.get(COOKIE)?.value)) return <LoginForm />

  const sp = await searchParams
  await connection()
  const dias = PERIODOS.some((p) => String(p.dias) === sp.dias) ? Number(sp.dias) : 7
  const desde = inicioDoPeriodo(dias)
  const ate = new Date()

  const [metricas, vendas] = await Promise.all([
    lerMetricas(desde, ate).catch(() => null),
    adminConfigurado
      ? pedidosDesde(desde).then(resumirVendas, (e: Error) => ({ erro: e.message }))
      : Promise.resolve({ erro: 'not_configured' }),
  ])
  const v = 'erro' in vendas ? null : vendas
  const m: Metricas | null = metricas

  // Eixo de dias do período, para os gráficos não pularem dias sem movimento.
  const diasDoPeriodo = Array.from({ length: dias }, (_, i) => diaSP(new Date(desde.getTime() + i * 86_400_000 + 3600_000).toISOString()))
  const visitasPorDia = new Map(m?.por_dia.map((d) => [d.dia, d.visitantes]))

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-royal">Veipar · loja nova</p>
          <h1 className="font-display text-3xl font-bold text-navy md:text-4xl">Painel</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {PERIODOS.map((p) => (
            <Link
              key={p.dias}
              href={`/painel?dias=${p.dias}`}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                p.dias === dias ? 'bg-navy text-white' : 'bg-white text-navy shadow-soft hover:bg-ice'
              }`}
            >
              {p.label}
            </Link>
          ))}
          <form action={sair}>
            <button className="rounded-full px-3 py-2 text-sm text-muted hover:text-navy">Sair</button>
          </form>
        </div>
      </div>

      {!m && <Aviso>{eventosConfigurados ? 'Não consegui ler os acessos agora.' : 'Os acessos ainda não estão ligados (falta o banco).'}</Aviso>}
      {'erro' in vendas && (
        <Aviso>
          {vendas.erro === 'not_configured'
            ? 'As vendas aparecem quando o app da Shopify estiver conectado.'
            : vendas.erro.includes('app_not_installed')
              ? 'O app da Shopify ainda não está instalado na loja; as vendas aparecem quando instalar.'
              : `Não consegui ler as vendas da Shopify (${vendas.erro}).`}
        </Aviso>
      )}

      <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <Kpi titulo="Faturamento" valor={v ? brl(v.faturamento) : '—'} detalhe={v ? `${num(v.pedidos)} pedidos` : 'Shopify'} destaque />
        <Kpi titulo="Ticket médio" valor={v ? brl(v.ticket) : '—'} detalhe={v ? `${num(v.novos)} de clientes novos` : 'Shopify'} />
        <Kpi titulo="Visitantes" valor={m ? num(m.visitantes) : '—'} detalhe={m ? `${num(m.visualizacoes)} páginas vistas` : 'loja nova'} />
        <Kpi
          titulo="Conversão"
          valor={m && v ? pct(v.pedidos, m.sessoes) : '—'}
          detalhe={m ? `${num(m.sessoes)} visitas` : 'pedidos ÷ visitas'}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card titulo="Faturamento por dia">
          {v ? <BarrasPorDia dias={diasDoPeriodo} valores={diasDoPeriodo.map((d) => v.porDia.get(d) ?? 0)} formato="brl" /> : <Vazio />}
        </Card>
        <Card titulo="Visitantes por dia">
          {m ? <BarrasPorDia dias={diasDoPeriodo} valores={diasDoPeriodo.map((d) => visitasPorDia.get(d) ?? 0)} formato="num" cor="cyan" /> : <Vazio />}
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card titulo="Funil de compra" className="lg:col-span-2">
          {m ? (
            <Funil
              etapas={[
                { nome: 'Visitas', total: m.funil.visitas },
                { nome: 'Viram um produto', total: m.funil.produto },
                { nome: 'Colocaram no carrinho', total: m.funil.carrinho },
                { nome: 'Foram para o checkout', total: m.funil.checkout },
                ...(v ? [{ nome: 'Compraram (Shopify)', total: v.pedidos }] : []),
              ]}
            />
          ) : (
            <Vazio />
          )}
        </Card>
        <Card titulo="De onde vêm as visitas">{m ? <Lista itens={m.origens} /> : <Vazio />}</Card>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card titulo="Produtos mais vendidos">
          {v ? <Lista itens={v.produtos} sufixo=" un." /> : <Vazio />}
        </Card>
        <Card titulo="Produtos mais vistos">
          {m ? <Lista itens={m.produtos.map((p) => ({ nome: prettyTitle(p.nome), total: p.vistos, extra: `${num(p.carrinho)} no carrinho` }))} /> : <Vazio />}
        </Card>
        <Card titulo="Páginas mais vistas">{m ? <Lista itens={m.paginas} /> : <Vazio />}</Card>
        <Card titulo="Vendas por estado">{v ? <Lista itens={v.estados} sufixo=" pedidos" /> : <Vazio />}</Card>
        <Card titulo="Visitas por estado">{m ? <Lista itens={m.estados} /> : <Vazio />}</Card>
        <Card titulo="Celular × computador">{m ? <Lista itens={m.dispositivos} /> : <Vazio />}</Card>
        {v && (
          <Card titulo="Vendas por canal">
            <Lista itens={v.canais} sufixo=" pedidos" />
            {(v.cancelados > 0 || v.pendentes > 0) && (
              <p className="mt-3 text-xs text-muted">
                {num(v.pendentes)} aguardando pagamento · {num(v.cancelados)} cancelados (fora dos totais)
              </p>
            )}
          </Card>
        )}
      </div>

      <p className="mt-8 text-xs text-muted">
        Vendas: todos os pedidos da Shopify no período (site antigo e loja nova). Acessos: só a loja nova, contados desde que o
        painel foi ligado. Horário de Brasília.
      </p>
    </div>
  )
}

function Kpi({ titulo, valor, detalhe, destaque }: { titulo: string; valor: string; detalhe: string; destaque?: boolean }) {
  return (
    <div className={`rounded-card p-5 shadow-soft ${destaque ? 'bg-navy text-white' : 'bg-white'}`}>
      <p className={`text-sm font-semibold ${destaque ? 'text-cyan' : 'text-muted'}`}>{titulo}</p>
      <p className="mt-2 font-display text-2xl font-bold md:text-3xl">{valor}</p>
      <p className={`mt-1 text-xs ${destaque ? 'text-white/70' : 'text-muted'}`}>{detalhe}</p>
    </div>
  )
}

function Card({ titulo, children, className = '' }: { titulo: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-card bg-white p-5 shadow-soft md:p-6 ${className}`}>
      <h2 className="mb-4 font-display text-lg font-semibold text-navy">{titulo}</h2>
      {children}
    </section>
  )
}

function Aviso({ children }: { children: React.ReactNode }) {
  return <p className="mt-4 rounded-2xl bg-ice px-4 py-3 text-sm text-navy">{children}</p>
}

function Vazio() {
  return <p className="py-6 text-center text-sm text-muted">Sem dados ainda.</p>
}
