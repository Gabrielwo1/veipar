import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Painel (React + Tailwind + shadcn/ui). As funções em /api são servidas pela Vercel.
export default defineConfig({
  root: 'web',
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(import.meta.dirname, 'web/src') } },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: { output: { manualChunks: { charts: ['recharts'], ui: ['radix-ui', 'lucide-react', 'sonner'] } } },
  },
  server: {
    // Em dev, use `vercel dev` (tudo junto) ou aponte /api para outro servidor com VITE_API_PROXY.
    proxy: process.env.VITE_API_PROXY ? { '/api': process.env.VITE_API_PROXY } : undefined,
  },
});
