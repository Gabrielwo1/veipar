'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { quickAdd } from '@/lib/actions'
import { contentId, track } from '@/lib/pixel'
import { IconPlus } from './ui/icons'

const btn =
  'relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan text-navy shadow-soft transition hover:scale-110 hover:bg-royal hover:text-white disabled:opacity-40 sm:h-11 sm:w-11'

// "+" dos cards. Produto com cor/variação leva para a página para escolher.
export function QuickAddButton({ variantId, price, disabled, href }: { variantId: string; price?: string; disabled?: boolean; href?: string }) {
  const [pending, start] = useTransition()
  const [done, setDone] = useState(false)

  if (href) {
    return (
      <Link href={href} className={btn} aria-label="Escolher cor">
        <IconPlus className="h-5 w-5" />
      </Link>
    )
  }

  function add() {
    const fd = new FormData()
    fd.set('variantId', variantId)
    fd.set('quantity', '1')
    start(async () => {
      await quickAdd(fd)
      track('AddToCart', { content_ids: [contentId(variantId)], content_type: 'product', value: Number(price ?? 0), currency: 'BRL' })
      setDone(true)
      setTimeout(() => setDone(false), 1600)
    })
  }

  return (
    <button onClick={add} disabled={disabled || pending} className={btn} aria-label="Adicionar ao carrinho">
      <AnimatePresence mode="wait" initial={false}>
        {pending ? (
          <motion.span key="l" className="h-4 w-4 animate-spin rounded-full border-2 border-navy border-t-transparent" />
        ) : done ? (
          <motion.span key="d" initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-lg font-bold">✓</motion.span>
        ) : (
          <motion.span key="p" initial={{ scale: 0 }} animate={{ scale: 1 }}>
            <IconPlus className="h-5 w-5" />
          </motion.span>
        )}
      </AnimatePresence>
      {done && (
        <motion.span
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: 1, y: -34 }}
          className="pointer-events-none absolute right-0 whitespace-nowrap rounded-full bg-navy px-3 py-1 text-xs font-semibold text-white"
        >
          No carrinho!
        </motion.span>
      )}
    </button>
  )
}
