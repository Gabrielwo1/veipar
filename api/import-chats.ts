import { db } from '../lib/db.js';
import { authorized, json } from '../lib/http.js';
import { listChats } from '../lib/whatsapp.js';

/**
 * Importa os chats que já existem no WhatsApp da empresa como "conversas da equipe": a IA não atende esses números.
 * Ignora quem já está no sistema (essas conversas seguem as regras normais).
 * POST /api/import-chats?before=<ms>  (padrão: agora)
 */
export async function POST(request: Request): Promise<Response> {
  if (!authorized(request)) return json({ error: 'unauthorized' }, 401);
  const before = Number(new URL(request.url).searchParams.get('before')) || Date.now();

  try {
    const [chats, known] = await Promise.all([
      listChats(),
      db().from('contacts').select('wa_id').limit(100000),
    ]);
    if (known.error) throw new Error(known.error.message);
    const inSystem = new Set((known.data ?? []).map((c) => c.wa_id));
    const rows = chats
      .filter((c) => c.lastMessageTime < before && !inSystem.has(c.phone)) // chats antigos podem vir sem data (0)
      .map((c) => ({ wa_id: c.phone, name: c.name || null, last_message_at: c.lastMessageTime ? new Date(c.lastMessageTime).toISOString() : null }));

    if (rows.length) {
      const { error } = await db().from('pre_existing_chats').upsert(rows, { onConflict: 'wa_id' });
      if (error) throw new Error(error.message);
    }
    return json({ chats: chats.length, imported: rows.length });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : String(err) }, 502);
  }
}
