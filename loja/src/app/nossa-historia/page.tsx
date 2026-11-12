import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { InstagramReels } from '@/components/home/instagram-reels'
import { PatentBanner } from '@/components/home/patent-banner'
import { SectionTitle } from '@/components/home/section-title'
import { StoryHero } from '@/components/story/story-hero'
import { Timeline } from '@/components/story/timeline'
import { IconArrow, IconYouTube } from '@/components/ui/icons'
import { Reveal } from '@/components/ui/reveal'
import { SOCIAL, STATS } from '@/lib/brand'

export const metadata: Metadata = {
  title: 'Nossa história · Veimar Alves',
  description: 'Conheça Veimar Antonio Alves, inventor do protetor de parafuso e do bico injetor Veipar, registrados no INPI.',
}

// Frases do próprio Veimar nas legendas do @veiparbrasil.
const QUOTES = [
  { text: 'Sabia que eu sou o criador dessa tampa de parafuso e desse bico injetor de PU.', image: '/img/ig/DfM_B5OKVD2.jpg' },
  { text: 'Somos referência porque criamos nossos próprios produtos.', image: '/img/ig/DfZaVuDqerI.jpg' },
  { text: 'A Veipar é uma empresa focada em resolver problemas.', image: '/img/ig/DfDdD4dJXe4.jpg' },
]

const GALLERY = ['DfQREPCJf2z', 'DffFDuhqWPM', 'DfXT2osqhmN', 'DfceKaLqw7I', 'DfpFm9JKQTa', 'Dfj4RWQqPNf']

const VALUES = [
  { title: 'Missão', text: 'Proporcionar a solução definitiva para telhados, evitando problemas de infiltração e reparos frequentes com produtos inovadores e eficientes.' },
  { title: 'Visão', text: 'Ser referência no mercado de proteção para telhados, reconhecida pela qualidade e eficácia de nossas soluções patenteadas.' },
  { title: 'Valores', text: 'Excelência na fabricação de tampas com tecnologia exclusiva e patenteada, garantindo uma vedação eficiente e padronizada.' },
]

export default function NossaHistoria() {
  return (
    <>
      <StoryHero />

      {/* Origem */}
      <section className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-24 md:grid-cols-2">
        <Reveal className="relative">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] shadow-lift">
            <Image src="/img/ig/DfM_B5OKVD2.jpg" alt="Veimar Alves instalando Veipar no telhado" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
          </div>
          <div className="absolute -bottom-6 -right-2 w-48 rotate-3 overflow-hidden rounded-2xl border-4 border-white shadow-lift md:-right-8 md:w-56">
            <div className="relative aspect-square">
              <Image src="/img/brand/peca-marrom.jpg" alt="Protetor Veipar marrom" fill sizes="224px" className="object-cover" />
            </div>
          </div>
        </Reveal>
        <div>
          <SectionTitle eyebrow="Como tudo começou" title={<>O problema estava <span className="text-royal">no parafuso</span></>} />
          <Reveal delay={0.1}>
            <div className="mt-6 space-y-4 text-lg leading-relaxed text-muted">
              <p>
                Veimar Alves vive o dia a dia das <strong className="text-foreground">coberturas metálicas</strong>: telhados, calhas, rufos.
                E, obra após obra, via o mesmo defeito voltar.
              </p>
              <p>
                O parafuso da telha fica exposto ao sol, à poeira e à chuva. A borracha de vedação resseca, o PU racha,
                o parafuso enferruja e o furo vira caminho para a água. Era goteira de novo.
              </p>
              <p>
                Em vez de remendar, ele criou uma tampa de aço que cobre o parafuso inteiro e tem uma{' '}
                <strong className="text-foreground">cavidade na aba que guarda o PU protegido</strong>. Depois veio o bico
                injetor, para aplicar o selante direto da bisnaga. Assim nasceu a Veipar, em Francisco Beltrão (PR).
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Frases */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-4">
          <SectionTitle center eyebrow="Nas palavras dele" title="Quem inventa, explica" />
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {QUOTES.map((q, i) => (
              <Reveal key={q.text} delay={i * 0.12}>
                <figure className="group relative h-full overflow-hidden rounded-[var(--radius-card)] bg-navy text-white shadow-lift">
                  <div className="relative aspect-[4/3]">
                    <Image src={q.image} alt="" fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover opacity-70 transition duration-700 group-hover:scale-105 group-hover:opacity-90" />
                    <div className="absolute inset-0 bg-gradient-to-t from-navy to-transparent" />
                  </div>
                  <blockquote className="relative -mt-10 p-6 font-display text-xl font-semibold leading-snug">
                    <span className="mb-2 block font-display text-6xl leading-none text-cyan">“</span>
                    {q.text}
                  </blockquote>
                  <figcaption className="px-6 pb-6 text-sm text-white/55">Veimar Alves · @veiparbrasil</figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Linha do tempo */}
      <section className="relative overflow-hidden bg-navy py-24 text-white">
        <div className="blueprint-grid absolute inset-0" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-4">
          <SectionTitle dark center eyebrow="Linha do tempo" title="Da obra para o INPI" />
          <Timeline />
        </div>
      </section>

      {/* Galeria */}
      <section className="mx-auto max-w-7xl px-4 py-24">
        <SectionTitle
          eyebrow="Na obra"
          title="Todo dia em cima de um telhado"
          action={
            <a href={SOCIAL.youtube} target="_blank" rel="noopener" className="inline-flex items-center gap-2 rounded-full bg-[#ff0033] px-5 py-3 font-semibold text-white">
              <IconYouTube className="h-5 w-5" /> {STATS.youtubeSubscribers} no YouTube
            </a>
          }
        />
        <div className="mt-10 columns-2 gap-4 md:columns-3">
          {GALLERY.map((code, i) => (
            <Reveal key={code} delay={(i % 3) * 0.1} className="mb-4 break-inside-avoid">
              <div className={`relative overflow-hidden rounded-[var(--radius-card)] shadow-soft ${i % 3 === 1 ? 'aspect-[3/4]' : 'aspect-[9/14]'}`}>
                <Image src={`/img/ig/${code}.jpg`} alt="Veipar em obra" fill sizes="(min-width: 768px) 33vw, 50vw" className="object-cover transition duration-700 hover:scale-105" />
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Missão, visão, valores */}
      <section className="mx-auto max-w-7xl px-4">
        <div className="grid gap-5 md:grid-cols-3">
          {VALUES.map((v, i) => (
            <Reveal key={v.title} delay={i * 0.1}>
              <div className="h-full rounded-[var(--radius-card)] bg-white p-8 shadow-soft">
                <p className="font-display text-sm font-bold uppercase tracking-widest text-royal">{v.title}</p>
                <p className="mt-3 text-lg leading-relaxed">{v.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <PatentBanner />
      <InstagramReels />

      <section className="mx-auto max-w-7xl px-4 py-24 text-center">
        <Reveal>
          <h2 className="font-display text-4xl font-extrabold md:text-6xl">Bora acabar com a goteira?</h2>
          <p className="mt-3 text-lg text-muted">O mesmo protetor que o Veimar instala, direto da loja oficial.</p>
          <Link href="/collections/veipar" className="btn-shine mt-8 inline-flex items-center gap-2 rounded-full bg-royal px-8 py-4 font-semibold text-white">
            Ver protetores <IconArrow className="h-5 w-5" />
          </Link>
        </Reveal>
      </section>
    </>
  )
}
