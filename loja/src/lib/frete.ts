import 'server-only'

// App "Frete no Produto" (Kokfy) instalado na Shopify: o mesmo cálculo que aparece
// na página de produto da loja atual. Chamamos do servidor para não depender de CORS.
const KOKFY_URL = 'https://calculo-frete-produto.kokfy.com/api/carrier/shopify'
const SHOP = process.env.SHOPIFY_MYSHOPIFY_DOMAIN || 'xn7tfb-iw.myshopify.com'

export type FreteItem = { variantId: string; price: string; quantity: number }

export type FreteOpcao = { name: string; price: string; shippingDate: string; days: { min: number; max: number } }

type KokfyRate = { name: string; price: string; shipping_date: string; days: { min: number; max: number } }

export function normalizeCep(cep: string): string | null {
  const digits = cep.replace(/\D/g, '')
  return digits.length === 8 ? digits : null
}

export async function cotarFrete(items: FreteItem[], cep: string): Promise<FreteOpcao[]> {
  const res = await fetch(`${KOKFY_URL}?shop=${SHOP}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: items.map((i) => ({
        // O app espera o ID numérico da variante e o preço em centavos, como no tema.
        variant_id: Number(i.variantId.split('/').pop()),
        price: Math.round(Number(i.price) * 100),
        quantity: i.quantity,
        sku: null,
      })),
      cep,
      shop: SHOP,
      origin: process.env.VERCEL_PROJECT_PRODUCTION_URL || 'veipar.com.br',
    }),
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`Kokfy ${res.status}`)
  const rates = (await res.json()) as KokfyRate[]
  return rates.map((r) => ({ name: r.name, price: r.price, shippingDate: r.shipping_date, days: r.days }))
}

export async function buscarEndereco(cep: string): Promise<string | null> {
  try {
    const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`, { cache: 'no-store' })
    const r = (await res.json()) as { erro?: boolean; logradouro: string; bairro: string; localidade: string; uf: string }
    if (r.erro) return null
    return [r.logradouro, r.bairro, `${r.localidade} - ${r.uf}`].filter(Boolean).join(', ')
  } catch {
    return null
  }
}
