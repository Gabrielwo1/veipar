import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  images: {
    // Imagens dos produtos vêm do CDN da Shopify.
    remotePatterns: [{ protocol: 'https', hostname: 'cdn.shopify.com', pathname: '/s/files/**' }],
  },
  partialPrefetching: true,
  // Endereços do tema antigo da Shopify que não existem aqui, para os links antigos
  // (Google, Instagram, e-mails) não caírem em página de erro depois da troca de domínio.
  async redirects() {
    return [
      { source: '/account', destination: 'https://conta.veipar.com.br', permanent: false },
      { source: '/account/:path*', destination: 'https://conta.veipar.com.br', permanent: false },
      { source: '/collections', destination: '/collections/colecao-veipar', permanent: true },
      { source: '/collections/all', destination: '/collections/colecao-veipar', permanent: true },
      { source: '/products', destination: '/collections/colecao-veipar', permanent: true },
      { source: '/collections/:collection/products/:handle', destination: '/products/:handle', permanent: true },
      // Pacotes de 500 e 2.500 tinham endereços errados na Shopify (renomeados em nov/2026); links antigos e anúncios ainda usam.
      { source: '/products/protetor-de-parafuso-de-telha-100-pecas', destination: '/products/protetor-de-parafuso-de-telha-500-pecas', permanent: true },
      { source: '/products/protetor-de-parafuso-de-telha-2500-pecas-copia', destination: '/products/protetor-de-parafuso-de-telha-2500-pecas', permanent: true },
      { source: '/search', destination: '/collections/colecao-veipar', permanent: false },
      { source: '/blogs/:path*', destination: '/', permanent: true },
      { source: '/pages/contact', destination: 'https://wa.me/5546991233498', permanent: false },
      { source: '/pages/:path*', destination: '/', permanent: false },
      { source: '/policies/contact-information', destination: 'https://wa.me/5546991233498', permanent: false },
    ]
  },
  turbopack: {
    root: __dirname,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
