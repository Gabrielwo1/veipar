import Image from 'next/image'
import Link from 'next/link'
import { piecesFromTitle } from '@/lib/brand'
import { formatMoney, type ProductCard } from '@/lib/shopify'
import { QuickAddButton } from '../quick-add-button'
import { Reveal } from '../ui/reveal'
import { SectionTitle } from './section-title'

// "Quanto mais, menos por peça": os pacotes do protetor natural lado a lado.
export function PriceLadder({ products }: { products: ProductCard[] }) {
  const tiers = products
    .map((p) => ({ p, pieces: piecesFromTitle(p.title) }))
    .filter((t): t is { p: ProductCard; pieces: number } =>
      !!t.pieces && !/kit|colorid|ondulad/i.test(t.p.title))
    .sort((a, b) => a.pieces - b.pieces)

  if (tiers.length < 2) return null
  const perPiece = (t: { p: ProductCard; pieces: number }) => Number(t.p.priceRange.minVariantPrice.amount) / t.pieces
  const base = perPiece(tiers[0])
  const cheapest = tiers.reduce((a, b) => (perPiece(b) < perPiece(a) ? b : a)).p.handle

  return (
    <section className="mx-auto max-w-7xl px-4 pt-24">
      <SectionTitle eyebrow="Para obra grande e revenda" title="Quanto mais, menos você paga por peça" />
      <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
        {tiers.map(({ p, pieces }, i) => {
          const price = p.priceRange.minVariantPrice
          const per = Number(price.amount) / pieces
          const save = Math.round((1 - per / base) * 100)
          const best = p.handle === cheapest
          return (
            <Reveal key={p.handle} delay={i * 0.08}>
              <div className={`relative flex h-full flex-col rounded-[var(--radius-card)] p-5 transition hover:-translate-y-1 ${
                best ? 'bg-navy text-white shadow-lift' : 'bg-surface shadow-soft'}`}>
                {best && (
                  <span className="absolute -top-3 left-5 rounded-full bg-cyan px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-navy">
                    Menor preço por peça
                  </span>
                )}
                <div className="relative mx-auto h-20 w-20">
                  {p.featuredImage && <Image src={p.featuredImage.url} alt="" fill sizes="80px" className="rounded-2xl object-cover" />}
                </div>
                <p className="mt-4 font-display text-4xl font-extrabold">{pieces.toLocaleString('pt-BR')}</p>
                <p className={`text-sm ${best ? 'text-white/60' : 'text-muted'}`}>peças</p>
                <p className={`mt-4 font-display text-2xl font-bold ${best ? 'text-cyan' : 'text-royal'}`}>{formatMoney(price)}</p>
                <p className={`text-xs ${best ? 'text-white/60' : 'text-muted'}`}>
                  {formatMoney({ amount: String(per), currencyCode: price.currencyCode })} por peça
                  {save > 0 && <span className="ml-1 font-semibold text-success">(−{save}%)</span>}
                </p>
                <div className="mt-auto flex items-center justify-between gap-2 pt-5">
                  <Link href={`/products/${p.handle}`} className={`text-sm font-semibold underline-offset-4 hover:underline ${best ? 'text-white' : ''}`}>
                    Ver detalhes
                  </Link>
                  {p.variants.nodes[0] && <QuickAddButton variantId={p.variants.nodes[0].id} price={price.amount} disabled={!p.availableForSale} />}
                </div>
              </div>
            </Reveal>
          )
        })}
      </div>
    </section>
  )
}
