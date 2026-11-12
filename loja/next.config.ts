import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  images: {
    // Imagens dos produtos vêm do CDN da Shopify.
    remotePatterns: [{ protocol: 'https', hostname: 'cdn.shopify.com', pathname: '/s/files/**' }],
  },
  partialPrefetching: true,
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
