'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'
import { whatsappLink } from '@/lib/brand'
import { IconArrow, IconWhatsApp } from '../ui/icons'

const WORDS = ['Goteira', 'no', 'parafuso', 'da', 'telha?']

export function Hero({ minPerPiece }: { minPerPiece: string | null }) {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '25%'])
  const cardY = useTransform(scrollYProgress, [0, 1], ['0%', '-30%'])

  return (
    <section ref={ref} className="relative isolate overflow-hidden bg-navy text-white">
      <motion.div className="absolute inset-0 -z-10" style={{ y: bgY }}>
        <Image src="/img/gen/hero.jpg" alt="" fill priority sizes="100vw" className="object-cover object-[70%_center]" />
      </motion.div>
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-navy via-navy/85 to-navy/10" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-navy via-transparent to-transparent" />

      <div className="mx-auto grid min-h-[620px] max-w-7xl items-center gap-10 px-4 pb-20 pt-14 md:min-h-[680px] md:grid-cols-[1.25fr_1fr]">
        <div>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-cyan backdrop-blur"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-cyan" /> Tecnologia patenteada · INPI
          </motion.p>

          <h1 className="mt-6 font-display text-[2.6rem] font-extrabold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
            {WORDS.map((w, i) => (
              <motion.span
                key={i}
                className="mr-[0.25em] inline-block"
                initial={{ opacity: 0, y: 40, filter: 'blur(8px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ delay: 0.15 + i * 0.08, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              >
                {w}
              </motion.span>
            ))}
            <motion.span
              className="text-gradient block"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7, duration: 0.6 }}
            >
              Nunca mais.
            </motion.span>
          </h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="mt-6 max-w-lg text-lg text-white/75"
          >
            O protetor Veipar cobre o parafuso, guarda o PU na aba e protege a borracha do sol e da chuva.
            Encaixa em segundos, sem ferramenta especial.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.05 }}
            className="mt-8 flex flex-wrap gap-3"
          >
            <Link href="/collections/veipar" className="btn-shine inline-flex items-center gap-2 rounded-full bg-cyan px-7 py-4 font-semibold text-navy transition hover:bg-white">
              Comprar agora <IconArrow className="h-5 w-5" />
            </Link>
            <a href={whatsappLink()} target="_blank" rel="noopener"
              className="inline-flex items-center gap-2 rounded-full border border-white/25 px-7 py-4 font-semibold backdrop-blur transition hover:bg-white/10">
              <IconWhatsApp className="h-5 w-5" /> Chamar no WhatsApp
            </a>
          </motion.div>

          <motion.dl
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.25 }}
            className="mt-12 grid max-w-md grid-cols-3 gap-4 border-t border-white/10 pt-6"
          >
            {[
              ['99 mil', 'seguidores no Instagram'],
              ['AZ 150', 'aço Galvalume nacional'],
              ['2', 'registros no INPI'],
            ].map(([n, l]) => (
              <div key={l}>
                <dt className="font-display text-2xl font-bold text-white">{n}</dt>
                <dd className="text-xs text-white/55">{l}</dd>
              </div>
            ))}
          </motion.dl>
        </div>

        <motion.div style={{ y: cardY }} className="relative mx-auto hidden w-full max-w-sm md:block">
          <motion.div
            initial={{ opacity: 0, scale: 0.85, rotate: -6 }}
            animate={{ opacity: 1, scale: 1, rotate: -3 }}
            transition={{ delay: 0.5, type: 'spring', stiffness: 120, damping: 16 }}
            className="relative aspect-[4/5] overflow-hidden rounded-[2rem] border border-white/15 bg-white/10 p-3 shadow-lift backdrop-blur-md"
          >
            <div className="relative h-full overflow-hidden rounded-[1.5rem]">
              <Image src="/img/brand/peca-preta.jpg" alt="Protetor Veipar preto" fill sizes="380px" className="object-cover" />
            </div>
          </motion.div>
          <div className="absolute -bottom-8 -left-10 h-32 w-32 animate-spin-slow rounded-full bg-white p-1.5 shadow-lift">
            <Image src="/img/brand/selo-original.png" alt="Produto 100% original Veipar" fill sizes="128px" className="object-contain p-1" />
          </div>
          {minPerPiece && <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.2 }}
            className="absolute -right-6 top-10 rounded-2xl bg-white px-4 py-3 text-navy shadow-lift"
          >
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">A partir de</p>
            <p className="font-display text-2xl font-extrabold text-royal">{minPerPiece}<span className="text-sm font-semibold text-muted">/peça</span></p>
          </motion.div>}
        </motion.div>
      </div>
    </section>
  )
}
