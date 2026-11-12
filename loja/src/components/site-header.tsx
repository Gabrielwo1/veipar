'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ACCOUNT_URL } from '@/lib/brand'
import { IconClose, IconMenu, IconUser } from './ui/icons'

const NAV = [
  { href: '/collections/veipar', label: 'Protetores' },
  { href: '/collections/combos', label: 'Kits com PU' },
  { href: '/collections/acessorios-auxiliar', label: 'Acessórios' },
  { href: '/nossa-historia', label: 'Nossa história' },
]

const ANNOUNCEMENTS = [
  'Produto patenteado no INPI',
  'Envio para todo o Brasil',
  'Aço Galvalume AZ 150',
  'Preço direto da loja oficial',
  'Compra segura pelo checkout da Shopify',
]

export function SiteHeader({ cart }: { cart: ReactNode }) {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Fecha o menu ao trocar de página.
  const [lastPath, setLastPath] = useState(pathname)
  if (lastPath !== pathname) {
    setLastPath(pathname)
    setOpen(false)
  }

  return (
    <>
      <div className="overflow-hidden bg-navy text-[13px] font-medium text-white/85">
        <div className="flex w-max animate-marquee gap-10 py-2 pl-10">
          {[...ANNOUNCEMENTS, ...ANNOUNCEMENTS].map((a, i) => (
            <span key={i} className="flex items-center gap-10 whitespace-nowrap">
              {a}
              <span className="h-1 w-1 rounded-full bg-cyan" />
            </span>
          ))}
        </div>
      </div>

      <header
        className={`sticky top-0 z-40 bg-white transition-shadow duration-300 ${scrolled ? 'shadow-soft' : ''}`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:h-20">
          <button
            className="-ml-2 rounded-full p-2 md:hidden"
            aria-label="Abrir menu"
            onClick={() => setOpen(true)}
          >
            <IconMenu className="h-6 w-6" />
          </button>

          <Link href="/" className="shrink-0" aria-label="Veipar, página inicial">
            <Image src="/img/brand/logo-wordmark-navy.png" alt="Veipar" width={150} height={57} priority className="h-9 w-auto md:h-11" />
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition hover:bg-ice hover:text-royal ${
                  pathname === n.href ? 'bg-ice text-royal' : 'text-foreground'
                }`}
              >
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1 md:gap-2">
            <a
              href={ACCOUNT_URL}
              aria-label="Minha conta"
              title="Minha conta"
              className="flex h-11 w-11 items-center justify-center rounded-full text-navy transition hover:bg-ice hover:text-royal"
            >
              <IconUser className="h-6 w-6" />
            </a>
            {cart}
          </div>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-50 md:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <button className="absolute inset-0 bg-navy/50 backdrop-blur-sm" aria-label="Fechar menu" onClick={() => setOpen(false)} />
            <motion.nav
              className="absolute inset-y-0 left-0 flex w-[82%] max-w-sm flex-col bg-white p-6"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            >
              <div className="mb-8 flex items-center justify-between">
                <Image src="/img/brand/logo-wordmark-navy.png" alt="Veipar" width={130} height={49} className="h-9 w-auto" />
                <button onClick={() => setOpen(false)} aria-label="Fechar menu" className="rounded-full p-2 hover:bg-ice">
                  <IconClose className="h-6 w-6" />
                </button>
              </div>
              {[{ href: '/', label: 'Início' }, ...NAV].map((n, i) => (
                <motion.div key={n.href} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * i + 0.1 }}>
                  <Link href={n.href} className="block border-b border-border py-4 font-display text-xl font-semibold">
                    {n.label}
                  </Link>
                </motion.div>
              ))}
              <a href={ACCOUNT_URL} className="mt-6 flex items-center gap-3 font-semibold text-royal">
                <IconUser className="h-5 w-5" />
                Minha conta e pedidos
              </a>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
