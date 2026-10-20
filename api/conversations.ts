import { db } from '../lib/db.js';
import { authorized, json } from '../lib/http.js';

/**
 * Lista da aba Conversas: toda conversa com atividade (cliente, IA ou equipe) nos últimos `days` dias,
 * independente do período escolhido no painel.
 */
export async function GET(request: Request): Promise<Response> {
  if (!authorized(request)) return json({ error: 'unauthorized' }, 401);

  const days = Number(new URL(request.url).searchParams.get('days') ?? 180);
  const since = new Date(Date.now() - Math.min(Math.max(days, 1), 3650) * 86_400_000).toISOString();

  const { data, error } = await db()
    .from('contacts')
    .select(
      'wa_id, name, source, stage, line, first_seen_at, last_message_at, message_count, first_reply_at, last_reply_at, ad_source_id, ad_headline, ai_enabled, handoff_at, handoff_summary, last_preview, sales(id, amount, sold_at, note)',
    )
    .or(`last_message_at.gte.${since},last_reply_at.gte.${since}`)
    .order('last_message_at', { ascending: false })
    .limit(1000);

  if (error) return json({ error: error.message }, 500);
  // Só quem tem mensagem de algum lado (exclui cliente manual sem conversa).
  return json({ contacts: data.filter((c) => c.message_count > 0 || c.last_reply_at) });
}
