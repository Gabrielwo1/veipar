import { env } from './env.js';
import { formatDateTime, formatPhone } from './format.js';
import { logNotification } from './db.js';
import { sendText } from './whatsapp.js';
import type { InboundEvent } from './webhook-parser.js';

/** Texto do aviso. Não inclui o conteúdo da mensagem do cliente (pode ser dado de saúde). */
export function buildNotification(e: InboundEvent, isNew: boolean): string {
  const line = env.lineLabels[e.line] || (e.line ? formatPhone(e.line) : 'WhatsApp');
  return [
    `🔔 *${isNew ? 'Novo contato' : 'Contato voltou a chamar'}* · ${line}`,
    '',
    `*Nome:* ${e.name || 'Sem nome no perfil'}`,
    `*Telefone:* ${formatPhone(e.waId)}`,
    `*Horário:* ${formatDateTime(e.sentAt, env.timezone)}`,
    ...(e.ad ? [`*Origem:* anúncio${e.ad.headline ? ` "${e.ad.headline}"` : ''}`] : []),
    '',
    `https://wa.me/${e.waId}`,
  ].join('\n');
}

/** Avisa gerente(s) e grupo(s) que um contato novo (ou que voltou) chamou no WhatsApp. */
export async function notifyManagers(e: InboundEvent, isNew: boolean): Promise<void> {
  const message = buildNotification(e, isNew);
  const recipients = [...env.managerPhones.filter((m) => m !== e.waId), ...env.notifyGroupIds];
  await Promise.all(
    recipients.map(async (to) => {
      try {
        await sendText(to, message);
        await logNotification(e.waId, to, true);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('notifyManagers', to, msg);
        await logNotification(e.waId, to, false, msg);
      }
    }),
  );
}
