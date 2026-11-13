import 'server-only'
import { cacheLife, cacheTag } from 'next/cache'

// Storefront API da loja Shopify que já existe (veipar.com.br).
// Sem token funciona para produtos, coleções, busca e carrinho; com o token privado
// do canal Headless liberamos metafields, menus e limites maiores.
const DOMAIN = process.env.SHOPIFY_STORE_DOMAIN || 'veipar.com.br'
const API_VERSION = process.env.SHOPIFY_API_VERSION || '2026-10'
const PRIVATE_TOKEN = process.env.SHOPIFY_STOREFRONT_PRIVATE_TOKEN

export type Money = { amount: string; currencyCode: string }
export type Image = { url: string; altText: string | null; width: number; height: number }

export type Variant = {
  id: string
  title: string
  availableForSale: boolean
  price: Money
  compareAtPrice: Money | null
  selectedOptions: { name: string; value: string }[]
  image: Image | null
}

export type ProductCard = {
  handle: string
  title: string
  availableForSale: boolean
  featuredImage: Image | null
  priceRange: { minVariantPrice: Money }
  compareAtPriceRange: { maxVariantPrice: Money }
  // Primeira variante, para o botão "+" adicionar direto ao carrinho.
  variants: { nodes: { id: string; availableForSale: boolean }[] }
}

export type Product = Omit<ProductCard, 'variants'> & {
  id: string
  description: string
  descriptionHtml: string
  options: { name: string; optionValues: { name: string }[] }[]
  images: { nodes: Image[] }
  variants: { nodes: Variant[] }
  seo: { title: string | null; description: string | null }
}

export type Collection = {
  handle: string
  title: string
  description: string
  products: { nodes: ProductCard[] }
}

export type CartLine = {
  id: string
  quantity: number
  cost: { totalAmount: Money }
  merchandise: {
    id: string
    title: string
    image: Image | null
    price: Money
    product: { handle: string; title: string }
  }
}

export type Cart = {
  id: string
  checkoutUrl: string
  totalQuantity: number
  cost: { subtotalAmount: Money; totalAmount: Money }
  discountCodes: { code: string; applicable: boolean }[]
  discountAllocations: { discountedAmount: Money }[]
  lines: { nodes: CartLine[] }
}

type GraphQLResponse<T> = { data?: T; errors?: { message: string }[] }

async function storefront<T>(
  query: string,
  variables: Record<string, unknown> = {},
  buyerIp?: string,
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (PRIVATE_TOKEN) {
    headers['Shopify-Storefront-Private-Token'] = PRIVATE_TOKEN
    if (buyerIp) headers['Shopify-Storefront-Buyer-IP'] = buyerIp
  }

  const res = await fetch(`https://${DOMAIN}/api/${API_VERSION}/graphql.json`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  })
  if (!res.ok) throw new Error(`Storefront API ${res.status}: ${await res.text()}`)

  const json = (await res.json()) as GraphQLResponse<T>
  if (json.errors?.length) throw new Error(json.errors.map((e) => e.message).join('; '))
  return json.data as T
}

// Preço em real e textos em português.
const CONTEXT = '@inContext(country: BR, language: PT_BR)'

const IMAGE = 'url altText width height'
const PRODUCT_CARD = `
  handle title availableForSale
  featuredImage { ${IMAGE} }
  priceRange { minVariantPrice { amount currencyCode } }
  compareAtPriceRange { maxVariantPrice { amount currencyCode } }
  variants(first: 2) { nodes { id availableForSale } }
`

// ---------- Catálogo (cacheado; a Shopify é a fonte da verdade) ----------

export async function getProducts(): Promise<ProductCard[]> {
  'use cache'
  cacheLife('minutes')
  cacheTag('products')
  const data = await storefront<{ products: { nodes: ProductCard[] } }>(`
    query Products ${CONTEXT} {
      products(first: 50, sortKey: BEST_SELLING) { nodes { ${PRODUCT_CARD} } }
    }
  `)
  return data.products.nodes
}

export async function getProduct(handle: string): Promise<Product | null> {
  'use cache'
  cacheLife('minutes')
  cacheTag('products', `product:${handle}`)
  const data = await storefront<{ product: Product | null }>(
    `
    query Product($handle: String!) ${CONTEXT} {
      product(handle: $handle) {
        id handle title availableForSale
        featuredImage { ${IMAGE} }
        priceRange { minVariantPrice { amount currencyCode } }
        compareAtPriceRange { maxVariantPrice { amount currencyCode } }
        description descriptionHtml
        options { name optionValues { name } }
        images(first: 10) { nodes { ${IMAGE} } }
        variants(first: 50) {
          nodes {
            id title availableForSale
            price { amount currencyCode }
            compareAtPrice { amount currencyCode }
            selectedOptions { name value }
            image { ${IMAGE} }
          }
        }
        seo { title description }
      }
    }
  `,
    { handle },
  )
  return data.product
}

