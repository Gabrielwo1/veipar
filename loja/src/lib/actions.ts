'use server'

import { refresh } from 'next/cache'
import { redirect } from 'next/navigation'
import { buyerIp, readCart, saveCartId } from './cart'
import { addCartLines, createCart, updateCartLine } from './shopify'

export async function addToCart(formData: FormData) {
  const merchandiseId = String(formData.get('variantId') || '')
  const quantity = Math.max(1, Number(formData.get('quantity')) || 1)
  if (!merchandiseId) return

  const ip = await buyerIp()
  const lines = [{ merchandiseId, quantity }]
  const current = await readCart()
  const cart = current ? await addCartLines(current.id, lines, ip) : await createCart(lines, ip)
  await saveCartId(cart.id)
  redirect('/cart')
}

export async function setLineQuantity(formData: FormData) {
  const lineId = String(formData.get('lineId') || '')
  const quantity = Math.max(0, Number(formData.get('quantity')) || 0)
  const cart = await readCart()
  if (!cart || !lineId) return
  await updateCartLine(cart.id, lineId, quantity, await buyerIp())
  refresh()
}

export async function goToCheckout() {
  // checkoutUrl pode ficar velho; buscamos de novo na hora de pagar.
  const cart = await readCart()
  if (!cart || cart.totalQuantity === 0) redirect('/cart')
  redirect(cart.checkoutUrl)
}
