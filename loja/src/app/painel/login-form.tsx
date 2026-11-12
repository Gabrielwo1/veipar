'use client'

import { useActionState } from 'react'
import { entrar, type EntrarState } from './actions'

export function LoginForm() {
  const [state, action, pending] = useActionState<EntrarState, FormData>(entrar, {})
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-sm flex-col justify-center px-4 py-16">
      <h1 className="font-display text-3xl font-bold text-navy">Painel da loja</h1>
      <p className="mt-2 text-sm text-muted">Digite o código de acesso para ver os números.</p>
      <form action={action} className="mt-6 space-y-3">
        <input
          name="codigo"
          type="password"
          inputMode="numeric"
          autoComplete="current-password"
          autoFocus
          required
          aria-label="Código de acesso"
          placeholder="Código"
          className="w-full rounded-2xl border border-border bg-white px-5 py-4 text-lg tracking-[0.3em] outline-none focus:border-royal"
        />
        {state.erro && <p className="text-sm font-semibold text-danger">{state.erro}</p>}
        <button
          disabled={pending}
          className="w-full rounded-2xl bg-navy px-5 py-4 font-semibold text-white transition hover:bg-royal disabled:opacity-60"
        >
          {pending ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}
