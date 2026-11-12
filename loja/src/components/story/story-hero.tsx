'use client'

import Image from 'next/image'
import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'

export function StoryHero() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '30%'])
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.15])
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, 0])

  return (
    <section ref={ref} className="relative isolate flex min-h-[88vh] items-end overflow-hidden bg-navy text-white">
      <motion.div className="absolute inset-0 -z-10" style={{ y, scale }}>
        <Image src="/img/gen/oficina.jpg" alt="Oficina de calhas e coberturas metálicas" fill priority sizes="100vw" className="object-cover" />
      </motion.div>
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-navy via-navy/60 to-navy/10" />

      <motion.div style={{ opacity: fade }} className="mx-auto w-full max-w-7xl px-4 pb-20">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs font-bold uppercase tracking-[0.25em] text-cyan"
        >
          Nossa história
        </motion.p>
        <h1 className="mt-4 max-w-4xl font-display text-5xl font-extrabold leading-[0.98] tracking-tight md:text-8xl">
          {['Criado', 'por', 'quem', 'sobe', 'no', 'telhado.'].map((w, i) => (
            <motion.span
              key={i}
              className={`mr-[0.22em] inline-block ${i >= 3 ? 'text-gradient' : ''}`}
              initial={{ opacity: 0, y: 60, rotate: 4 }}
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              transition={{ delay: 0.1 + i * 0.09, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              {w}
            </motion.span>
          ))}
        </h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="mt-6 max-w-xl text-lg text-white/75"
        >
          A história de Veimar Antonio Alves, o inventor da tampa de parafuso e do bico injetor Veipar.
        </motion.p>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, y: [0, 8, 0] }}
          transition={{ delay: 1.4, y: { repeat: Infinity, duration: 2 } }}
          className="mt-12 h-12 w-7 rounded-full border-2 border-white/40 p-1.5"
          aria-hidden
        >
          <div className="mx-auto h-2.5 w-1.5 rounded-full bg-cyan" />
        </motion.div>
      </motion.div>
    </section>
  )
}
