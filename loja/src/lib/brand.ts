// Dados da marca usados em várias páginas. Tudo aqui foi conferido em fonte pública
// (site, Instagram @veiparbrasil, YouTube @veimaralvesoficial e Google Patents) em nov/2026.

export const WHATSAPP_NUMBER = '5546991233498'
export const whatsappLink = (text = 'Olá! Vim pelo site da Veipar e quero tirar uma dúvida.') =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`

export const SOCIAL = {
  instagram: 'https://www.instagram.com/veiparbrasil/',
  youtube: 'https://www.youtube.com/@veimaralvesoficial',
  tiktok: 'https://www.tiktok.com/@veiparbrasil',
  facebook: 'https://www.facebook.com/profile.php?id=61573957084510',
}

export const STATS = {
  instagramFollowers: '99 mil',
  youtubeSubscribers: '30 mil',
}

export const ADDRESS = 'Av. Natalino Faust · Francisco Beltrão – PR'

// Registros no INPI (Google Patents). O do protetor é pedido publicado; o do bico já foi concedido.
export const PATENTS = [
  {
    title: 'Protetor de parafuso',
    number: 'BR 20 2022 000136-1',
    status: 'Modelo de utilidade · pedido publicado em 2023',
    url: 'https://patents.google.com/patent/BR202022000136U2/pt',
  },
  {
    title: 'Bico injetor de PU',
    number: 'BR 20 2025 011653',
    status: 'Modelo de utilidade · concedido em 2026',
    url: 'https://patents.google.com/patent/BR202025011653Y1/pt',
  },
]

export type Category = { title: string; subtitle: string; href: string; image: string }

export const CATEGORIES: Category[] = [
  { title: 'Telha trapezoidal', subtitle: 'Protetor natural Galvalume', href: '/collections/veipar', image: '/img/gen/natural.jpg' },
  { title: 'Coloridos', subtitle: 'Marrom, preto ou branco', href: '/products/protetor-de-parafuso-de-telha-colorido-100-pecas', image: '/img/gen/coloridas.jpg' },
  { title: 'Telha ondulada', subtitle: 'Feito para a onda', href: '/products/protetor-de-parafuso-de-telha-onduladas-100-pecas', image: '/img/gen/ondulada.jpg' },
  { title: 'Kits com PU', subtitle: 'Protetor + PU + bico', href: '/collections/combos', image: '/img/gen/kit.jpg' },
]

// Banner de topo de cada coleção.
export const COLLECTION_BANNERS: Record<string, string> = {
  'colecao-veipar': '/img/gen/hero.jpg',
  veipar: '/img/gen/natural.jpg',
  combos: '/img/gen/kit.jpg',
  'acessorios-auxiliar': '/img/gen/patente.jpg',
}

// Reels do @veiparbrasil (capas baixadas em public/img/ig, vídeo pelo embed oficial do Instagram).
export type Reel = { code: string; title: string }
export const REELS: Reel[] = [
  { code: 'DfM_B5OKVD2', title: 'Sou o criador dessa tampa e do bico injetor' },
  { code: 'DfXT2osqhmN', title: 'Três passos para acabar com as goteiras' },
  { code: 'Dfj4RWQqPNf', title: 'Até o bigode ajudou na instalação' },
  { code: 'DfHcz1-q9WF', title: 'Telhado com todos os parafusos folgados' },
  { code: 'DfN1bWcpyVf', title: 'Borracha estourada e goteira? Resolvido' },
  { code: 'DfUaM-aqXJ-', title: 'Veja como é fácil instalar' },
  { code: 'DfmZo-fKbh4', title: 'A melhor escolha para o seu telhado' },
]

export const COUPON = {
  code: process.env.NEXT_PUBLIC_COUPON_CODE || 'VEIPAR10',
  label: process.env.NEXT_PUBLIC_COUPON_LABEL || '10% OFF',
}

// "100 Peças", "KIT 500 pecas" → 100 / 500. Usado para mostrar o preço por peça.
export function piecesFromTitle(title: string): number | null {
  const m = title.match(/(\d[\d.]*)\s*pe[cç]as/i)
  return m ? Number(m[1].replace('.', '')) : null
}
