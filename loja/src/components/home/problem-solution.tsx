'use client'

import Image from 'next/image'
import { motion } from 'motion/react'
import { IconCoin, IconDrop, IconHome, IconRust, IconSun } from '../ui/icons'
import { Reveal } from '../ui/reveal'

// Mesma narrativa do reels "Goteira no telhado?": causa → prejuízo → solução.
const CAUSES = [
  { icon: IconSun, text: 'O sol resseca a borracha' },
  { icon: IconDrop, text: 'A água entra pelo furo' },
  { icon: IconRust, text: 'O parafuso enferruja' },
]
const LOSSES = [
  { icon: IconHome, title: 'Forro manchado', text: 'infiltração desce pelo telhado' },
  { icon: IconCoin, title: 'Conserto caro', text: 'retrabalho e reforma' },
]

export function ProblemSolution() {
  return (
    <section className="relative mt-24 overflow-hidden bg-[#12070a] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(229,72,77,0.25),transparent_60%)]" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 md:grid-cols-2 md:py-28">
        <Reveal>
          <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] shadow-lift">
            <Image src="/img/gen/problema.jpg" alt="Parafuso de telha enferrujado com borracha ressecada" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute left-4 top-4 flex flex-col gap-2">
              {CAUSES.map(({ icon: Icon, text }, i) => (
                <motion.span
                  key={text}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.25 }}
                  className="flex w-fit items-center gap-2 rounded-full bg-navy/90 px-3 py-1.5 text-xs font-semibold"
                >
                  <Icon className="h-4 w-4 text-cyan" /> {text}
                </motion.span>
              ))}
            </div>
            <motion.span
              initial={{ scale: 0, rotate: -12 }}
              whileInView={{ scale: 1, rotate: -4 }}
              viewport={{ once: true }}
              transition={{ delay: 1.1, type: 'spring', stiffness: 260, damping: 12 }}
              className="absolute bottom-6 right-6 rounded-xl bg-danger px-4 py-2 font-display text-2xl font-extrabold italic tracking-wide"
            >
              FERRUGEM
            </motion.span>
          </div>
        </Reveal>

        <div>
          <Reveal>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-danger">O problema começa no parafuso</p>
            <h2 className="mt-3 font-display text-4xl font-extrabold leading-tight md:text-6xl">
              Goteira no telhado? <span className="text-cyan">De novo?</span>
            </h2>
            <p className="mt-4 text-lg text-white/70">
              A borracha de vedação fica exposta ao sol, resseca e racha. A água entra, o parafuso enferruja
              e o <strong className="text-white">prejuízo só cresce</strong>.
            </p>
          </Reveal>
          <div className="mt-8 space-y-3">
            {LOSSES.map(({ icon: Icon, title, text }, i) => (
              <Reveal key={title} delay={0.15 * i}>
                <div className="flex items-center gap-3 rounded-2xl bg-white p-3 pr-5 text-navy">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-danger/10 text-danger">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-display font-bold">{title}</p>
                    <p className="text-xs text-muted">{text}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.4}>
            <div className="mt-8 rounded-2xl border border-cyan/30 bg-cyan/10 p-5">
              <p className="font-display text-xl font-bold">
                Evite tudo isso com <span className="text-cyan">Veipar</span>.
              </p>
              <p className="mt-1 text-sm text-white/70">
                A tampa cobre o parafuso inteiro e a cavidade na aba guarda o PU protegido do ressecamento.
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
