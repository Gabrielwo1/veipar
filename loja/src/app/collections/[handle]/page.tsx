import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { ProductGrid } from '@/components/product-grid'
import { getCollection, getCollections } from '@/lib/shopify'

// Mesmas URLs da loja atual (/collections/...), para os links antigos continuarem valendo.
export async function generateStaticParams() {
  const collections = await getCollections()
  return collections.map((c) => ({ handle: c.handle }))
}

async function CollectionContent({ params }: Pick<PageProps<'/collections/[handle]'>, 'params'>) {
  const { handle } = await params
  const collection = await getCollection(handle)
  if (!collection) notFound()

  return (
    <>
      <h1 className="mb-2 text-3xl font-bold">{collection.title}</h1>
      {collection.description && <p className="mb-6 max-w-2xl text-muted">{collection.description}</p>}
      <div className="mt-6">
        <ProductGrid products={collection.products.nodes} />
      </div>
    </>
  )
}

export default function CollectionPage(props: PageProps<'/collections/[handle]'>) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Suspense fallback={<p className="text-muted">Carregando…</p>}>
        <CollectionContent params={props.params} />
      </Suspense>
    </div>
  )
}
