'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import { addToCart } from '@/lib/actions'
import type { Money, Product, Variant } from '@/lib/shopify'

function formatMoney({ amount, currencyCode }: Money) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: currencyCode }).format(Number(amount))
}

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="flex-1 rounded-lg bg-brand px-5 py-3 font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
    >
      {disabled ? 'Esgotado' : pending ? 'Adicionando…' : 'Adicionar ao carrinho'}
    </button>
  )
}

export function AddToCart({ options, variants }: { options: Product['options']; variants: Variant[] }) {
  const [variantId, setVariantId] = useState(
    (variants.find((v) => v.availableForSale) ?? variants[0]).id,
  )
  const variant = variants.find((v) => v.id === variantId) ?? variants[0]
  // Produto sem opção real vem com uma opção "Title" / "Default Title".
  const realOptions = options.filter((o) => !(o.optionValues.length === 1 && o.optionValues[0].name === 'Default Title'))

  function pick(name: string, value: string) {
    const wanted = variant.selectedOptions.map((o) => (o.name === name ? { name, value } : o))
    const match = variants.find((v) =>
      wanted.every((w) => v.selectedOptions.some((o) => o.name === w.name && o.value === w.value)),
    )
    if (match) setVariantId(match.id)
  }

  return (
    <div className="mt-4">
      <p className="text-3xl font-bold text-brand">{formatMoney(variant.price)}</p>
      {variant.compareAtPrice && Number(variant.compareAtPrice.amount) > Number(variant.price.amount) && (
        <p className="text-sm text-muted line-through">{formatMoney(variant.compareAtPrice)}</p>
      )}

      {realOptions.map((option) => {
        const selected = variant.selectedOptions.find((o) => o.name === option.name)?.value
        return (
          <fieldset key={option.name} className="mt-6">
            <legend className="mb-2 text-sm font-medium">
              {option.name}: <span className="text-muted">{selected}</span>
            </legend>
            <div className="flex flex-wrap gap-2">
              {option.optionValues.map(({ name }) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => pick(option.name, name)}
                  className={`rounded-lg border px-4 py-2 text-sm ${
                    name === selected ? 'border-brand bg-brand/10 font-semibold text-brand' : 'border-border bg-surface hover:border-foreground'
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          </fieldset>
        )
      })}

      <form action={addToCart} className="mt-6 flex gap-3">
        <input type="hidden" name="variantId" value={variant.id} />
        <label className="sr-only" htmlFor="quantity">Quantidade</label>
        <input
          id="quantity"
          name="quantity"
          type="number"
          min={1}
          defaultValue={1}
          className="w-20 rounded-lg border border-border bg-surface px-3 text-center"
        />
        <SubmitButton disabled={!variant.availableForSale} />
      </form>
    </div>
  )
}
