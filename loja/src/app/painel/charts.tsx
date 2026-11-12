// Gráficos simples em HTML/CSS, sem biblioteca: barras por dia, funil e listas com barra.

const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
const num = (n: number) => n.toLocaleString('pt-BR')

export function BarrasPorDia({
  dias,
  valores,
  formato,
  cor = 'navy',
}: {
  dias: string[]
  valores: number[]
  formato: 'brl' | 'num'
  cor?: 'navy' | 'cyan'
}) {
  const max = Math.max(...valores, 1)
  const total = valores.reduce((s, v) => s + v, 0)
  const fmt = formato === 'brl' ? brl : num
  // Com muitos dias, só alguns rótulos no eixo.
  const passo = Math.ceil(dias.length / 8)
  if (total === 0) return <p className="py-6 text-center text-sm text-muted">Nada no período.</p>
  return (
    <div>
      <div className="flex h-44 items-end gap-[3px]">
        {valores.map((v, i) => (
          <div key={dias[i]} className="group relative flex h-full flex-1 items-end">
            <div
              className={`w-full rounded-t-md ${cor === 'cyan' ? 'bg-cyan' : 'bg-navy'} transition group-hover:opacity-80`}
              style={{ height: `${Math.max((v / max) * 100, v > 0 ? 3 : 0)}%` }}
            />
            <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 whitespace-nowrap rounded-lg bg-foreground px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100">
              {dias[i].slice(8, 10)}/{dias[i].slice(5, 7)} · {fmt(v)}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-[3px] text-[10px] text-muted">
        {dias.map((d, i) => (
          <span key={d} className="flex-1 text-center">
            {i % passo === 0 ? `${d.slice(8, 10)}/${d.slice(5, 7)}` : ''}
          </span>
        ))}
      </div>
    </div>
  )
}

export function Funil({ etapas }: { etapas: { nome: string; total: number }[] }) {
  const topo = Math.max(etapas[0]?.total ?? 0, 1)
  return (
    <ol className="space-y-3">
      {etapas.map((e, i) => {
        const anterior = i > 0 ? etapas[i - 1].total : null
        return (
          <li key={e.nome}>
            <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
              <span className="font-semibold text-navy">{e.nome}</span>
              <span className="text-muted">
                <b className="text-foreground">{num(e.total)}</b>
                {anterior !== null && anterior > 0 && ` · ${((e.total / anterior) * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}% da etapa anterior`}
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-ice">
              <div className="h-full rounded-full bg-gradient-to-r from-royal to-cyan" style={{ width: `${(e.total / topo) * 100}%` }} />
            </div>
          </li>
        )
      })}
    </ol>
  )
}

export function Lista({ itens, sufixo = '' }: { itens: { nome: string; total: number; extra?: string }[]; sufixo?: string }) {
  if (itens.length === 0) return <p className="py-6 text-center text-sm text-muted">Nada no período.</p>
  const max = Math.max(...itens.map((i) => i.total), 1)
  return (
    <ul className="space-y-2.5">
      {itens.map((i) => (
        <li key={i.nome}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate" title={i.nome}>
              {i.nome}
            </span>
            <span className="shrink-0 font-semibold text-navy">
              {num(i.total)}
              {sufixo}
            </span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ice">
            <div className="h-full rounded-full bg-cyan" style={{ width: `${(i.total / max) * 100}%` }} />
          </div>
          {i.extra && <p className="mt-0.5 text-xs text-muted">{i.extra}</p>}
        </li>
      ))}
    </ul>
  )
}
