import Link from 'next/link'
import { readCart } from '@/lib/cart'

export async function CartLink() {
  const cart = await readCart()
  const count = cart?.totalQuantity ?? 0
  return (
    <Link href="/cart" className="flex items-center gap-1.5 hover:text-brand">
      Carrinho
      {count > 0 && (
        <span className="rounded-full bg-brand px-2 py-0.5 text-xs font-semibold text-white">{count}</span>
      )}
    </Link>
  )
}
