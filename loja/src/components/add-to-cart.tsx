'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import { addToCart, buyNow } from '@/lib/actions'
import { contentId, track } from '@/lib/pixel'
import type { Money, Product, Variant } from '@/lib/shopify'
import { ShippingCalculator } from './shipping-calculator'

function formatMoney({ amount, currencyCode }: Money) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: currencyCode }).format(Number(amount))
}

function Buttons({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus()
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <button
        type="submit"
        formAction={buyNow}
        data-buy-now
        disabled={disabled || pending}
        className="btn-shine order-first rounded-2xl bg-royal px-5 py-4 font-semibold text-white transition hover:bg-navy-2 disabled:opacity-50 sm:order-last"
      >
        {disabled ? 'Esgotado' : pending ? 'Aguarde…' : 'Comprar agora'}
      </button>
      <button
        type="submit"
        disabled={disabled || pending}
        className="rounded-2xl border-2 border-navy px-5 py-4 font-semibold text-navy transition hover:bg-navy hover:text-white disabled:opacity-50"
      >
        Adicionar ao carrinho
      </button>
    </div>
  )
}

export function AddToCart({
  options,
  variants,
  pieces,
}: {
  options: Product['options']
  variants: Variant[]
  pieces: number | null
}) {
  const [variantId, setVariantId] = useState((variants.find((v) => v.availableForSale) ?? variants[0]).id)
  const [quantity, setQuantity] = useState(1)
  const variant = variants.find((v) => v.id === variantId) ?? variants[0]
  // Produto sem opção real vem com uma opção "Title" / "Default Title".
  const realOptions = options.filter((o) => !(o.optionValues.length === 1 && o.optionValues[0].name === 'Default Title'))
  const onSale = variant.compareAtPrice && Number(variant.compareAtPrice.amount) > Number(variant.price.amount)
  const total = { amount: String(Number(variant.price.amount) * quantity), currencyCode: variant.price.currencyCode }

  function trackAdd(buyNow: boolean) {
    const params = { content_ids: [contentId(variant.id)], content_type: 'product', value: Number(total.amount), currency: 'BRL' }
    track('AddToCart', params)
    if (buyNow) track('InitiateCheckout', { ...params, num_items: quantity })
  }

  function pick(name: string, value: string) {
    const wanted = variant.selectedOptions.map((o) => (o.name === name ? { name, value } : o))
    const match = variants.find((v) =>
      wanted.every((w) => v.selectedOptions.some((o) => o.name === w.name && o.value === w.value)),
    )
    if (match) setVariantId(match.id)
  }

  return (
    <div className="mt-5">
      <div className="flex flex-wrap items-end gap-3">
        <p className="font-display text-4xl font-extrabold text-royal">{formatMoney(variant.price)}</p>
        {onSale && <p className="pb-1 text-muted line-through">{formatMoney(variant.compareAtPrice!)}</p>}
        {pieces && (
          <p className="mb-1 rounded-full bg-ice px-3 py-1 text-xs font-semibold text-royal">
            {formatMoney({ amount: String(Number(variant.price.amount) / pieces), currencyCode: variant.price.currencyCode })} por peça
          </p>
        )}
      </div>

      {realOptions.map((option) => {
        const selected = variant.selectedOptions.find((o) => o.name === option.name)?.value
        return (
          <fieldset key={option.name} className="mt-6">
            <legend className="mb-2 text-sm font-semibold">
              {option.name}: <span className="font-normal text-muted">{selected}</span>
            </legend>
            <div className="flex flex-wrap gap-2">
              {option.optionValues.map(({ name }) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => pick(option.name, name)}
                  className={`rounded-full border-2 px-5 py-2 text-sm font-semibold transition ${
                    name === selected ? 'border-royal bg-royal text-white' : 'border-border bg-white hover:border-navy'
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          </fieldset>
        )
      })}

      <form
        action={addToCart}
        onSubmit={(e) => trackAdd(!!((e.nativeEvent as SubmitEvent).submitter as HTMLElement | null)?.hasAttribute('data-buy-now'))}
        className="mt-6 space-y-3"
      >
        <input type="hidden" name="variantId" value={variant.id} />
        <input type="hidden" name="quantity" value={quantity} />
        <div className="flex items-center justify-between rounded-2xl bg-white p-2 shadow-soft">
          <span className="pl-3 text-sm font-semibold">Quantidade</span>
          <div className="flex items-center gap-1">
            <button type="button" aria-label="Diminuir" onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="h-10 w-10 rounded-xl bg-ice text-lg font-bold text-royal hover:bg-royal hover:text-white">−</button>
            <span className="w-10 text-center font-display text-lg font-bold" aria-live="polite">{quantity}</span>
            <button type="button" aria-label="Aumentar" onClick={() => setQuantity((q) => q + 1)}
              className="h-10 w-10 rounded-xl bg-ice text-lg font-bold text-royal hover:bg-royal hover:text-white">+</button>
          </div>
        </div>
        {quantity > 1 && (
          <p className="text-right text-sm text-muted">Total: <strong className="text-foreground">{formatMoney(total)}</strong></p>
        )}
        <Buttons disabled={!variant.availableForSale} />
      </form>

      <div className="mt-4">
        <ShippingCalculator items={[{ variantId: variant.id, price: variant.price.amount, quantity }]} />
      </div>

      {/* Barra de compra fixa no celular. */}
      <form action={buyNow} onSubmit={() => trackAdd(true)} className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-border bg-white p-3 pr-20 md:hidden">
        <input type="hidden" name="variantId" value={variant.id} />
        <input type="hidden" name="quantity" value={quantity} />
        <div className="min-w-0">
          <p className="truncate text-xs text-muted">{quantity}× {variant.title === 'Default Title' ? 'unidade' : variant.title}</p>
          <p className="font-display text-lg font-bold text-royal">{formatMoney(total)}</p>
        </div>
        <button type="submit" disabled={!variant.availableForSale} className="ml-auto rounded-2xl bg-royal px-5 py-3 font-semibold text-white disabled:opacity-50">
          Comprar agora
        </button>
      </form>
    </div>
  )
}
