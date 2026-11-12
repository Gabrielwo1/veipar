import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import Link from 'next/link'
import { Suspense } from 'react'
import { CartLink } from '@/components/cart-link'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })

export const metadata: Metadata = {
  title: { default: 'Veipar · Protetor de parafuso de telha', template: '%s · Veipar' },
  description: 'Protetores de parafuso para telha metálica em aço Galvalume. Fim das infiltrações e da ferrugem.',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <header className="sticky top-0 z-10 border-b border-border bg-surface/95 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
            <Link href="/" className="text-xl font-extrabold tracking-tight">
              VEI<span className="text-brand">PAR</span>
            </Link>
            <nav className="flex items-center gap-5 text-sm font-medium">
              <Link href="/collections/colecao-veipar" className="hover:text-brand">Produtos</Link>
              <Link href="/collections/combos" className="hover:text-brand">Combos</Link>
              <Suspense fallback={<span className="text-muted">Carrinho</span>}>
                <CartLink />
              </Suspense>
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-border bg-surface">
          <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-muted">
            © Veipar · Pagamento seguro pelo checkout da Shopify
          </div>
        </footer>
      </body>
    </html>
  )
}
