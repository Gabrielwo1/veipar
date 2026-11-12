import { whatsappLink } from '@/lib/brand'
import { IconWhatsApp } from './ui/icons'

export function WhatsAppFab() {
  return (
    <a
      href={whatsappLink()}
      target="_blank"
      rel="noopener"
      aria-label="Falar no WhatsApp"
      className="group fixed bottom-5 right-5 z-30 flex items-center gap-2 rounded-full bg-success p-3.5 text-white shadow-lift transition hover:pr-5"
    >
      <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-success/40 [animation-duration:2.5s]" aria-hidden />
      <IconWhatsApp className="h-7 w-7" />
      <span className="hidden max-w-0 overflow-hidden whitespace-nowrap text-sm font-semibold transition-all duration-300 group-hover:max-w-40 md:inline">
        Fale com a gente
      </span>
    </a>
  )
}
