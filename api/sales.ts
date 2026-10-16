import { db } from '../lib/db.js';
import { authorized, json } from '../lib/http.js';

/** Converte "1.234,56", "150,5" ou 150.5 em número com 2 casas. */
export function parseAmount(input: unknown): number | null {
  if (typeof input === 'number') return Number.isFinite(input) && input > 0 ? Math.round(input * 100) / 100 : null;
  if (typeof input !== 'string' || input.includes('-')) return null;
  let s = input.replace(/[^\d.,]/g, '');
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  const n = Number(s);
  return Number.isFinite(n) && n > 0 && n < 10_000_000 ? Math.round(n * 100) / 100 : null;
}

/** Registra uma venda para um contato. Body: { wa_id, amount, sold_at? } */
export async function POST(request: Request): Promise<Response> {
  if (!authorized(request)) return json({ error: 'unauthorized' }, 401);

  const body = await request.json().catch(() => null);
  const waId = String(body?.wa_id ?? '').replace(/\D/g, '');
  const amount = parseAmount(body?.amount);
  const soldAt = body?.sold_at ? new Date(body.sold_at) : new Date();

  if (!waId || amount == null || Number.isNaN(soldAt.getTime())) {
    return json({ error: 'Informe wa_id e um valor maior que zero.' }, 400);
  }

  const { data, error } = await db()
    .from('sales')
    .insert({ wa_id: waId, amount, sold_at: soldAt.toISOString() })
    .select('id, wa_id, amount, sold_at')
    .single();

  if (error) return json({ error: error.message }, error.code === '23503' ? 404 : 500);
  return json({ sale: data }, 201);
}

/** Remove uma venda lançada por engano. /api/sales?id=123 */
export async function DELETE(request: Request): Promise<Response> {
  if (!authorized(request)) return json({ error: 'unauthorized' }, 401);

  const id = Number(new URL(request.url).searchParams.get('id'));
  if (!Number.isInteger(id) || id <= 0) return json({ error: 'id inválido' }, 400);

  const { error } = await db().from('sales').delete().eq('id', id);
  if (error) return json({ error: error.message }, 500);
  return json({ ok: true });
}
