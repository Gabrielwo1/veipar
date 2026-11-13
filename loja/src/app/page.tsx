import Link from 'next/link'
import { Categories } from '@/components/home/categories'
import { Faq } from '@/components/home/faq'
import { FounderTeaser } from '@/components/home/founder-teaser'
import { Hero } from '@/components/home/hero'
import { HowTo } from '@/components/home/how-to'
import { InstagramReels } from '@/components/home/instagram-reels'
import { PatentBanner } from '@/components/home/patent-banner'
import { PriceLadder } from '@/components/home/price-ladder'
import { ProblemSolution } from '@/components/home/problem-solution'
import { SectionTitle } from '@/components/home/section-title'
import { TrustBar } from '@/components/home/trust-bar'
import { ProductGrid } from '@/components/product-grid'
import { IconArrow } from '@/components/ui/icons'
import { getProducts } from '@/lib/shopify'

export default async function Home() {
  const products = await getProducts()

  return (
    <>
      <Hero />
      <TrustBar />
      <Categories />

      <section className="mx-auto max-w-7xl px-4 pt-24">
        <SectionTitle
          eyebrow="Loja oficial"
          title="Mais vendidos"
          action={
            <Link href="/collections/colecao-veipar" className="inline-flex items-center gap-1 font-semibold text-royal hover:gap-2">
              Ver tudo <IconArrow className="h-5 w-5" />
            </Link>
          }
        />
        <div className="mt-8">
          <ProductGrid products={products.slice(0, 8)} />
        </div>
      </section>

      <ProblemSolution />
      <HowTo />
      <PatentBanner />
      <PriceLadder products={products} />
      <InstagramReels />
      <FounderTeaser />
      <Faq />
      <div className="h-24" />
    </>
  )
}
