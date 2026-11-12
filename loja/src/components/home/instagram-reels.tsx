'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { REELS, SOCIAL, STATS, type Reel } from '@/lib/brand'
import { IconArrow, IconClose, IconInstagram, IconPlay } from '../ui/icons'
import { Reveal } from '../ui/reveal'

// Capas servidas daqui (rápido); o vídeo só carrega o embed oficial do Instagram quando a pessoa toca.
export function InstagramReels() {
  const [active, setActive] = useState<Reel | null>(null)
  const track = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!active) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setActive(null)
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [active])

  const scroll = (dir: 1 | -1) => track.current?.scrollBy({ left: dir * track.current.clientWidth * 0.8, behavior: 'smooth' })

  return (
    <section className="relative mt-24 overflow-hidden bg-gradient-to-b from-navy-2 to-navy py-20 text-white md:py-28">
      <div className="absolute -left-40 top-0 h-96 w-96 rounded-full bg-royal/40 blur-3xl" aria-hidden />
      <div className="absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-cyan/20 blur-3xl" aria-hidden />

      <div className="relative mx-auto max-w-7xl px-4">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-xl">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-cyan">
                <IconInstagram className="h-4 w-4" /> @veiparbrasil
              </p>
              <h2 className="mt-2 font-display text-3xl font-bold leading-tight md:text-5xl">Veipar na obra, de verdade</h2>
              <p className="mt-3 text-white/65">
                Telhados reais, goteiras reais. Mais de {STATS.instagramFollowers} pessoas acompanham a gente resolvendo no Instagram.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => scroll(-1)} aria-label="Voltar" className="hidden h-12 w-12 items-center justify-center rounded-full border border-white/20 transition hover:bg-white/10 md:flex">
                <IconArrow className="h-5 w-5 rotate-180" />
              </button>
              <button onClick={() => scroll(1)} aria-label="Avançar" className="hidden h-12 w-12 items-center justify-center rounded-full border border-white/20 transition hover:bg-white/10 md:flex">
                <IconArrow className="h-5 w-5" />
              </button>
              <a href={SOCIAL.instagram} target="_blank" rel="noopener"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#f58529] via-[#dd2a7b] to-[#8134af] px-5 py-3 text-sm font-semibold">
                <IconInstagram className="h-5 w-5" /> Seguir
              </a>
            </div>
          </div>
        </Reveal>
      </div>

      <div
        ref={track}
        className="no-scrollbar relative mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-4"
        // Alinha o primeiro card com o container de 80rem e deixa o carrossel vazar à direita.
        style={{ paddingInline: 'max(1rem, calc((100vw - 80rem) / 2 + 1rem))', scrollPaddingInline: 'max(1rem, calc((100vw - 80rem) / 2 + 1rem))' }}
      >
        {REELS.map((r, i) => (
          <motion.button
            key={r.code}
            onClick={() => setActive(r)}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.07, duration: 0.6 }}
            whileHover={{ y: -8 }}
            className="group relative aspect-[9/16] w-[62%] shrink-0 snap-start overflow-hidden rounded-[1.75rem] text-left shadow-lift sm:w-[38%] md:w-[22%] lg:w-[19%]"
            aria-label={`Assistir: ${r.title}`}
          >
            <Image src={`/img/ig/${r.code}.jpg`} alt="" fill sizes="(min-width: 1024px) 19vw, (min-width: 768px) 22vw, 62vw" className="object-cover transition duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-black/20" />
            <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/40 px-2.5 py-1 text-[11px] font-semibold backdrop-blur">
              <IconInstagram className="h-3.5 w-3.5" /> Reels
            </span>
            <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 backdrop-blur-md transition group-hover:scale-110 group-hover:bg-cyan">
              <IconPlay className="ml-1 h-7 w-7 text-white group-hover:text-navy" />
            </span>
            <p className="absolute inset-x-0 bottom-0 p-4 font-display text-[15px] font-semibold leading-snug">{r.title}</p>
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {active && (
          <motion.div className="fixed inset-0 z-[70] flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <button className="absolute inset-0 bg-black/80 backdrop-blur" aria-label="Fechar vídeo" onClick={() => setActive(null)} />
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative h-[min(80vh,760px)] w-[min(92vw,420px)]"
              role="dialog"
              aria-modal="true"
              aria-label={active.title}
            >
              <iframe
                src={`https://www.instagram.com/reel/${active.code}/embed/`}
                title={active.title}
                className="h-full w-full overflow-hidden rounded-3xl bg-white"
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
              />
              <button onClick={() => setActive(null)} aria-label="Fechar" className="absolute -top-14 right-0 rounded-full bg-white/15 p-3 text-white backdrop-blur hover:bg-white/25">
                <IconClose className="h-5 w-5" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
