import type { ReactNode } from 'react';
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig,
} from '@/components/ui/chart';
import { brl, brlCompact, int, plural } from '@/lib/format';
import type { Dashboard, Period } from '@/lib/metrics';
import { cn } from '@/lib/utils';

const revenueConfig = { receita: { label: 'Faturamento', color: 'var(--chart-1)' } } satisfies ChartConfig;
const contactsConfig = {
  anuncio: { label: 'Anúncio', color: 'var(--chart-1)' },
  organico: { label: 'Orgânico', color: 'var(--chart-2)' },
} satisfies ChartConfig;
const originConfig = {
  receita: { label: 'Faturamento' },
  anuncio: { label: 'Anúncio', color: 'var(--chart-1)' },
  organico: { label: 'Orgânico', color: 'var(--chart-2)' },
} satisfies ChartConfig;
const hoursConfig = { contatos: { label: 'Contatos', color: 'var(--chart-2)' } } satisfies ChartConfig;

function ChartCard({ title, description, aside, className, children }: {
  title: string; description: string; aside?: ReactNode; className?: string; children: ReactNode;
}) {
  return (
    <Card className={cn('gap-2 py-4', className)}>
      <CardHeader className="flex flex-row items-start justify-between gap-3 px-4">
        <div className="min-w-0 space-y-0.5">
          <CardTitle className="text-sm">{title}</CardTitle>
          <CardDescription className="truncate text-xs">{description}</CardDescription>
        </div>
        {aside}
      </CardHeader>
      <CardContent className="px-2 sm:px-4">{children}</CardContent>
    </Card>
  );
}

function Empty({ show, children }: { show: boolean; children: ReactNode }) {
  if (!show) return null;
  return <div className="pointer-events-none absolute inset-0 grid place-items-center text-sm text-muted-foreground">{children}</div>;
}

