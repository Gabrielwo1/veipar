'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { registrar, track } from '@/lib/pixel'

// Código do Facebook Pixel exatamente como veio do Gerenciador de Eventos (nov/2026). Vai no <head>
// do HTML do servidor: o Meta lê o HTML para confirmar que o pixel está no site.
const PIXEL_BASE = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js'); fbq('init', '2377503623087155'); fbq('track', 'PageView');`

export function MetaPixelHead() {
  return <script id="meta-pixel" dangerouslySetInnerHTML={{ __html: PIXEL_BASE }} />
}

export function MetaPixel() {
  const pathname = usePathname()
  const first = useRef(true)

  // O init já manda o primeiro PageView; nas navegações do app mandamos de novo.
  useEffect(() => {
    if (first.current) {
      first.current = false
      registrar('PageView')
      return
    }
    track('PageView')
  }, [pathname])

  return (
    <>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img height="1" width="1" style={{ display: 'none' }} alt="" src="https://www.facebook.com/tr?id=2377503623087155&ev=PageView&noscript=1" />
      </noscript>
    </>
  )
}

// Dispara ViewContent ao abrir a página de um produto.
export function TrackViewContent({ variantId, name, value }: { variantId: string; name: string; value: number }) {
  useEffect(() => {
    track('ViewContent', { content_ids: [variantId], content_type: 'product', content_name: name, value, currency: 'BRL' })
  }, [variantId, name, value])
  return null
}