export async function getCollections(): Promise<{ handle: string; title: string }[]> {
  'use cache'
  cacheLife('minutes')
  cacheTag('collections')
  const data = await storefront<{ collections: { nodes: { handle: string; title: string }[] } }>(`
    query Collections ${CONTEXT} { collections(first: 20) { nodes { handle title } } }
  `)
  return data.collections.nodes
}

export async function getCollection(handle: string): Promise<Collection | null> {
  'use cache'
  cacheLife('minutes')
  cacheTag('collections', `collection:${handle}`)
  const data = await storefront<{ collection: Collection | null }>(
    `
    query Collection($handle: String!) ${CONTEXT} {
      collection(handle: $handle) {
        handle title description
        products(first: 50) { nodes { ${PRODUCT_CARD} } }
      }
    }
  `,
    { handle },
  )
  return data.collection
}

// ---------- Carrinho (nunca cacheado: é do comprador) ----------

const CART = `
  id checkoutUrl totalQuantity
  discountCodes { code applicable }
  discountAllocations { discountedAmount { amount currencyCode } }
  cost { subtotalAmount { amount currencyCode } totalAmount { amount currencyCode } }
  lines(first: 100) {
    nodes {
      id quantity
      cost { totalAmount { amount currencyCode } }
      merchandise {
        ... on ProductVariant {
          id title
          image { ${IMAGE} }
          price { amount currencyCode }
          product { handle title }
        }
      }
    }
  }
`

type UserError = { field: string[] | null; message: string }

function assertNoUserErrors(errors: UserError[]) {
  if (errors.length) throw new Error(errors.map((e) => e.message).join('; '))
}

export async function getCart(cartId: string): Promise<Cart | null> {
  const data = await storefront<{ cart: Cart | null }>(
    `query Cart($cartId: ID!) ${CONTEXT} { cart(id: $cartId) { ${CART} } }`,
    { cartId },
  )
  return data.cart
}

type CartLineInput = { merchandiseId: string; quantity: number }

export async function createCart(lines: CartLineInput[], buyerIp?: string): Promise<Cart> {
  const data = await storefront<{ cartCreate: { cart: Cart; userErrors: UserError[] } }>(
    `
    mutation CartCreate($input: CartInput!) ${CONTEXT} {
      cartCreate(input: $input) { cart { ${CART} } userErrors { field message } }
    }
  `,
    // O atributo com "_" não aparece no checkout, mas vai para o pedido: é como o /painel
    // separa as vendas da loja nova das do site antigo.
    { input: { lines, buyerIdentity: { countryCode: 'BR' }, attributes: [{ key: '_origem', value: 'loja-nova' }] } },
    buyerIp,
  )
  assertNoUserErrors(data.cartCreate.userErrors)
  return data.cartCreate.cart
}

export async function addCartLines(cartId: string, lines: CartLineInput[], buyerIp?: string): Promise<Cart> {
  const data = await storefront<{ cartLinesAdd: { cart: Cart; userErrors: UserError[] } }>(
    `
    mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) ${CONTEXT} {
      cartLinesAdd(cartId: $cartId, lines: $lines) { cart { ${CART} } userErrors { field message } }
    }
  `,
    { cartId, lines },
    buyerIp,
  )
  assertNoUserErrors(data.cartLinesAdd.userErrors)
  return data.cartLinesAdd.cart
}

export async function updateCartLine(cartId: string, lineId: string, quantity: number, buyerIp?: string): Promise<Cart> {
  // Quantidade 0 remove a linha.
  const data = await storefront<{ cartLinesUpdate: { cart: Cart; userErrors: UserError[] } }>(
    `
    mutation CartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) ${CONTEXT} {
      cartLinesUpdate(cartId: $cartId, lines: $lines) { cart { ${CART} } userErrors { field message } }
    }
  `,
    { cartId, lines: [{ id: lineId, quantity }] },
    buyerIp,
  )
  assertNoUserErrors(data.cartLinesUpdate.userErrors)
  return data.cartLinesUpdate.cart
}

export async function setCartDiscountCodes(cartId: string, discountCodes: string[], buyerIp?: string): Promise<Cart> {
  const data = await storefront<{ cartDiscountCodesUpdate: { cart: Cart; userErrors: UserError[] } }>(
    `
    mutation CartDiscountCodesUpdate($cartId: ID!, $discountCodes: [String!]!) ${CONTEXT} {
      cartDiscountCodesUpdate(cartId: $cartId, discountCodes: $discountCodes) { cart { ${CART} } userErrors { field message } }
    }
  `,
    { cartId, discountCodes },
    buyerIp,
  )
  assertNoUserErrors(data.cartDiscountCodesUpdate.userErrors)
  return data.cartDiscountCodesUpdate.cart
}

export function formatMoney({ amount, currencyCode }: Money): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: currencyCode }).format(Number(amount))
}
