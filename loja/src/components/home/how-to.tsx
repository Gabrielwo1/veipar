import Image from 'next/image'
import { Reveal } from '../ui/reveal'
import { SectionTitle } from './section-title'

// Os três passos do reels, com fotos reais de obra do @veiparbrasil.
const STEPS = [
  { n: 1, title: 'PU com o bico injetor', text: 'Rosqueie o bico Veipar na bisnaga e encha a cavidade da tampa.', image: '/img/ig/DfQREPCJf2z.jpg' },
  { n: 2, title: 'Encaixe sobre o parafuso', text: 'Coloque a tampa por cima da cabeça do parafuso da telha.', image: '/img/ig/DfaiNFRJ7mF.jpg' },
  { n: 3, title: 'Uma leve girada', text: 'Gire de leve para espalhar o PU e vedar. Pronto!', image: '/img/ig/DfXT2osqhmN.jpg' },
]

export function HowTo() {
  return (
    <section id="como-instalar" className="mx-auto max-w-7xl scroll-mt-24 px-4 pt-24">
      <SectionTitle center eyebrow="Aplicação simples e rápida" title="Instala em 3 passos" text="Sem ferramenta especial. Funciona em telha trapezoidal e ondulada de aço." />
      <ol className="mt-12 grid gap-5 md:grid-cols-3">
        {STEPS.map((s, i) => (
          <Reveal key={s.n} delay={i * 0.12}>
            <li className="group relative overflow-hidden rounded-[var(--radius-card)] bg-surface shadow-soft">
              <div className="relative aspect-[4/5] overflow-hidden">
                <Image src={s.image} alt={s.title} fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover transition duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/20 to-transparent" />
                <span className="absolute left-4 top-4 flex h-12 w-12 items-center justify-center rounded-full bg-white font-display text-xl font-extrabold text-royal shadow-lift">
                  {s.n}
                </span>
                <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                  <h3 className="font-display text-2xl font-bold">{s.title}</h3>
                  <p className="mt-1 text-sm text-white/75">{s.text}</p>
                </div>
              </div>
            </li>
          </Reveal>
        ))}
      </ol>
    </section>
  )
}
