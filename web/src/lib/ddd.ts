import { DDDS } from './brasil-mapa.js';

/** DDD de um número brasileiro (55 + DDD + 8/9 dígitos); null para estrangeiro, DDD inexistente ou sem telefone. */
export function dddOf(waId: string): string | null {
  if (!/^55\d{10,11}$/.test(waId)) return null;
  const ddd = waId.slice(2, 4);
  return DDDS[ddd] ? ddd : null;
}
