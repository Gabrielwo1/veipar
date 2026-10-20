import type { ReactNode } from 'react';
import { Area, AreaChart } from 'recharts';
import { ArrowDownRight, ArrowUpRight, Clock, HandCoins, Megaphone, MessageCircle, Receipt, ShoppingBag, Target, Timer, Users } from 'lucide-react';
import { brand } from '@/brand';
import { Card } from '@/components/ui/card';
import { ChartContainer } from '@/components/ui/chart';
import { cn } from '@/lib/utils';
import { brl, fmtDuration, int, plural } from '@/lib/format';
import { delta, type Dashboard, type Period } from '@/lib/metrics';

const PREV_LABEL: Record<Period, string> = { 1: 'ontem', 7: '7 dias anteriores', 30: '30 dias anteriores', 90: '90 dias anteriores' };

function Delta({ value, inverse = false, dark = false }: { value: number | null; inverse?: boolean; dark?: boolean }) {
  if (value == null) return null;
  const up = value >= 0;
  const good = inverse ? !up : up;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-semibold tabular',
        dark ? (good ? 'bg-brand/20 text-[#7ee2a6]' : 'bg-white/10 text-[#ffb4a8]')
             : good ? 'bg-brand-soft text-brand-deep' : 'bg-[#fdecea] text-destructive',
      )}
    >
      <Icon className="size-3" />
      {Math.abs(Math.round(value * 100))}%
    </span>
  );
}

function Kpi({ icon, label, value, hint, extra }: { icon: ReactNode; label: string; value: string; hint?: ReactNode; extra?: ReactNode }) {
  return (
    <Card className="gap-0 p-4 transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-[13px] font-medium">{label}</span>
        <span className="grid size-7 place-items-center rounded-lg bg-muted text-graphite [&_svg]:size-3.5">{icon}</span>
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-semibold tracking-tight tabular">{value}</span>
        {extra}
      </div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </Card>
  );
}

export function KpiCards({ d, period }: { d: Dashboard; period: Period }) {
  const { cur, prev } = d;
  const adShare = cur.revenue ? Math.round((cur.adRevenue / cur.revenue) * 100) : 0;
  const ticket = cur.salesCount ? cur.revenue / cur.salesCount : 0;
  const prevTicket = prev.salesCount ? prev.revenue / prev.salesCount : 0;
  const conv = d.contacts.length ? cur.buyers / d.contacts.length : null;
  const { label: profitLabel, rate } = brand.profit;
  const pct = `${(rate * 100).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`;
  const profitLine = d.timeline.map((t) => ({ lucro: t.receita * rate }));

  return (
    <section className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
      {/* Destaque: faturamento */}
      <Card className="relative col-span-2 row-span-2 gap-0 overflow-hidden border-0 bg-primary p-5 text-primary-foreground shadow-lg shadow-black/10">
        <div className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-brand/25 blur-3xl" />
        <div className="relative flex items-center justify-between">
          <span className="text-sm font-medium text-white/70">Faturamento no período</span>
          <span className="grid size-8 place-items-center rounded-lg bg-white/10"><Receipt className="size-4" /></span>
        </div>
        <div className="relative mt-3 flex flex-wrap items-baseline gap-3">
          <span className="text-4xl font-semibold tracking-tight tabular">{brl(cur.revenue)}</span>
          <Delta value={delta(cur.revenue, prev.revenue)} dark />
        </div>
        <div className="relative mt-1 text-sm text-white/60">
          {cur.revenue ? `${adShare}% vindo de anúncio` : 'nenhuma venda lançada no período'} · vs. {PREV_LABEL[period]}
        </div>
        <ChartContainer config={{ receita: { label: 'Receita', color: 'var(--brand)' } }} className="relative -mx-5 -mb-5 mt-auto h-24 w-[calc(100%+2.5rem)] pt-4">
          <AreaChart data={d.timeline} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="heroFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--brand)" stopOpacity={0.55} />
                <stop offset="100%" stopColor="var(--brand)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area dataKey="receita" type="monotone" stroke="var(--brand)" strokeWidth={2} fill="url(#heroFill)" isAnimationActive={false} />
          </AreaChart>
        </ChartContainer>
      </Card>

      {/* Destaque: nosso lucro (% do faturamento) */}
      <Card className="relative col-span-2 row-span-2 gap-0 overflow-hidden border-0 bg-gradient-to-br from-brand-deep to-[#06527f] p-5 text-white shadow-lg shadow-brand/20">
        <div className="pointer-events-none absolute -bottom-20 -left-10 size-56 rounded-full bg-white/10 blur-3xl" />
        <div className="relative flex items-center justify-between">
          <span className="text-sm font-medium text-white/80">{profitLabel}</span>
          <span className="grid size-8 place-items-center rounded-lg bg-white/15"><HandCoins className="size-4" /></span>
        </div>
        <div className="relative mt-3 flex flex-wrap items-baseline gap-3">
          <span className="text-4xl font-semibold tracking-tight tabular">{brl(cur.revenue * rate)}</span>
          <Delta value={delta(cur.revenue, prev.revenue)} dark />
        </div>
        <div className="relative mt-1 text-sm text-white/75">
          {pct} do faturamento de {brl(cur.revenue)} · vs. {PREV_LABEL[period]}
        </div>
        <ChartContainer config={{ lucro: { label: profitLabel, color: '#ffffff' } }} className="relative -mx-5 -mb-5 mt-auto h-24 w-[calc(100%+2.5rem)] pt-4">
          <AreaChart data={profitLine} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="profitFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffffff" stopOpacity={0.45} />
                <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area dataKey="lucro" type="monotone" stroke="#ffffff" strokeWidth={2} fill="url(#profitFill)" isAnimationActive={false} />
          </AreaChart>
        </ChartContainer>
      </Card>

      <Kpi icon={<ShoppingBag />} label="Vendas" value={int(cur.salesCount)} extra={<Delta value={delta(cur.salesCount, prev.salesCount)} />}
        hint={plural(cur.buyers, 'cliente comprou', 'clientes compraram')} />
      <Kpi icon={<Receipt />} label="Ticket médio" value={ticket ? brl(ticket) : '—'} extra={<Delta value={ticket && prevTicket ? delta(ticket, prevTicket) : null} />}
        hint="por venda" />
      <Kpi icon={<Target />} label="Conversão" value={conv == null ? '—' : `${Math.round(conv * 100)}%`} hint="contatos que compraram" />
      <Kpi icon={<Users />} label="Novos contatos" value={int(cur.newContacts)} extra={<Delta value={delta(cur.newContacts, prev.newContacts)} />}
        hint={`${int(d.contacts.length)} ativos no período`} />
      <Kpi icon={<MessageCircle />} label="Mensagens" value={int(d.messages)} hint="dos contatos ativos" />
      <Kpi icon={<Megaphone />} label="Via anúncio" value={int(d.adContacts)} hint="novos contatos de Click-to-WhatsApp" />
      <Kpi icon={<Clock />} label="Aguardando" value={int(d.waiting)} hint="sem resposta · últimos 7 dias" />
      <Kpi icon={<Timer />} label="1ª resposta" value={fmtDuration(d.medianReply)} hint="tempo mediano" />
    </section>
  );
}
