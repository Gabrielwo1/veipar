import { after } from 'next/server'
import { gravarEvento, TIPOS, type TipoEvento } from '@/lib/eventos'

const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|lighthouse|headless/i

function texto(v: unknown, max = 200) {
  return typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null
}

function dispositivo(ua: string) {
  if (/ipad|tablet/i.test(ua)) return 'tablet'
  if (/mobi|android|iphone/i.test(ua)) return 'celular'
  return 'computador'
}

// Recebe os eventos do navegador (sendBeacon) e grava depois de responder.
export async function POST(request: Request) {
  const ua = request.headers.get('user-agent') ?? ''
  if (BOT.test(ua)) return new Response(null, { status: 204 })

  let body: Record<string, unknown>
  try {
    body = JSON.parse(await request.text())
  } catch {
    return new Response(null, { status: 400 })
  }

  const tipo = body.tipo as TipoEvento
  const visitante = texto(body.visitante, 64)
  const sessao = texto(body.sessao, 64)
  if (!TIPOS.includes(tipo) || !visitante || !sessao) return new Response(null, { status: 400 })

  const valor = Number(body.valor)
  const cidade = request.headers.get('x-vercel-ip-city')

  after(() =>
    gravarEvento({
      tipo,
      visitante,
      sessao,
      caminho: texto(body.caminho),
      produto: texto(body.produto),
      valor: Number.isFinite(valor) && valor > 0 ? valor : null,
      origem: texto(body.origem, 80)?.toLowerCase() ?? null,
      campanha: texto(body.campanha, 120),
      dispositivo: dispositivo(ua),
      estado: request.headers.get('x-vercel-ip-country-region'),
      cidade: cidade ? decodeURIComponent(cidade) : null,
    }),
  )
  return new Response(null, { status: 204 })
}
