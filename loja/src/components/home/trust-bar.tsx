import { IconCard, IconPatent, IconShield, IconTruck } from '../ui/icons'
import { Reveal } from '../ui/reveal'

const ITEMS = [
  { icon: IconPatent, title: 'Patenteado', text: 'Registros no INPI' },
  { icon: IconShield, title: 'Galvalume AZ 150', text: 'Aço nacional, alta durabilidade' },
  { icon: IconTruck, title: 'Todo o Brasil', text: 'Envio pelos Correios' },
  { icon: IconCard, title: 'Compra segura', text: 'Checkout oficial da Shopify' },
]

export function TrustBar() {
  return (
    <section className="relative z-10 mx-auto -mt-10 max-w-7xl px-4">
      <Reveal>
        <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-card)] bg-border shadow-lift md:grid-cols-4">
          {ITEMS.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex items-center gap-3 bg-white p-4 md:p-6">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-ice text-royal">
                <Icon className="h-6 w-6" />
              </span>
              <div>
                <p className="font-display text-sm font-bold md:text-base">{title}</p>
                <p className="text-xs text-muted">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  )
}
