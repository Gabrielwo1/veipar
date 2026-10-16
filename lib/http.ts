import { env } from './env.js';
import { safeEqual } from './security.js';

/** Painel autentica com Bearer DASHBOARD_PASSWORD. */
export function authorized(request: Request): boolean {
  const header = request.headers.get('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  return token.length > 0 && safeEqual(token, env.dashboardPassword);
}

export const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
