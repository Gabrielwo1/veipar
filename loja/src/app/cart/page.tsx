import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Suspense } from 'react'
import { CheckoutButton } from '@/components/checkout-button'
import { PatentStrip } from '@/components/home/patent-banner'
import { prettyTitle } from '@/components/product-grid'
import { ShippingCalculator } from '@/components/shipping-calculator'
import { IconArrow, IconBag } from '@/components/ui/icons'
import { applyCoupon, setLineQuantity } from '@/lib/actions'
import { readCart } from '@/lib/cart'
import { formatMoney, type Money } from '@/lib/shopify'

export const metadata: Metadata = { title: 'Carrinho', robots: { index: false } }

function QuantityButton({ lineId, quantity, label, children }: { lineId: string; quantity: number; label: string; children: string }) {
  return (
    <form action={setLineQuantity}>
      <input type="hidden" name="lineId" value={lineId} />
      <input type="hidden" name="quantity" value={quantity} />
      <button type="submit" aria-label={label} className="h-9 w-9 rounded-xl bg-ice font-bold text-royal transition hover:bg-royal hover:text-white">
        {children}
      </button>
    </form>
  )
}

async function CartContent() {
  const cart = await readCart()

  if (!cart || cart.totalQuantity === 0) {
    return (
      <div className="rounded-[2rem] bg-white p-12 text-center shadow-soft">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-ice text-royal">
          <IconBag className="h-8 w-8" />
        </span>
        <p className="mt-4 font-display text-2xl font-bold">Seu carrinho está vazio</p>
        <p className="mt-1 text-muted">Que tal começar pelo mais vendido?</p>
        <Link href="/collections/veipar" className="btn-shine mt-6 inline-flex items-center gap-2 rounded-full bg-royal px-6 py-3.5 font-semibold text-white">
          Ver protetores <IconArrow className="h-5 w-5" />
        </Link>
      </div>
    )
  }

  const discount = cart.discountAllocations.reduce((sum, d) => sum + Number(d.discountedAmount.amount), 0)
  const currency = cart.cost.subtotalAmount.currencyCode
  const money = (amount: number): Money => ({ amount: String(amount), currencyCode: currency })
  const coupon = cart.discountCodes[0]

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <ul className="space-y-3">
        {cart.lines.nodes.map((line) => (
          <li key={line.id} className="flex gap-4 rounded-[var(--radius-card)] bg-white p-4 shadow-soft">
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-ice">
              {line.merchandise.image && (
                <Image src={line.merchandise.image.url} alt={line.merchandise.product.title} fill sizes="96px" className="object-cover" />
              )}
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <div className="flex items-start justify-between gap-3">
                <Link href={`/products/${line.merchandise.product.handle}`} className="font-semibold leading-snug hover:text-royal">
                  {prettyTitle(line.merchandise.product.title)}
                </Link>
                <QuantityButton lineId={line.id} quantity={0} label="Remover">×</QuantityButton>
              </div>
              {line.merchandise.title !== 'Default Title' && <span className="text-xs text-muted">{line.merchandise.title}</span>}
              <div className="mt-auto flex items-center justify-between pt-2">
                <div className="flex items-center gap-1">
                  <QuantityButton lineId={line.id} quantity={line.quantity - 1} label="Diminuir">−</QuantityButton>
                  <span className="w-9 text-center font-display font-bold">{line.quantity}</span>
                  <QuantityButton lineId={line.id} quantity={line.quantity + 1} label="Aumentar">+</QuantityButton>
                </div>
                <p className="font-display text-lg font-bold">{formatMoney(line.cost.totalAmount)}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <aside className="h-fit space-y-4 lg:sticky lg:top-28">
        <div className="rounded-[var(--radius-card)] bg-white p-6 shadow-soft">
          <h2 className="font-display text-xl font-bold">Resumo</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Subtotal</dt>
              <dd className="font-semibold">{formatMoney(cart.cost.subtotalAmount)}</dd>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-success">
                <dt>Desconto ({coupon?.code})</dt>
                <dd className="font-semibold">−{formatMoney(money(discount))}</dd>
              </div>
            )}
            <div className="flex justify-between border-t border-border pt-3 text-base">
              <dt className="font-semibold">Total</dt>
              <dd className="font-display text-2xl font-bold text-royal">{formatMoney(cart.cost.totalAmount)}</dd>
            </div>
          </dl>
          <p className="mt-1 text-xs text-muted">Frete calculado no checkout.</p>

          <form action={applyCoupon} className="mt-5 flex gap-2">
            <label className="sr-only" htmlFor="code">Cupom</label>
            <input id="code" name="code" defaultValue={coupon?.code ?? ''} placeholder="Cupom de desconto"
              className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm uppercase" />
            <button className="rounded-xl bg-navy px-4 text-sm font-semibold text-white hover:bg-royal">Aplicar</button>
          </form>
          {coupon && (
            <p className={`mt-2 text-xs ${coupon.applicable ? 'text-success' : 'text-danger'}`}>
              {coupon.applicable ? `Cupom ${coupon.code} aplicado ✓` : `O cupom ${coupon.code} não vale para este carrinho.`}
            </p>
          )}

          <CheckoutButton value={Number(cart.cost.totalAmount.amount)} numItems={cart.totalQuantity} />
          <p className="mt-3 text-center text-xs text-muted">Pagamento no checkout seguro da Shopify</p>
        </div>

        <ShippingCalculator
          // Cotação antiga some quando o carrinho muda.
          key={cart.lines.nodes.map((l) => `${l.id}:${l.quantity}`).join(',')}
          items={cart.lines.nodes.map((l) => ({
            variantId: l.merchandise.id,
            price: l.merchandise.price.amount,
            quantity: l.quantity,
          }))}
        />
        <PatentStrip />
      </aside>
    </div>
  )
}

export default function CartPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 pt-10">
      <h1 className="mb-8 font-display text-4xl font-extrabold">Seu carrinho</h1>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-[2rem] bg-white" />}>
        <CartContent />
      </Suspense>
    </div>
  )
}
