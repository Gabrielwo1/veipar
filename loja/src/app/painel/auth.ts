import 'server-only'
import { createHash, timingSafeEqual } from 'node:crypto'

// Código de acesso do /painel (variável PAINEL_CODIGO na Vercel). O cookie guarda só um hash dele,
// então trocar o código derruba quem já estava logado.
const CODIGO = process.env.PAINEL_CODIGO ?? ''

export const COOKIE = 'veipar-painel'

export function tokenDoPainel() {
  return createHash('sha256').update(`veipar-painel:${CODIGO}`).digest('hex')
}

function igual(a: string, b: string) {
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}

export function codigoValido(codigo: string) {
  return CODIGO !== '' && igual(codigo, CODIGO)
}

export function cookieValido(valor: string | undefined) {
  return CODIGO !== '' && !!valor && igual(valor, tokenDoPainel())
}