export function Charts({ d, period }: { d: Dashboard; period: Period }) {
  const unit = period === 1 ? 'por hora, hoje' : 'por dia';
  const interval = period === 1 ? 2 : period <= 7 ? 0 : 'preserveStartEnd';
  const salesInPeriod = d.timeline.reduce((t, x) => t + x.vendas, 0);
  const newTotal = d.timeline.reduce((t, x) => t + x.anuncio + x.organico, 0);
  const originData = d.origin.map((o) => ({ ...o, fill: `var(--color-${o.key})` }));

  return (
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <ChartCard
        title="Faturamento" description={`Vendas lançadas, em R$ ${unit}`}
        aside={<div className="text-right"><div className="text-base font-semibold tabular">{brl(d.cur.revenue)}</div>
          <div className="text-xs text-muted-foreground">{plural(salesInPeriod, 'venda', 'vendas')}</div></div>}
      >
        <div className="relative">
          <ChartContainer config={revenueConfig} className="aspect-auto h-[140px] w-full">
            <BarChart data={d.timeline} margin={{ left: 4, right: 8, top: 8 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={6} minTickGap={16} interval={interval} tick={{ fontSize: 11 }} />
              <YAxis tickLine={false} axisLine={false} width={52} tickFormatter={brlCompact} tick={{ fontSize: 11 }} />
              <ChartTooltip
                cursor={{ fill: 'var(--muted)' }}
                content={<ChartTooltipContent
                  hideIndicator
                  labelFormatter={(_, p) => p?.[0]?.payload?.tip}
                  formatter={(v, _n, item) => (
                    <div className="flex w-full justify-between gap-4">
                      <span className="text-muted-foreground">{plural(item.payload.vendas, 'venda', 'vendas')}</span>
                      <span className="font-semibold tabular">{brl(Number(v))}</span>
                    </div>
                  )}
                />}
              />
              <Bar dataKey="receita" fill="var(--color-receita)" radius={[4, 4, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ChartContainer>
          <Empty show={!d.cur.revenue}>Nenhuma venda lançada no período</Empty>
        </div>
      </ChartCard>

      <ChartCard title="Faturamento por origem" description="Click-to-WhatsApp × orgânico">
        <ChartContainer config={originConfig} className="aspect-auto h-[84px] w-full">
          <BarChart data={originData} layout="vertical" margin={{ left: 0, right: 92 }} barCategoryGap={10}>
            <YAxis dataKey="origem" type="category" tickLine={false} axisLine={false} width={72} />
            <XAxis type="number" hide />
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel nameKey="key"
              formatter={(v, _n, item) => (
                <div className="flex w-full justify-between gap-4">
                  <span className="text-muted-foreground">{item.payload.origem} · {plural(item.payload.vendas, 'venda', 'vendas')}</span>
                  <span className="font-semibold tabular">{brl(Number(v))}</span>
                </div>
              )} />} />
            <Bar dataKey="receita" radius={4} minPointSize={2}>
              <LabelList dataKey="receita" position="right" offset={8} className="fill-foreground text-xs font-semibold" formatter={(v: unknown) => brl(Number(v))} />
            </Bar>
          </BarChart>
        </ChartContainer>
        <div className="mt-1 grid grid-cols-2 gap-2">
          {d.origin.map((o) => (
            <div key={o.key} className="rounded-lg border bg-muted/40 px-2.5 py-1.5">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="size-2 rounded-sm" style={{ background: `var(--chart-${o.key === 'anuncio' ? 1 : 2})` }} />{o.origem}
              </div>
              <div className="text-sm font-semibold tabular">{o.vendas ? brl(o.receita / o.vendas) : '—'}</div>
              <div className="text-[11px] text-muted-foreground">ticket médio · {plural(o.vendas, 'venda', 'vendas')}</div>
            </div>
          ))}
        </div>
      </ChartCard>

      <ChartCard title="Novos contatos" description={`Primeira mensagem ${unit}`}
        aside={<div className="text-right"><div className="text-base font-semibold tabular">{int(newTotal)}</div>
          <div className="text-xs text-muted-foreground">no período</div></div>}>
        <div className="relative">
          <ChartContainer config={contactsConfig} className="aspect-auto h-[140px] w-full">
            <BarChart data={d.timeline} margin={{ left: 4, right: 8, top: 8 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={6} minTickGap={16} interval={interval} tick={{ fontSize: 11 }} />
              <YAxis tickLine={false} axisLine={false} width={24} allowDecimals={false} tick={{ fontSize: 11 }} />
              <ChartTooltip cursor={{ fill: 'var(--muted)' }} content={<ChartTooltipContent labelFormatter={(_, p) => p?.[0]?.payload?.tip} />} />
              <Bar dataKey="organico" stackId="a" fill="var(--color-organico)" radius={[4, 4, 0, 0]} stroke="var(--card)" strokeWidth={1} maxBarSize={36} />
              <Bar dataKey="anuncio" stackId="a" fill="var(--color-anuncio)" radius={[4, 4, 0, 0]} stroke="var(--card)" strokeWidth={1} maxBarSize={36} />
            </BarChart>
          </ChartContainer>
          <Empty show={!newTotal}>Nenhum contato novo no período</Empty>
        </div>
      </ChartCard>

      <ChartCard title="Horário dos contatos" description="Novos contatos por hora do dia">
        <div className="relative">
          <ChartContainer config={hoursConfig} className="aspect-auto h-[140px] w-full">
            <BarChart data={d.hours} margin={{ left: 0, right: 4, top: 8 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="hora" tickLine={false} axisLine={false} tickMargin={6} interval={5} tick={{ fontSize: 11 }} />
              <YAxis tickLine={false} axisLine={false} width={24} allowDecimals={false} tick={{ fontSize: 11 }} />
              <ChartTooltip cursor={{ fill: 'var(--muted)' }} content={<ChartTooltipContent />} />
              <Bar dataKey="contatos" fill="var(--color-contatos)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
          <Empty show={!newTotal}>Sem contatos no período</Empty>
        </div>
      </ChartCard>
    </section>
  );
}
