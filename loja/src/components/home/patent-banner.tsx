'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'motion/react'
import { PATENTS } from '@/lib/brand'
import { IconArrow, IconPatent } from '../ui/icons'
import { Reveal } from '../ui/reveal'

// Linhas de cota que se "desenham" por cima do blueprint quando a seção entra na tela.
function DrawLines() {
  const draw = {
    hidden: { pathLength: 0, opacity: 0 },
    show: (i: number) => ({ pathLength: 1, opacity: 1, transition: { delay: 0.3 + i * 0.25, duration: 1.4, ease: 'easeInOut' as const } }),
  }
  return (
    <motion.svg
      viewBox="0 0 400 200"
      className="pointer-events-none absolute inset-0 h-full w-full"
      initial="hidden"
      whileInView="show"
      viewport={{ once: true }}
      preserveAspectRatio="none"
      aria-hidden
    >
      <motion.path d="M10 180 H390" stroke="#00a3e0" strokeWidth="0.6" fill="none" variants={draw} custom={0} />
      <motion.path d="M30 20 V190" stroke="#00a3e0" strokeWidth="0.6" strokeDasharray="3 3" fill="none" variants={draw} custom={1} />
      <motion.circle cx="30" cy="180" r="3" stroke="#00a3e0" strokeWidth="0.8" fill="none" variants={draw} custom={2} />
    </motion.svg>
  )
}

export function PatentBanner() {
  return (
    <section id="patente" className="relative mt-24 scroll-mt-24 overflow-hidden bg-navy text-white">
      <div className="absolute inset-0">
        <Image src="/img/gen/patente.jpg" alt="" fill sizes="100vw" className="object-cover object-right opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/90 to-navy/20 md:via-navy/70" />
      </div>
      <DrawLines />

      <div className="relative mx-auto max-w-7xl px-4 py-20 md:py-28">
        <div className="max-w-xl">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full bg-cyan/15 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-cyan">
              <IconPatent className="h-4 w-4" /> Registrado no INPI
            </span>
            <h2 className="mt-5 font-display text-4xl font-extrabold leading-[1.05] md:text-6xl">
              Tecnologia <span className="text-gradient">patenteada</span>. Não aceite cópias.
            </h2>
            <p className="mt-5 text-lg text-white/70">
              A tampa Veipar tem uma <strong className="text-white">cavidade exclusiva na aba</strong> que guarda o PU
              protegido do sol. E o bico injetor rosqueia direto na bisnaga para aplicar o selante na medida certa.
              As duas têm o Veimar como inventor e estão registradas no INPI.
            </p>
          </Reveal>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {PATENTS.map((p, i) => (
              <Reveal key={p.number} delay={0.15 + i * 0.12}>
                <a
                  href={p.url}
                  target="_blank"
                  rel="noopener"
                  className="group block h-full rounded-2xl border border-white/15 bg-navy-2/70 p-5 transition hover:border-cyan/60 hover:bg-white/10"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-cyan">{p.status}</p>
                  <p className="mt-2 font-display text-xl font-bold">{p.title}</p>
                  <p className="mt-1 font-mono text-sm text-white/70">{p.number}</p>
                  <p className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-white/60 group-hover:text-cyan">
                    Ver registro <IconArrow className="h-4 w-4" />
                  </p>
                </a>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.4}>
            <Link href="/nossa-historia" className="mt-10 inline-flex items-center gap-2 font-semibold text-cyan hover:text-white">
              Conheça quem criou o Veipar <IconArrow className="h-5 w-5" />
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

// Faixa curta da patente, para usar entre seções e na página de produto.
export function PatentStrip() {
  return (
    <Reveal>
      <Link href="/#patente" className="group relative flex items-center gap-4 overflow-hidden rounded-[var(--radius-card)] bg-navy p-5 text-white">
        <div className="blueprint-grid absolute inset-0" aria-hidden />
        <div className="relative h-16 w-16 shrink-0">
          <Image src="/img/brand/selo-original.png" alt="" fill sizes="64px" className="animate-spin-slow object-contain" />
        </div>
        <div className="relative">
          <p className="font-display text-lg font-bold">Produto patenteado · 100% original</p>
          <p className="text-sm text-white/65">Protetor e bico injetor registrados no INPI. Recuse imitações.</p>
        </div>
        <IconArrow className="relative ml-auto hidden h-6 w-6 text-cyan transition group-hover:translate-x-1 sm:block" />
      </Link>
    </Reveal>
  )
}
