'use client'

import { useActionState } from 'react'
import { calcularFrete, type FreteState } from '@/lib/actions'
import type { FreteItem } from '@/lib/frete'

const WHATSAPP_MESSAGE = 'Chame nossa equipe no WhatsApp para cotar'

export function ShippingCalculator({ items }: { items: FreteItem[] }) {
  const [state, action, pending] = useActionState<FreteState, FormData>(calcularFrete, { status: 'idle' })

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <form action={action} className="flex gap-2">
        <input type="hidden" name="items" value={JSON.stringify(items)} />
        <label className="sr-only" htmlFor="cep">CEP</label>
        <input
          id="cep"
          name="cep"
          inputMode="numeric"
          autoComplete="postal-code"
          placeholder="Calcular frete: digite seu CEP"
          maxLength={9}
          // O form é resetado depois da action; assim o CEP calculado continua no campo.
          defaultValue={state.status === 'ok' ? `${state.cep.slice(0, 5)}-${state.cep.slice(5)}` : ''}
          className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg border border-foreground px-4 py-2 text-sm font-semibold hover:bg-foreground hover:text-white disabled:opacity-50"
        >
          {pending ? 'Calculando…' : 'Calcular'}
        </button>
      </form>

      {state.status === 'error' && <p className="mt-3 text-center text-sm text-muted">{state.message}</p>}

      {state.status === 'ok' && (
        <div className="mt-3 text-sm">
          {state.endereco && <p className="mb-2 text-xs text-muted">{state.endereco}</p>}
          {state.opcoes.length === 0 ? (
            <p className="py-2 text-center">{WHATSAPP_MESSAGE}</p>
          ) : (
            <ul className="divide-y divide-border">
              {state.opcoes.map((o) => (
                <li key={o.name} className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-semibold">{o.name}</p>
                    <p className="text-xs text-muted">
                      Chega até {o.shippingDate} ({o.days.max} {o.days.max === 1 ? 'dia útil' : 'dias úteis'})
                    </p>
                  </div>
                  <span className="font-semibold text-green-700">{o.price}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
