import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPolicies } from '@/lib/shopify'

// Mesmo endereço das políticas no tema antigo (/policies/refund-policy etc.), com o texto
// que está cadastrado na Shopify.
const TITULOS: Record<string, string> = {
  'privacy-policy': 'Política de privacidade',
  'refund-policy': 'Trocas e devoluções',
  'shipping-policy': 'Política de frete',
  'terms-of-service': 'Termos de serviço',
}

export async function generateStaticParams() {
  return (await getPolicies()).map((p) => ({ handle: p.handle }))
}

export async function generateMetadata({ params }: PageProps<'/policies/[handle]'>): Promise<Metadata> {
  const { handle } = await params
  return { title: TITULOS[handle] ?? 'Políticas' }
}

export default async function PolicyPage({ params }: PageProps<'/policies/[handle]'>) {
  const { handle } = await params
  const policy = (await getPolicies()).find((p) => p.handle === handle)
  if (!policy) notFound()

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 md:py-16">
      <p className="text-sm font-semibold uppercase tracking-wider text-royal">Políticas da loja</p>
      <h1 className="mt-2 font-display text-3xl font-bold text-navy md:text-4xl">{TITULOS[handle] ?? policy.title}</h1>
      <div className="rich-text mt-8 rounded-card bg-white p-6 shadow-soft md:p-10" dangerouslySetInnerHTML={{ __html: policy.body }} />
    </article>
  )
}
