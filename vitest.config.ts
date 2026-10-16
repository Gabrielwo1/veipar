import { defineConfig } from 'vitest/config';

// Testes do backend (o vite.config.ts aponta a raiz para web/).
export default defineConfig({ test: { include: ['tests/**/*.test.ts'] } });
