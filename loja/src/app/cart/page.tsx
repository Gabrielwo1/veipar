import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Suspense } from 'react'
import { goToCheckout, setLineQuantity } from '@/lib/actions'
import { readCart } from '@/lib/cart'
import { formatMoney } from '@/lib/shopify'

export const metadata: Metadata = { title: 'Carrinho', robots: { index: false } }

function QuantityButton({ lineId, quantity, label }: { lineId: string; quantity: number; label: string }) {
  return (
    <form action={setLineQuantity}>
      <input type="hidden" name="lineId" value={lineId} />
      <input type="hidden" name="quantity" value={quantity} />
      <button type="submit" aria-label={label} className="h-8 w-8 rounded-md border border-border bg-surface hover:border-foreground">
        {label === 'Remover' ? '×' : label === 'Diminuir' ? '−' : '+'}
      </button>
    </form>
  )
}

async function CartContent() {
  const cart = await readCart()

  if (!cart || cart.totalQuantity === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface p-10 text-center">
        <p className="text-muted">Seu carrinho está vazio.</p>
        <Link href="/" className="mt-4 inline-block font-semibold text-brand hover:underline">Ver produtos</Link>
      </div>
    )
  }

  return (
    <div className="grid gap-8 md:grid-cols-[1fr_320px]">
      <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
        {cart.lines.nodes.map((line) => (
          <li key={line.id} className="flex gap-4 p-4">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-background">
              {line.merchandise.image && (
                <Image src={line.merchandise.image.url} alt={line.merchandise.product.title} fill sizes="80px" className="object-cover" />
              )}
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <Link href={`/products/${line.merchandise.product.handle}`} className="text-sm font-medium hover:text-brand">
                {line.merchandise.product.title}
              </Link>
              {line.merchandise.title !== 'Default Title' && (
                <span className="text-xs text-muted">{line.merchandise.title}</span>
              )}
              <div className="flex items-center gap-2">
                <QuantityButton lineId={line.id} quantity={line.quantity - 1} label="Diminuir" />
                <span className="w-8 text-center text-sm">{line.quantity}</span>
                <QuantityButton lineId={line.id} quantity={line.quantity + 1} label="Aumentar" />
                <span className="ml-2"><QuantityButton lineId={line.id} quantity={0} label="Remover" /></span>
              </div>
            </div>
            <p className="font-semibold">{formatMoney(line.cost.totalAmount)}</p>
          </li>
        ))}
      </ul>

      <aside className="h-fit rounded-xl border border-border bg-surface p-5">
        <div className="flex justify-between text-sm">
          <span className="text-muted">Subtotal</span>
          <span className="font-semibold">{formatMoney(cart.cost.subtotalAmount)}</span>
        </div>
        <p className="mt-2 text-xs text-muted">Frete e descontos são calculados no checkout.</p>
        <form action={goToCheckout} className="mt-5">
          <button type="submit" className="w-full rounded-lg bg-brand px-5 py-3 font-semibold text-white hover:bg-brand-dark">
            Finalizar compra
          </button>
        </form>
      </aside>
    </div>
  )
}

export default function CartPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="mb-6 text-3xl font-bold">Carrinho</h1>
      <Suspense fallback={<p className="text-muted">Carregando…</p>}>
        <CartContent />
      </Suspense>
    </div>
  )
}
