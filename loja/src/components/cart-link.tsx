import Link from 'next/link'
import { readCart } from '@/lib/cart'
import { IconBag } from './ui/icons'

export async function CartLink() {
  const cart = await readCart()
  const count = cart?.totalQuantity ?? 0
  return <CartButton count={count} />
}

export function CartButton({ count }: { count: number }) {
  return (
    <Link
      href="/cart"
      aria-label={`Carrinho, ${count} ${count === 1 ? 'item' : 'itens'}`}
      className="relative flex h-11 w-11 items-center justify-center rounded-full bg-navy text-white transition hover:bg-royal"
    >
      <IconBag className="h-5 w-5" />
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-cyan px-1 text-[11px] font-bold text-navy ring-2 ring-white">
          {count}
        </span>
      )}
    </Link>
  )
}
