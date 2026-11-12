import type { Metadata } from 'next'
import { DM_Sans, Jost } from 'next/font/google'
import { Suspense } from 'react'
import { CartButton, CartLink } from '@/components/cart-link'
import { MetaPixel } from '@/components/meta-pixel'
import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'
import { WhatsAppFab } from '@/components/whatsapp-fab'
import './globals.css'

// Mesmas fontes do site atual da Veipar.
const jost = Jost({ variable: '--font-jost', subsets: ['latin'], weight: ['500', '600', '700', '800'] })
const dmSans = DM_Sans({ variable: '--font-dm-sans', subsets: ['latin'] })

export const metadata: Metadata = {
  title: { default: 'Veipar · Proteção para parafusos de telhas', template: '%s · Veipar' },
  description:
    'Protetor de parafuso de telha patenteado, em aço Galvalume AZ 150. Acaba com goteira, ferrugem e borracha ressecada. Envio para todo o Brasil.',
  icons: { icon: '/img/brand/logo.png' },
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="pt-BR" className={`${jost.variable} ${dmSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <SiteHeader
          cart={
            <Suspense fallback={<CartButton count={0} />}>
              <CartLink />
            </Suspense>
          }
        />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        <WhatsAppFab />
        <MetaPixel />
      </body>
    </html>
  )
}
