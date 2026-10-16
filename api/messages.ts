import { getMessages, registerSent, setAiEnabled } from '../lib/db.js';
import { authorized, json } from '../lib/http.js';
import { sendText } from '../lib/whatsapp.js';

const waIdOf = (v: unknown) => String(v ?? '').replace(/\D/g, '');

/** Mensagens de uma conversa. /api/messages?wa_id=5546... */
export async function GET(request: Request): Promise<Response> {
  if (!authorized(request)) return json({ error: 'unauthorized' }, 401);
  const waId = waIdOf(new URL(request.url).searchParams.get('wa_id'));
  if (!waId) return json({ error: 'Informe wa_id.' }, 400);
  try {
    return json({ messages: await getMessages(waId, 300) });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
}

/** Equipe responde pelo painel. A IA sai da conversa. Body: { wa_id, text } */
export async function POST(request: Request): Promise<Response> {
  if (!authorized(request)) return json({ error: 'unauthorized' }, 401);
  const body = await request.json().catch(() => null);
  const waId = waIdOf(body?.wa_id);
  const text = String(body?.text ?? '').trim();
  if (!waId || !text) return json({ error: 'Informe wa_id e o texto.' }, 400);
  if (text.length > 4000) return json({ error: 'Mensagem muito longa.' }, 400);

  try {
    await setAiEnabled(waId, false);
    const id = await sendText(waId, text);
    await registerSent(waId, id, 'human', text);
    return json({ message: { id, author: 'human', type: 'text', body: text, sent_at: new Date().toISOString() } }, 201);
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : String(err) }, 502);
  }
}
