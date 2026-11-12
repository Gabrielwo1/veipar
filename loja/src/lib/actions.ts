'use server'

import { refresh } from 'next/cache'
import { redirect } from 'next/navigation'
import { buyerIp, readCart, saveCartId } from './cart'
import { buscarEndereco, cotarFrete, normalizeCep, type FreteItem, type FreteOpcao } from './frete'
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

export type FreteState =
  | { status: 'idle' }
  | { status: 'error'; message: string }
  | { status: 'ok'; cep: string; endereco: string | null; opcoes: FreteOpcao[] }

export async function calcularFrete(_prev: FreteState, formData: FormData): Promise<FreteState> {
  const cep = normalizeCep(String(formData.get('cep') || ''))
  if (!cep) return { status: 'error', message: 'Digite um CEP válido' }

  let items: FreteItem[]
  try {
    items = JSON.parse(String(formData.get('items') || '[]'))
  } catch {
    return { status: 'error', message: 'Não foi possível calcular o frete' }
  }
  if (!items.length) return { status: 'error', message: 'Adicione um produto para calcular' }

  try {
    const [opcoes, endereco] = await Promise.all([cotarFrete(items, cep), buscarEndereco(cep)])
    return { status: 'ok', cep, endereco, opcoes }
  } catch {
    return { status: 'error', message: 'Não foi possível calcular o frete agora. Tente de novo.' }
  }
}
