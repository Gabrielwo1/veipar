// Meta Pixel (Facebook). O PageView inicial sai no script de init; os demais eventos usam track().
export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || '2377503623087155'

type Fbq = (cmd: 'track' | 'init', event: string, params?: Record<string, unknown>) => void

export function track(event: 'PageView' | 'ViewContent' | 'AddToCart' | 'InitiateCheckout', params?: Record<string, unknown>) {
  if (typeof window === 'undefined') return
  const fbq = (window as unknown as { fbq?: Fbq }).fbq
  fbq?.('track', event, params)
}

// ID numérico da variante, que é o mesmo do catálogo da Shopify no Meta.
export function contentId(gid: string) {
  return gid.split('/').pop() ?? gid
}
