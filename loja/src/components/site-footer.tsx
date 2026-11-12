import Image from 'next/image'
import Link from 'next/link'
import { ADDRESS, SOCIAL, whatsappLink } from '@/lib/brand'
import { IconFacebook, IconInstagram, IconTikTok, IconWhatsApp, IconYouTube } from './ui/icons'

const COLUMNS = [
  {
    title: 'Loja',
    links: [
      { href: '/collections/veipar', label: 'Protetores' },
      { href: '/collections/combos', label: 'Kits com PU' },
      { href: '/collections/acessorios-auxiliar', label: 'Bico injetor' },
      { href: '/collections/colecao-veipar', label: 'Ver tudo' },
    ],
  },
  {
    title: 'Veipar',
    links: [
      { href: '/nossa-historia', label: 'Nossa história' },
      { href: '/#patente', label: 'Tecnologia patenteada' },
      { href: '/#como-instalar', label: 'Como instalar' },
      { href: '/#duvidas', label: 'Dúvidas frequentes' },
    ],
  },
  {
    title: 'Ajuda',
    links: [
      { href: 'https://veipar.com.br/policies/refund-policy', label: 'Trocas e devoluções' },
      { href: 'https://veipar.com.br/policies/privacy-policy', label: 'Privacidade' },
      { href: 'https://veipar.com.br/policies/terms-of-service', label: 'Termos de serviço' },
      { href: 'https://veipar.com.br/policies/contact-information', label: 'Contato' },
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden bg-navy text-white">
      <div className="blueprint-grid absolute inset-0 opacity-60" aria-hidden />
      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-16 md:grid-cols-[1.3fr_repeat(3,1fr)]">
        <div>
          <Image src="/img/brand/logo-wordmark-branco.png" alt="Veipar" width={170} height={64} className="h-12 w-auto" />
          <p className="mt-4 max-w-xs text-sm text-white/65">
            Proteção para parafusos de telhas. Criado por quem sobe no telhado, de Francisco Beltrão (PR) para todo o Brasil.
          </p>
          <a
            href={whatsappLink()}
            target="_blank"
            rel="noopener"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-success px-5 py-3 text-sm font-semibold text-white hover:brightness-110"
          >
            <IconWhatsApp className="h-5 w-5" /> Fale com a Veipar
          </a>
          <div className="mt-6 flex gap-3">
            {[
              { href: SOCIAL.instagram, icon: IconInstagram, label: 'Instagram' },
              { href: SOCIAL.youtube, icon: IconYouTube, label: 'YouTube' },
              { href: SOCIAL.tiktok, icon: IconTikTok, label: 'TikTok' },
              { href: SOCIAL.facebook, icon: IconFacebook, label: 'Facebook' },
            ].map(({ href, icon: Icon, label }) => (
              <a key={label} href={href} target="_blank" rel="noopener" aria-label={label}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition hover:bg-cyan hover:text-navy">
                <Icon className="h-5 w-5" />
              </a>
            ))}
          </div>
        </div>
        {COLUMNS.map((c) => (
          <div key={c.title}>
            <h3 className="font-display text-sm font-semibold uppercase tracking-widest text-cyan">{c.title}</h3>
            <ul className="mt-4 space-y-3 text-sm text-white/75">
              {c.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-white">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="relative border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-xs text-white/50 md:flex-row md:justify-between">
          <span>© Veipar · {ADDRESS}</span>
          <span>Pagamento processado pelo checkout seguro da Shopify</span>
        </div>
      </div>
    </footer>
  )
}
