import { whatsappLink } from '@/lib/brand'
import { IconPlus, IconWhatsApp } from '../ui/icons'
import { Reveal } from '../ui/reveal'
import { SectionTitle } from './section-title'

// Só respostas publicadas pela Veipar (site e base de conhecimento do atendimento).
const QUESTIONS = [
  {
    q: 'Para qual tipo de telha serve?',
    a: 'Para telhas metálicas de aço. O modelo natural e o colorido são para telha trapezoidal; para telha ondulada de aço use o modelo Ondulada. Ficou em dúvida sobre a sua? Chame no WhatsApp com uma foto.',
  },
  {
    q: 'Do que é feito o protetor?',
    a: 'Aço Galvalume AZ 150 (aço nacional). Os coloridos têm pintura epóxi nas cores marrom cerâmica, preto e branco. Medidas: 11 mm de altura × 35 mm de diâmetro.',
  },
  {
    q: 'Como instala?',
    a: 'Coloque PU na cavidade da tampa (o bico injetor Veipar facilita), encaixe sobre o parafuso e dê uma leve girada. Não precisa de ferramenta especial.',
  },
  {
    q: 'Precisa de PU?',
    a: 'Sim. A tampa é colada com PU (selante de poliuretano) de construção. A cavidade na aba guarda o PU protegido do sol, evitando o ressecamento. Nos kits já vai PU e bico injetor.',
  },
  {
    q: 'Vocês entregam na minha cidade?',
    a: 'Enviamos para todo o Brasil. Calcule o frete com seu CEP na página do produto ou no carrinho.',
  },
  {
    q: 'Vende para revenda e obra grande?',
    a: 'Sim. Os pacotes de 1.000 e 2.500 peças têm o menor preço por peça. Para volumes maiores, fale com a gente no WhatsApp.',
  },
]

export function Faq() {
  return (
    <section id="duvidas" className="mx-auto grid max-w-7xl scroll-mt-24 gap-10 px-4 pt-24 md:grid-cols-[1fr_1.4fr]">
      <div>
        <SectionTitle eyebrow="Dúvidas frequentes" title="Perguntou, a Veipar responde" />
        <Reveal delay={0.1}>
          <a href={whatsappLink('Olá! Tenho uma dúvida sobre o protetor Veipar.')} target="_blank" rel="noopener"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-success px-6 py-3.5 font-semibold text-white hover:brightness-110">
            <IconWhatsApp className="h-5 w-5" /> Tirar dúvida no WhatsApp
          </a>
        </Reveal>
      </div>
      <div className="space-y-3">
        {QUESTIONS.map((item, i) => (
          <Reveal key={item.q} delay={i * 0.05}>
            <details className="group rounded-2xl bg-surface p-5 shadow-soft open:shadow-lift">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-lg font-semibold">
                {item.q}
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ice text-royal transition group-open:rotate-45 group-open:bg-royal group-open:text-white">
                  <IconPlus className="h-4 w-4" />
                </span>
              </summary>
              <p className="mt-3 text-muted">{item.a}</p>
            </details>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
