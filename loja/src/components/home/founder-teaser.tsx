import Image from 'next/image'
import Link from 'next/link'
import { IconArrow } from '../ui/icons'
import { Reveal } from '../ui/reveal'

export function FounderTeaser() {
  return (
    <section className="mx-auto max-w-7xl px-4 pt-24">
      <div className="relative overflow-hidden rounded-[2rem] bg-navy text-white">
        <Image src="/img/gen/oficina.jpg" alt="" fill sizes="100vw" className="object-cover opacity-35" />
        <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/80 to-transparent" />
        <div className="relative grid items-center gap-10 p-8 md:grid-cols-[1.2fr_1fr] md:p-14">
          <Reveal>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan">Quem criou o Veipar</p>
            <blockquote className="mt-4 font-display text-3xl font-bold leading-tight md:text-5xl">
              “Sabia que eu sou o criador dessa tampa de parafuso e desse bico injetor de PU.”
            </blockquote>
            <p className="mt-4 text-white/70">
              Veimar Alves, inventor do protetor e do bico injetor. A Veipar nasceu em Francisco Beltrão (PR), feita por quem conhece telhado metálico na prática.
            </p>
            <Link href="/nossa-historia" className="btn-shine mt-8 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 font-semibold text-navy hover:bg-cyan">
              Conheça a história <IconArrow className="h-5 w-5" />
            </Link>
          </Reveal>
          <Reveal delay={0.15} className="relative mx-auto w-full max-w-xs">
            <div className="relative aspect-[9/14] overflow-hidden rounded-[1.75rem] border-4 border-white/10 shadow-lift">
              <Image src="/img/ig/DfM_B5OKVD2.jpg" alt="Veimar Alves no telhado" fill sizes="320px" className="object-cover" />
            </div>
            <div className="absolute -bottom-5 -right-4 rounded-2xl bg-cyan px-4 py-3 font-display font-bold text-navy shadow-lift">
              2 registros no INPI
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
