// Meta Pixel (Facebook). O PageView inicial sai no script de init; os demais eventos usam track().
// Cada evento também vai para /api/evento, que alimenta o /painel.
export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || '2377503623087155'

type Fbq = (cmd: 'track' | 'init', event: string, params?: Record<string, unknown>) => void
type PixelEvent = 'PageView' | 'ViewContent' | 'AddToCart' | 'InitiateCheckout'

export function track(event: PixelEvent, params?: Record<string, unknown>) {
  if (typeof window === 'undefined') return
  const fbq = (window as unknown as { fbq?: Fbq }).fbq
  fbq?.('track', event, params)
  registrar(event, params)
}

// ID numérico da variante, que é o mesmo do catálogo da Shopify no Meta.
export function contentId(gid: string) {
  return gid.split('/').pop() ?? gid
}

const TIPO: Record<PixelEvent, string> = {
  PageView: 'page_view',
  ViewContent: 'view_item',
  AddToCart: 'add_to_cart',
  InitiateCheckout: 'begin_checkout',
}

function guardado(storage: Storage, key: string, criar: () => string) {
  try {
    const atual = storage.getItem(key)
    if (atual) return atual
    const novo = criar()
    storage.setItem(key, novo)
    return novo
  } catch {
    return criar()
  }
}

// De onde a sessão veio: utm_source, senão o site que mandou para cá, senão "direto".
function origemDaSessao() {
  const url = new URL(window.location.href)
  const utm = url.searchParams.get('utm_source')
  const campanha = url.searchParams.get('utm_campaign') ?? ''
  if (utm) return { origem: utm, campanha }
  if (url.searchParams.has('fbclid')) return { origem: 'facebook', campanha }
  if (url.searchParams.has('gclid')) return { origem: 'google ads', campanha }
  try {
    const ref = new URL(document.referrer).hostname.replace(/^www\.|^m\.|^l\./, '')
    if (ref && ref !== window.location.hostname) return { origem: ref.split('.').slice(-2, -1)[0] || ref, campanha }
  } catch {}
  return { origem: 'direto', campanha }
}

export function registrar(event: PixelEvent, params?: Record<string, unknown>) {
  if (typeof window === 'undefined' || window.location.pathname.startsWith('/painel')) return
  const id = () => crypto.randomUUID()
  const visitante = guardado(localStorage, 'veipar-visitante', id)
  const sessao = guardado(sessionStorage, 'veipar-sessao', id)
  const { origem, campanha } = JSON.parse(guardado(sessionStorage, 'veipar-origem', () => JSON.stringify(origemDaSessao())))

  const body = JSON.stringify({
    tipo: TIPO[event],
    visitante,
    sessao,
    caminho: window.location.pathname,
    produto: (params?.content_name as string) ?? null,
    valor: params?.value ?? null,
    origem,
    campanha,
  })
  if (!navigator.sendBeacon?.('/api/evento', new Blob([body], { type: 'application/json' }))) {
    fetch('/api/evento', { method: 'POST', body, keepalive: true }).catch(() => {})
  }
}
