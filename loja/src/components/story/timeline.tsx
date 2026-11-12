'use client'

import { useRef } from 'react'
import { motion, useScroll } from 'motion/react'

// Datas dos registros no INPI (Google Patents) e números públicos das redes, nov/2026.
const EVENTS = [
  { date: 'Jan 2022', title: 'Nasce o protetor', text: 'É depositado no INPI o pedido de modelo de utilidade “Protetor de parafuso” (BR 20 2022 000136-1), com Veimar entre os inventores.' },
  { date: 'Jul 2023', title: 'Pedido publicado', text: 'O INPI publica o pedido do protetor. A tampa com cavidade para o PU vira o grande diferencial da Veipar.' },
  { date: 'Jun 2025', title: 'O bico injetor', text: 'Para aplicar o PU na medida certa, ele cria um bico que rosqueia direto na bisnaga e deposita o segundo registro.' },
  { date: 'Abr 2026', title: 'Patente concedida', text: 'O INPI concede o modelo de utilidade do bico injetor (BR 20 2025 011653).' },
  { date: 'Hoje', title: 'De Francisco Beltrão para o Brasil', text: 'Mais de 99 mil seguidores no Instagram, 30 mil inscritos no YouTube e envios para todo o país.' },
]

export function Timeline() {
  const ref = useRef<HTMLOListElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 75%', 'end 60%'] })

  return (
    <ol ref={ref} className="relative mx-auto mt-14 max-w-3xl">
      <div className="absolute bottom-0 left-[19px] top-0 w-0.5 bg-white/10 md:left-1/2" aria-hidden />
      <motion.div
        className="absolute left-[19px] top-0 w-0.5 origin-top bg-gradient-to-b from-cyan to-royal md:left-1/2"
        style={{ scaleY: scrollYProgress, height: '100%' }}
        aria-hidden
      />
      {EVENTS.map((e, i) => (
        <li key={e.date} className={`relative mb-10 pl-14 md:w-1/2 md:pl-0 ${i % 2 ? 'md:ml-auto md:pl-12' : 'md:pr-12 md:text-right'}`}>
          <motion.span
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
            className={`absolute left-[11px] top-1 h-[18px] w-[18px] rounded-full border-4 border-navy bg-cyan ring-4 ring-cyan/20 ${
              i % 2 ? 'md:left-[-9px]' : 'md:left-auto md:right-[-9px]'
            }`}
          />
          <motion.div
            initial={{ opacity: 0, x: i % 2 ? 30 : -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
          >
            <p className="font-display text-sm font-bold uppercase tracking-widest text-cyan">{e.date}</p>
            <h3 className="mt-1 font-display text-2xl font-bold">{e.title}</h3>
            <p className="mt-2 text-white/65">{e.text}</p>
          </motion.div>
        </li>
      ))}
    </ol>
  )
}
