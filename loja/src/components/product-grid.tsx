import Image from 'next/image'
import Link from 'next/link'
import { formatMoney, type ProductCard } from '@/lib/shopify'

export function ProductGrid({ products }: { products: ProductCard[] }) {
  return (
    <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => (
        <li key={p.handle}>
          <Link
            href={`/products/${p.handle}`}
            className="group block overflow-hidden rounded-xl border border-border bg-surface transition hover:shadow-md"
          >
            <div className="relative aspect-square bg-background">
              {p.featuredImage && (
                <Image
                  src={p.featuredImage.url}
                  alt={p.featuredImage.altText || p.title}
                  fill
                  sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                  className="object-cover transition group-hover:scale-[1.02]"
                />
              )}
            </div>
            <div className="p-3">
              <h3 className="line-clamp-3 text-xs font-medium sm:text-sm">{p.title}</h3>
              <p className="mt-1 font-semibold text-brand">
                {formatMoney(p.priceRange.minVariantPrice)}
              </p>
              {!p.availableForSale && <p className="text-xs text-muted">Esgotado</p>}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  )
}
