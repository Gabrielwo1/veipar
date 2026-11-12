import Image from 'next/image'
import Link from 'next/link'
import { CATEGORIES } from '@/lib/brand'
import { IconArrow } from '../ui/icons'
import { Reveal } from '../ui/reveal'
import { SectionTitle } from './section-title'

export function Categories() {
  return (
    <section className="mx-auto max-w-7xl px-4 pt-20">
      <SectionTitle eyebrow="Escolha pelo seu telhado" title="Uma proteção para cada telha" />
      <div className="no-scrollbar -mx-4 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-4 md:overflow-visible md:px-0">
        {CATEGORIES.map((c, i) => (
          <Reveal key={c.href} delay={i * 0.08} className="w-[72%] shrink-0 snap-start sm:w-[45%] md:w-auto">
            <Link href={c.href} className="group relative block aspect-[3/4] overflow-hidden rounded-[var(--radius-card)] shadow-soft">
              <Image src={c.image} alt={c.title} fill sizes="(min-width: 768px) 25vw, 72vw"
                className="object-cover transition duration-700 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-navy/95 via-navy/30 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                <p className="text-xs font-semibold uppercase tracking-widest text-cyan">{c.subtitle}</p>
                <div className="mt-1 flex items-end justify-between gap-2">
                  <h3 className="font-display text-2xl font-bold leading-tight">{c.title}</h3>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 transition group-hover:bg-cyan group-hover:text-navy">
                    <IconArrow className="h-5 w-5 transition group-hover:translate-x-0.5" />
                  </span>
                </div>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
