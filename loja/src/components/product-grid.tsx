import Image from 'next/image'
import Link from 'next/link'
import { piecesFromTitle } from '@/lib/brand'
import { formatMoney, type ProductCard } from '@/lib/shopify'
import { QuickAddButton } from './quick-add-button'
import { Reveal } from './ui/reveal'

// Títulos da Shopify vêm em CAIXA ALTA; no card fica mais leve em formato de frase.
export function prettyTitle(title: string) {
  const t = title.replace(/\s+/g, ' ').replace(/\s-\s/g, ' · ').trim()
  const letters = t.replace(/[^a-zà-ú]/gi, '')
  const upper = letters.replace(/[^A-ZÀ-Ú]/g, '')
  if (upper.length < letters.length * 0.7) return t
  return (t.charAt(0) + t.slice(1).toLowerCase()).replace(/\bpu ?40\b/g, 'PU 40').replace(/\bveipar\b/g, 'Veipar')
}

export function ProductCardView({ product, index = 0 }: { product: ProductCard; index?: number }) {
  const price = product.priceRange.minVariantPrice
  const compare = product.compareAtPriceRange.maxVariantPrice
  const onSale = Number(compare.amount) > Number(price.amount)
  const pieces = piecesFromTitle(product.title)
  // Kit leva PU e bico junto: preço por peça ali enganaria.
  const perPiece = pieces && pieces >= 100 && !/kit/i.test(product.title) ? Number(price.amount) / pieces : null
  const firstVariant = product.variants.nodes[0]
  const hasOptions = product.variants.nodes.length > 1

  return (
    <Reveal delay={Math.min(index, 6) * 0.06} className="h-full">
      <div className="group relative flex h-full flex-col rounded-[var(--radius-card)] bg-surface p-3 shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-lift">
        <Link href={`/products/${product.handle}`} className="relative block aspect-square overflow-hidden rounded-[1.1rem] bg-ice">
          {product.featuredImage && (
            <Image
              src={product.featuredImage.url}
              alt={product.featuredImage.altText || product.title}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
              className="object-cover transition duration-500 group-hover:scale-105"
            />
          )}
          {onSale && (
            <span className="absolute right-2 top-2 rounded-full bg-danger px-2.5 py-1 text-[11px] font-bold text-white">Oferta</span>
          )}
        </Link>

        <div className="flex flex-1 flex-col px-1.5 pb-1 pt-3">
          <Link href={`/products/${product.handle}`} className="line-clamp-2 text-[13px] font-semibold leading-snug sm:text-sm">
            {prettyTitle(product.title)}
          </Link>
          <div className="mt-auto flex items-end justify-between gap-2 pt-3">
            <div>
              {onSale && <p className="text-xs text-muted line-through">{formatMoney(compare)}</p>}
              <p className="font-display text-lg font-bold text-royal sm:text-xl">{formatMoney(price)}</p>
              {perPiece && (
                <p className="text-[11px] font-medium text-muted">
                  {formatMoney({ amount: String(perPiece), currencyCode: price.currencyCode })}/peça
                </p>
              )}
            </div>
            {firstVariant && (
              <QuickAddButton
                variantId={firstVariant.id}
                price={price.amount}
                disabled={!product.availableForSale}
                href={hasOptions ? `/products/${product.handle}` : undefined}
              />
            )}
          </div>
        </div>
      </div>
    </Reveal>
  )
}

export function ProductGrid({ products }: { products: ProductCard[] }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
      {products.map((p, i) => (
        <li key={p.handle}>
          <ProductCardView product={p} index={i} />
        </li>
      ))}
    </ul>
  )
}
