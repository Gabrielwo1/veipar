import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { AddToCart } from '@/components/add-to-cart'
import { getProduct, getProducts } from '@/lib/shopify'

// Mesmas URLs da loja atual (/products/...): os links que a IA manda no WhatsApp continuam abrindo.
export async function generateStaticParams() {
  const products = await getProducts()
  return products.map((p) => ({ handle: p.handle }))
}

export async function generateMetadata({ params }: PageProps<'/products/[handle]'>): Promise<Metadata> {
  const { handle } = await params
  const product = await getProduct(handle)
  if (!product) return {}
  return {
    title: product.seo.title || product.title,
    description: product.seo.description || product.description.slice(0, 160),
    openGraph: product.featuredImage ? { images: [product.featuredImage.url] } : undefined,
  }
}

async function ProductDetails({ params }: Pick<PageProps<'/products/[handle]'>, 'params'>) {
  const { handle } = await params
  const product = await getProduct(handle)
  if (!product) notFound()

  const [main, ...rest] = product.images.nodes

  return (
    <div className="grid gap-10 md:grid-cols-2">
      <div className="space-y-3">
        {main && (
          <div className="relative aspect-square overflow-hidden rounded-xl border border-border bg-surface">
            <Image
              src={main.url}
              alt={main.altText || product.title}
              fill
              priority
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
        )}
        {rest.length > 0 && (
          <div className="grid grid-cols-4 gap-3">
            {rest.map((img) => (
              <div key={img.url} className="relative aspect-square overflow-hidden rounded-lg border border-border bg-surface">
                <Image src={img.url} alt={img.altText || product.title} fill sizes="12vw" className="object-cover" />
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h1 className="text-2xl font-bold md:text-3xl">{product.title}</h1>
        <AddToCart options={product.options} variants={product.variants.nodes} />
        <div className="rich-text mt-10 border-t border-border pt-6 text-[15px]"
          dangerouslySetInnerHTML={{ __html: product.descriptionHtml }} />
      </div>
    </div>
  )
}

export default function ProductPage(props: PageProps<'/products/[handle]'>) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Suspense fallback={<p className="text-muted">Carregando…</p>}>
        <ProductDetails params={props.params} />
      </Suspense>
    </div>
  )
}
