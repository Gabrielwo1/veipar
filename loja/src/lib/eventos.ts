import 'server-only'

// Acessos da loja guardados no Supabase do painel do WhatsApp (tabela loja_eventos).
// Só o servidor fala com o banco, com a service role; o navegador manda para /api/evento.
const URL = process.env.SUPABASE_URL
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

export const eventosConfigurados = Boolean(URL && KEY)

export const TIPOS = ['page_view', 'view_item', 'add_to_cart', 'begin_checkout'] as const
export type TipoEvento = (typeof TIPOS)[number]

export type Evento = {
  tipo: TipoEvento
  visitante: string
  sessao: string
  caminho: string | null
  produto: string | null
  valor: number | null
  origem: string | null
  campanha: string | null
  dispositivo: string | null
  estado: string | null
  cidade: string | null
}

function headers() {
  return { apikey: KEY!, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' }
}

export async function gravarEvento(evento: Evento) {
  if (!eventosConfigurados) return
  const res = await fetch(`${URL}/rest/v1/loja_eventos`, {
    method: 'POST',
    headers: { ...headers(), Prefer: 'return=minimal' },
    body: JSON.stringify(evento),
    cache: 'no-store',
  })
  if (!res.ok) console.error('loja_eventos', res.status, await res.text())
}

type Item = { nome: string; total: number }

export type Metricas = {
  visitantes: number
  sessoes: number
  visualizacoes: number
  funil: { visitas: number; produto: number; carrinho: number; checkout: number }
  por_dia: { dia: string; visitantes: number; visualizacoes: number }[]
  paginas: Item[]
  produtos: { nome: string; vistos: number; carrinho: number }[]
  origens: Item[]
  dispositivos: Item[]
  estados: Item[]
}

export async function lerMetricas(desde: Date, ate: Date): Promise<Metricas | null> {
  if (!eventosConfigurados) return null
  const res = await fetch(`${URL}/rest/v1/rpc/loja_metricas`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ desde: desde.toISOString(), ate: ate.toISOString() }),
    cache: 'no-store',
  })
  if (!res.ok) {
    console.error('loja_metricas', res.status, await res.text())
    return null
  }
  return res.json()
}
