'use client'

import { goToCheckout } from '@/lib/actions'
import { track } from '@/lib/pixel'
import { IconArrow } from './ui/icons'

export function CheckoutButton({ value, numItems }: { value: number; numItems: number }) {
  return (
    <form action={goToCheckout} onSubmit={() => track('InitiateCheckout', { value, currency: 'BRL', num_items: numItems })} className="mt-5">
      <button type="submit" className="btn-shine flex w-full items-center justify-center gap-2 rounded-2xl bg-royal px-5 py-4 font-semibold text-white hover:bg-navy-2">
        Finalizar compra <IconArrow className="h-5 w-5" />
      </button>
    </form>
  )
}
