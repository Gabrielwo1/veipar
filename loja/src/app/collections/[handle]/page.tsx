import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { PatentStrip } from '@/components/home/patent-banner'
import { ProductGrid } from '@/components/product-grid'
import { COLLECTION_BANNERS } from '@/lib/brand'
import { getCollection, getCollections } from '@/lib/shopify'

// Mesmas URLs da loja atual (/collections/...), para os links antigos continuarem valendo.
export async function generateStaticParams() {
  const collections = await getCollections()
  return collections.map((c) => ({ handle: c.handle }))
}

const TITLES: Record<string, { title: string; text: string }> = {
  'colecao-veipar': { title: 'Todos os produtos', text: 'Protetores, kits com PU e acessórios Veipar.' },
  veipar: { title: 'Protetores de parafuso', text: 'Natural, colorido e ondulado. Do pacote de 100 ao de 2.500 peças.' },
  combos: { title: 'Kits com PU', text: 'Protetor + PU 40 + bico injetor: tudo para instalar de uma vez.' },
  'acessorios-auxiliar': { title: 'Acessórios', text: 'O bico injetor patenteado que rosqueia direto na bisnaga de PU.' },
}

export async function generateMetadata({ params }: PageProps<'/collections/[handle]'>): Promise<Metadata> {
  const { handle } = await params
  return { title: TITLES[handle]?.title ?? 'Produtos' }
}

async function CollectionContent({ params }: Pick<PageProps<'/collections/[handle]'>, 'params'>) {
  const { handle } = await params
  const [collection, collections] = await Promise.all([getCollection(handle), getCollections()])
  if (!collection) notFound()
  const copy = TITLES[handle] ?? { title: collection.title, text: collection.description }

  return (
    <>
      <section className="relative overflow-hidden bg-navy text-white">
        <Image src={COLLECTION_BANNERS[handle] ?? '/img/gen/hero.jpg'} alt="" fill priority sizes="100vw" className="object-cover opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/70 to-transparent" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 md:py-24">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan">Loja oficial Veipar</p>
          <h1 className="mt-2 font-display text-4xl font-extrabold md:text-6xl">{copy.title}</h1>
          {copy.text && <p className="mt-3 max-w-lg text-white/75">{copy.text}</p>}
          <p className="mt-4 text-sm text-white/60">{collection.products.nodes.length} produtos</p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4">
        <nav className="no-scrollbar -mt-6 flex gap-2 overflow-x-auto pb-2" aria-label="Coleções">
          {collections.map((c) => (
            <Link
              key={c.handle}
              href={`/collections/${c.handle}`}
              className={`relative shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold shadow-soft transition ${
                c.handle === handle ? 'bg-royal text-white' : 'bg-white hover:text-royal'
              }`}
            >
              {TITLES[c.handle]?.title ?? c.title}
            </Link>
          ))}
        </nav>
        <div className="mt-8">
          <ProductGrid products={collection.products.nodes} />
        </div>
        <div className="mt-12">
          <PatentStrip />
        </div>
      </div>
    </>
  )
}

export default function CollectionPage(props: PageProps<'/collections/[handle]'>) {
  return (
    <div className="pb-24">
      <Suspense fallback={<div className="h-72 animate-pulse bg-navy" />}>
        <CollectionContent params={props.params} />
      </Suspense>
    </div>
  )
}
