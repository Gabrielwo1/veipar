import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { AddToCart } from '@/components/add-to-cart'
import { TrackViewContent } from '@/components/meta-pixel'
import { HowTo } from '@/components/home/how-to'
import { PatentStrip } from '@/components/home/patent-banner'
import { SectionTitle } from '@/components/home/section-title'
import { ProductGallery } from '@/components/product-gallery'
import { ProductGrid, prettyTitle } from '@/components/product-grid'
import { IconPatent, IconShield, IconTruck } from '@/components/ui/icons'
import { piecesFromTitle } from '@/lib/brand'
import { contentId } from '@/lib/pixel'
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
    title: product.seo.title || prettyTitle(product.title),
    description: product.seo.description || product.description.slice(0, 160),
    openGraph: product.featuredImage ? { images: [product.featuredImage.url] } : undefined,
  }
}

async function ProductDetails({ params }: Pick<PageProps<'/products/[handle]'>, 'params'>) {
  const { handle } = await params
  const [product, all] = await Promise.all([getProduct(handle), getProducts()])
  if (!product) notFound()

  const pieces = piecesFromTitle(product.title)
  const related = all.filter((p) => p.handle !== product.handle).slice(0, 4)

  return (
    <>
      <TrackViewContent
        variantId={contentId(product.variants.nodes[0].id)}
        name={product.title}
        value={Number(product.priceRange.minVariantPrice.amount)}
      />
      <nav className="mb-6 text-sm text-muted" aria-label="Você está em">
        <Link href="/" className="hover:text-royal">Início</Link>
        <span className="mx-2">/</span>
        <Link href="/collections/colecao-veipar" className="hover:text-royal">Produtos</Link>
      </nav>

      <div className="grid gap-10 md:grid-cols-2 lg:gap-16">
        <ProductGallery images={product.images.nodes} title={product.title} />

        <div>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-navy px-3 py-1 text-xs font-semibold text-white">
              <IconPatent className="h-4 w-4 text-cyan" /> Patenteado
            </span>
            <span className="rounded-full bg-ice px-3 py-1 text-xs font-semibold text-royal">100% original Veipar</span>
          </div>
          <h1 className="mt-4 font-display text-3xl font-bold leading-tight md:text-4xl">{prettyTitle(product.title)}</h1>

          <AddToCart name={product.title} options={product.options} variants={product.variants.nodes} pieces={pieces && !/kit/i.test(product.title) ? pieces : null} />

          <ul className="mt-6 grid grid-cols-3 gap-2 text-center text-xs">
            {[
              { icon: IconShield, text: 'Galvalume AZ 150' },
              { icon: IconTruck, text: 'Envio para todo o Brasil' },
              { icon: IconPatent, text: 'Registrado no INPI' },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex flex-col items-center gap-1.5 rounded-2xl bg-white p-3 shadow-soft">
                <Icon className="h-6 w-6 text-royal" />
                <span className="font-medium">{text}</span>
              </li>
            ))}
          </ul>

          <div className="mt-6">
            <PatentStrip />
          </div>

          <details open className="group mt-6 rounded-[var(--radius-card)] bg-white p-6 shadow-soft">
            <summary className="cursor-pointer list-none font-display text-xl font-bold">Descrição do produto</summary>
            <div className="rich-text mt-2 text-[15px]" dangerouslySetInnerHTML={{ __html: product.descriptionHtml }} />
          </details>
        </div>
      </div>

      <div className="-mx-4">
        <HowTo />
      </div>

      {related.length > 0 && (
        <section className="pt-24">
          <SectionTitle eyebrow="Complete sua compra" title="Você também pode gostar" />
          <div className="mt-8">
            <ProductGrid products={related} />
          </div>
        </section>
      )}
    </>
  )
}

export default function ProductPage(props: PageProps<'/products/[handle]'>) {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-28 pt-8 md:pb-24">
      <Suspense fallback={<div className="h-[70vh] animate-pulse rounded-[2rem] bg-white" />}>
        <ProductDetails params={props.params} />
      </Suspense>
    </div>
  )
}
