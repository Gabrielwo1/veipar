import { env } from '../lib/env.js';
import { db, setAiEnabled, setStage, STAGES, type Stage } from '../lib/db.js';
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
        'wa_id, name, source, stage, line, first_seen_at, last_message_at, message_count, first_reply_at, last_reply_at, ad_source_id, ad_headline, ai_enabled, handoff_at, handoff_summary, last_preview, sales(id, amount, sold_at, note)',
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

/** Atualiza a conversa: liga/desliga a IA e/ou muda a etapa. Body: { wa_id, ai_enabled?, stage? } */
export async function PATCH(request: Request): Promise<Response> {
  if (!authorized(request)) return json({ error: 'unauthorized' }, 401);
  const body = await request.json().catch(() => null);
  const waId = String(body?.wa_id ?? '').replace(/[^\dm]/g, '');
  const ai = body?.ai_enabled;
  const stage = body?.stage as Stage | undefined;
  if (!waId || (typeof ai !== 'boolean' && !stage)) return json({ error: 'Informe wa_id e ai_enabled ou stage.' }, 400);
  if (stage && !STAGES.includes(stage)) return json({ error: 'Etapa inválida.' }, 400);
  try {
    if (typeof ai === 'boolean') await setAiEnabled(waId, ai);
    if (stage) await setStage(waId, stage);
    return json({ ok: true });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
}
