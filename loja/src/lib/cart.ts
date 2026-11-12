import 'server-only'
import { cookies, headers } from 'next/headers'
import { getCart, type Cart } from './shopify'

// O ID do carrinho carrega uma chave secreta (?key=...), então fica num cookie httpOnly.
const CART_COOKIE = 'cartId'

export async function buyerIp() {
  const h = await headers()
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() || undefined
}

export async function saveCartId(id: string) {
  ;(await cookies()).set(CART_COOKIE, id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })
}

export async function readCart(): Promise<Cart | null> {
  const id = (await cookies()).get(CART_COOKIE)?.value
  if (!id) return null
  // Carrinho expirado ou já convertido em pedido volta null.
  return getCart(id).catch(() => null)
}
