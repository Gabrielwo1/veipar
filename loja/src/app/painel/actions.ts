'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { COOKIE, codigoValido, tokenDoPainel } from './auth'

export type EntrarState = { erro?: string }

export async function entrar(_prev: EntrarState, formData: FormData): Promise<EntrarState> {
  const codigo = String(formData.get('codigo') ?? '').trim()
  if (!codigoValido(codigo)) return { erro: 'Código incorreto.' }
  ;(await cookies()).set(COOKIE, tokenDoPainel(), {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/painel',
    maxAge: 60 * 60 * 24 * 30,
  })
  redirect('/painel')
}

export async function sair() {
  ;(await cookies()).delete({ name: COOKIE, path: '/painel' })
  redirect('/painel')
}
