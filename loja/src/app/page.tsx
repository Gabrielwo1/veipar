import Link from 'next/link'
import { ProductGrid } from '@/components/product-grid'
import { getProducts } from '@/lib/shopify'

export default async function Home() {
  const products = await getProducts()

  return (
    <>
      <section className="bg-foreground text-white">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
          <p className="text-sm font-semibold uppercase tracking-widest text-orange-300">Aço Galvalume AZ 150</p>
          <h1 className="mt-3 max-w-2xl text-3xl font-extrabold leading-tight md:text-5xl">
            Chega de goteira no parafuso da telha.
          </h1>
          <p className="mt-4 max-w-xl text-white/75">
            O protetor Veipar veda o ponto de fixação, protege a borracha do sol e evita ferrugem.
            Encaixa sem ferramenta.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/collections/colecao-veipar" className="rounded-lg bg-brand px-5 py-3 font-semibold hover:bg-brand-dark">
              Ver protetores
            </Link>
            <Link href="/collections/combos" className="rounded-lg border border-white/30 px-5 py-3 font-semibold hover:bg-white/10">
              Kits com PU
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="mb-6 text-2xl font-bold">Mais vendidos</h2>
        <ProductGrid products={products} />
      </section>
    </>
  )
}
