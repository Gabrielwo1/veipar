import { useMemo, useState } from 'react';
import { MapPin } from 'lucide-react';
import { Card } from '@/components/ui/card';
import type { Contact } from '@/lib/api';
import { DDDS, MAP_SIZE, STATES } from '@/lib/brasil-mapa';
import { dddOf } from '@/lib/ddd';
import { int, plural } from '@/lib/format';
import { isLead } from '@/lib/metrics';
import { cn } from '@/lib/utils';

interface Props {
  contacts: Contact[];
  periodLabel: string;
}

/** Mapa de calor dos contatos por DDD, com os estados coloridos pelo total. */
export function BrazilMap({ contacts, periodLabel }: Props) {
  const [hover, setHover] = useState<string | null>(null);

  const { byDdd, byUf, total, foreign } = useMemo(() => {
    const byDdd = new Map<string, number>();
    const byUf = new Map<string, number>();
    let total = 0, foreign = 0;
    for (const c of contacts) {
      if (!isLead(c)) continue;
      const ddd = dddOf(c.wa_id);
      if (!ddd) { foreign++; continue; }
      total++;
      byDdd.set(ddd, (byDdd.get(ddd) ?? 0) + 1);
      const uf = DDDS[ddd]!.uf;
      byUf.set(uf, (byUf.get(uf) ?? 0) + 1);
    }
    return { byDdd, byUf, total, foreign };
  }, [contacts]);

  const ranking = [...byDdd.entries()].sort((a, b) => b[1] - a[1]);
  const maxDdd = ranking[0]?.[1] ?? 0;
  const maxUf = Math.max(0, ...byUf.values());
  const hovered = hover ? { ...DDDS[hover]!, ddd: hover, n: byDdd.get(hover) ?? 0 } : null;

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b px-5 py-4">
        <div>
          <h2 className="flex items-center gap-2 text-[15px] font-semibold"><MapPin className="size-4 text-brand" />De onde vêm os contatos</h2>
          <p className="text-sm text-muted-foreground">Mapa de calor por DDD · {periodLabel}</p>
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold tabular">{int(total)}</div>
          <div className="text-xs text-muted-foreground">
            {plural(byDdd.size, 'DDD', 'DDDs')} · {plural(byUf.size, 'estado', 'estados')}
          </div>
        </div>
      </div>

      <div className="grid gap-4 p-4 md:grid-cols-[minmax(0,1fr)_300px]">
        <div className="relative mx-auto w-full max-w-[520px]">
          <svg viewBox={`0 0 ${MAP_SIZE.width} ${MAP_SIZE.height}`} className="h-auto w-full" role="img" aria-label="Mapa do Brasil com contatos por DDD">
            <defs>
              <radialGradient id="heat">
                <stop offset="0%" stopColor="var(--brand)" stopOpacity={0.75} />
                <stop offset="45%" stopColor="var(--brand)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--brand)" stopOpacity={0} />
              </radialGradient>
              {/* Regiões mais frequentes: centro quente (vermelho → laranja → azul da marca). */}
              <radialGradient id="heatHot">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.85} />
                <stop offset="30%" stopColor="#f59e0b" stopOpacity={0.6} />
                <stop offset="65%" stopColor="var(--brand)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="var(--brand)" stopOpacity={0} />
              </radialGradient>
            </defs>
            {STATES.map((s) => {
              const n = byUf.get(s.uf) ?? 0;
              return (
                <path key={s.uf} d={s.d} stroke="var(--card)" strokeWidth={1.2}
                  fill={n ? 'var(--brand)' : 'var(--muted)'} fillOpacity={n ? 0.1 + 0.35 * (n / maxUf) : 1}>
                  <title>{s.uf}: {plural(n, 'contato', 'contatos')}</title>
                </path>
              );
            })}
            {ranking.map(([ddd, n]) => {
              const p = DDDS[ddd]!;
              const hot = n / maxDdd >= 0.5;
              return <circle key={`h${ddd}`} cx={p.x} cy={p.y} r={14 + 34 * Math.sqrt(n / maxDdd)} fill={hot ? 'url(#heatHot)' : 'url(#heat)'} pointerEvents="none" />;
            })}
            {ranking.map(([ddd, n]) => {
              const p = DDDS[ddd]!;
              return (
                <circle key={`p${ddd}`} cx={p.x} cy={p.y} r={hover === ddd ? 6 : 3.5 + 2.5 * Math.sqrt(n / maxDdd)}
                  className="cursor-pointer fill-brand-deep stroke-white" strokeWidth={1.5}
                  onMouseEnter={() => setHover(ddd)} onMouseLeave={() => setHover(null)}>
                  <title>DDD {ddd} · {p.city}/{p.uf}: {plural(n, 'contato', 'contatos')}</title>
                </circle>
              );
            })}
          </svg>
          {hovered && (
            <div className="pointer-events-none absolute left-2 top-2 rounded-lg border bg-white/95 px-3 py-2 text-xs shadow-sm">
              <div className="font-semibold">DDD {hovered.ddd} · {hovered.city}/{hovered.uf}</div>
              <div className="text-muted-foreground">{plural(hovered.n, 'contato', 'contatos')}</div>
            </div>
          )}
          {total === 0 && (
            <div className="absolute inset-0 grid place-items-center text-sm text-muted-foreground">Nenhum contato com DDD no período</div>
          )}
        </div>

        <div className="flex flex-col">
          <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">DDDs que mais chamam</div>
          <div className="mb-3 flex items-center gap-2 text-[11px] text-muted-foreground">
            menos
            <span className="h-2 flex-1 rounded-full bg-gradient-to-r from-brand/20 via-brand via-60% to-[#ef4444]" />
            mais
          </div>
          <ol className="space-y-1.5">
            {ranking.slice(0, 10).map(([ddd, n], i) => {
              const p = DDDS[ddd]!;
              return (
                <li key={ddd}
                  onMouseEnter={() => setHover(ddd)} onMouseLeave={() => setHover(null)}
                  className={cn('rounded-lg px-2 py-1.5', hover === ddd && 'bg-brand-soft/70')}>
                  <div className="flex items-baseline justify-between gap-2 text-sm">
                    <span className="truncate">
                      <span className="mr-1.5 text-xs text-muted-foreground tabular">{i + 1}.</span>
                      <b className="tabular">{ddd}</b> <span className="text-muted-foreground">{p.city}/{p.uf}</span>
                    </span>
                    <span className="shrink-0 font-semibold tabular">{int(n)} <span className="text-xs font-normal text-muted-foreground">{Math.round((n / total) * 100)}%</span></span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-brand" style={{ width: `${(n / maxDdd) * 100}%` }} />
                  </div>
                </li>
              );
            })}
          </ol>
          {ranking.length === 0 && <p className="text-sm text-muted-foreground">Sem dados no período.</p>}
          {foreign > 0 && <p className="mt-auto pt-3 text-xs text-muted-foreground">+ {plural(foreign, 'contato de fora do Brasil', 'contatos de fora do Brasil')}</p>}
        </div>
      </div>
    </Card>
  );
}
