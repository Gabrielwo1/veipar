import 'server-only'

// Admin API da Shopify, pelo app do Dev Dashboard instalado na loja. O token sai do
// client credentials grant e vale 24h; guardamos em memória e renovamos antes de vencer.
const SHOP = process.env.SHOPIFY_MYSHOPIFY_DOMAIN || 'xn7tfb-iw.myshopify.com'
const API_VERSION = process.env.SHOPIFY_API_VERSION || '2026-10'
const CLIENT_ID = process.env.SHOPIFY_ADMIN_CLIENT_ID
const CLIENT_SECRET = process.env.SHOPIFY_ADMIN_CLIENT_SECRET

export const adminConfigurado = Boolean(CLIENT_ID && CLIENT_SECRET)

let token: { value: string; expiresAt: number } | null = null

async function accessToken() {
  if (token && token.expiresAt > Date.now() + 60_000) return token.value
  const res = await fetch(`https://${SHOP}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'client_credentials', client_id: CLIENT_ID!, client_secret: CLIENT_SECRET! }),
    cache: 'no-store',
  })
  if (!res.ok) {
    const page = await res.text()
    const reason = page.match(/Oauth error ([a-z_]+)/)?.[1] ?? String(res.status)
    throw new Error(`Shopify Admin: ${reason}`)
  }
  const data = (await res.json()) as { access_token: string; expires_in?: number }
  token = { value: data.access_token, expiresAt: Date.now() + (data.expires_in ?? 86_400) * 1000 }
  return token.value
}

export async function admin<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch(`https://${SHOP}/admin/api/${API_VERSION}/graphql.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': await accessToken() },
    body: JSON.stringify({ query, variables }),
    cache: 'no-store',
  })
  const json = (await res.json()) as { data?: T; errors?: unknown }
  // Escopos mudaram (app reinstalado): o próximo pedido busca um token novo.
  if (JSON.stringify(json.errors ?? '').includes('ACCESS_DENIED')) token = null
  if (!res.ok || json.errors || !json.data) throw new Error(`Shopify Admin: ${JSON.stringify(json.errors ?? res.status)}`)
  return json.data
}

export type Pedido = {
  createdAt: string
  cancelledAt: string | null
  displayFinancialStatus: string | null
  sourceName: string | null
  customAttributes: { key: string; value: string | null }[]
  totalPriceSet: { shopMoney: { amount: string } }
  customer: { numberOfOrders: string } | null
  shippingAddress: { provinceCode: string | null } | null
  lineItems: { nodes: { title: string; quantity: number }[] }
}

// Pedidos do período (todos os canais da loja). Sem read_all_orders a Shopify só devolve os últimos 60 dias.
export async function pedidosDesde(desde: Date): Promise<Pedido[]> {
  const pedidos: Pedido[] = []
  let after: string | null = null
  for (let page = 0; page < 10; page++) {
    const data: {
      orders: { nodes: Pedido[]; pageInfo: { hasNextPage: boolean; endCursor: string | null } }
    } = await admin(
      `query Pedidos($q: String!, $after: String) {
        orders(first: 250, after: $after, query: $q, sortKey: CREATED_AT) {
          nodes {
            createdAt cancelledAt displayFinancialStatus sourceName customAttributes { key value }
            totalPriceSet { shopMoney { amount } }
            customer { numberOfOrders }
            shippingAddress { provinceCode }
            lineItems(first: 20) { nodes { title quantity } }
          }
          pageInfo { hasNextPage endCursor }
        }
      }`,
      { q: `created_at:>='${desde.toISOString()}'`, after },
    )
    pedidos.push(...data.orders.nodes)
    if (!data.orders.pageInfo.hasNextPage) break
    after = data.orders.pageInfo.endCursor
  }
  return pedidos
}
