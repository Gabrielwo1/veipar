import { env } from '../lib/env.js';
import { db, setAiEnabled } from '../lib/db.js';
import { authorized, json } from '../lib/http.js';

/** Contatos e vendas do período para o painel. */
export async function GET(request: Request): Promise<Response> {
  if (!authorized(request)) return json({ error: 'unauthorized' }, 401);

  const days = Number(new URL(request.url).searchParams.get('days') ?? 30);
  const since = new Date(Date.now() - Math.min(Math.max(days, 1), 3650) * 86_400_000).toISOString();

  const [contacts, sales] = await Promise.all([
    db()
      .from('contacts')
      .select(
        'wa_id, name, source, line, first_seen_at, last_message_at, message_count, first_reply_at, last_reply_at, ad_source_id, ad_headline, ai_enabled, handoff_at, handoff_summary, last_preview, sales(id, amount, sold_at, note)',
      )
      .gte('last_message_at', since)
      .order('last_message_at', { ascending: false })
      .limit(5000),
    db()
      .from('sales')
      .select('id, wa_id, amount, sold_at, contacts(name, ad_source_id)')
      .gte('sold_at', since)
      .order('sold_at', { ascending: false })
      .limit(10000),
  ]);

  const error = contacts.error ?? sales.error;
  if (error) return json({ error: error.message }, 500);

  return json({
    contacts: contacts.data,
    sales: sales.data,
    lines: env.lineLabels,
    timezone: env.timezone,
    ai: env.aiEnabled,
  });
}

/** Liga/desliga a IA numa conversa. Body: { wa_id, ai_enabled } */
export async function PATCH(request: Request): Promise<Response> {
  if (!authorized(request)) return json({ error: 'unauthorized' }, 401);
  const body = await request.json().catch(() => null);
  const waId = String(body?.wa_id ?? '').replace(/\D/g, '');
  if (!waId || typeof body?.ai_enabled !== 'boolean') return json({ error: 'Informe wa_id e ai_enabled.' }, 400);
  try {
    await setAiEnabled(waId, body.ai_enabled);
    return json({ ok: true });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
}
