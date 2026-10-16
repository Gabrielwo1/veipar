import { env } from '../lib/env.js';
import { safeEqual } from '../lib/security.js';
import { parseWebhook } from '../lib/webhook-parser.js';
import { registerInbound, registerOutbound } from '../lib/db.js';
import { notifyManagers } from '../lib/notify.js';

const text = (body: string, status: number) => new Response(body, { status });

/**
 * Callback "Ao receber" da Z-API.
 * URL a cadastrar no painel da Z-API: https://<deploy>/api/webhook?secret=<WEBHOOK_SECRET>
 */
export async function POST(request: Request): Promise<Response> {
  const secret = new URL(request.url).searchParams.get('secret') ?? '';
  if (!safeEqual(secret, env.webhookSecret)) return text('Forbidden', 403);

  let payload: any;
  try {
    payload = await request.json();
  } catch {
    return text('Bad JSON', 400);
  }

  if (!env.zapiAllowedInstances.includes(String(payload?.instanceId))) {
    return text('Unknown instance', 403);
  }

  const event = parseWebhook(payload);
  if (!event) return text('Ignored', 200);
  if (env.managerPhones.includes(event.waId)) return text('Ignored', 200); // conversa com o gerente

  try {
    if (event.kind === 'inbound') {
      const result = await registerInbound(event);
      if (!result.duplicate && result.should_notify) {
        await notifyManagers(event, result.is_new);
      }
    } else {
      await registerOutbound(event);
    }
  } catch (err) {
    console.error('webhook event failed', event.kind, event.messageId, err);
    return text('Retry', 500); // messageId é chave primária, então reprocessar não duplica
  }

  return text('OK', 200);
}
