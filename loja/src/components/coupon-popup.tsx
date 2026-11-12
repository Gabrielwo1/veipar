'use client'

import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { applyCoupon } from '@/lib/actions'
import { COUPON } from '@/lib/brand'
import { IconClose } from './ui/icons'

const STORAGE_KEY = 'veipar-cupom-visto'

function alreadySeen() {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

function markSeen() {
  try {
    localStorage.setItem(STORAGE_KEY, '1')
  } catch {}
}

// Aparece uma vez por visitante: depois de 12 s na página ou quando o mouse sai pela barra
// do navegador (intenção de saída). Não aparece no carrinho para não atrapalhar o checkout.
export function CouponPopup() {
  const [open, setOpen] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [applied, setApplied] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    if (pathname === '/cart' || alreadySeen()) return
    const show = () => {
      if (alreadySeen()) return
      markSeen()
      setOpen(true)
    }
    const timer = window.setTimeout(show, 12000)
    const onLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) show()
    }
    document.addEventListener('mouseout', onLeave)
    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('mouseout', onLeave)
    }
  }, [pathname])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  async function apply() {
    setRevealed(true)
    const fd = new FormData()
    fd.set('code', COUPON.code)
    await applyCoupon(fd)
    setApplied(true)
    try {
      await navigator.clipboard.writeText(COUPON.code)
    } catch {}
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-end justify-center p-4 sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="cupom-titulo"
        >
          <button className="absolute inset-0 bg-navy/60 backdrop-blur-sm" aria-label="Fechar" onClick={() => setOpen(false)} />
          <motion.div
            className="relative grid w-full max-w-3xl overflow-hidden rounded-[2rem] bg-white shadow-lift sm:grid-cols-[1fr_1.1fr]"
            initial={{ y: 60, scale: 0.94, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 40, scale: 0.96, opacity: 0 }}
            transition={{ type: 'spring', damping: 24, stiffness: 260 }}
          >
            <div className="relative h-40 sm:h-auto">
              <Image src="/img/gen/cupom.jpg" alt="" fill sizes="(min-width: 640px) 360px, 100vw" className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-royal/70 via-transparent sm:bg-gradient-to-r sm:from-transparent sm:to-white/0" />
              <motion.div
                className="absolute left-5 top-5 rounded-full bg-white px-4 py-2 font-display text-2xl font-extrabold text-royal shadow-soft sm:text-3xl"
                initial={{ rotate: -12, scale: 0 }}
                animate={{ rotate: -6, scale: 1 }}
                transition={{ delay: 0.25, type: 'spring', stiffness: 300, damping: 14 }}
              >
                {COUPON.label}
              </motion.div>
            </div>

            <div className="p-7 sm:p-9">
              <button onClick={() => setOpen(false)} aria-label="Fechar" className="absolute right-4 top-4 rounded-full bg-white/90 p-2 hover:bg-ice">
                <IconClose className="h-5 w-5" />
              </button>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan">Primeira compra</p>
              <h2 id="cupom-titulo" className="mt-2 font-display text-3xl font-bold leading-tight">
                Seu telhado sem goteira, com <span className="text-royal">{COUPON.label}</span>
              </h2>
              <p className="mt-3 text-sm text-muted">
                Toque para revelar o cupom. A gente já deixa ele aplicado no seu carrinho.
              </p>

              <div className="mt-6">
                {!revealed ? (
                  <button onClick={apply} className="btn-shine w-full rounded-2xl bg-royal py-4 font-semibold text-white hover:bg-navy-2">
                    Revelar meu cupom
                  </button>
                ) : (
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    className="rounded-2xl border-2 border-dashed border-cyan bg-ice p-4 text-center">
                    <p className="font-display text-3xl font-extrabold tracking-widest text-navy">{COUPON.code}</p>
                    <p className="mt-1 text-xs text-muted">
                      {applied ? 'Copiado! Já deixamos no seu carrinho.' : 'Aplicando…'}
                    </p>
                  </motion.div>
                )}
              </div>
              <button onClick={() => setOpen(false)} className="mt-4 w-full text-center text-xs text-muted underline-offset-4 hover:underline">
                Agora não
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
