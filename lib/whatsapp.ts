import { env } from './env.js';

const instanceUrl = (path: string) =>
  `${env.zapiBaseUrl}/instances/${env.zapiInstanceId}/token/${env.zapiInstanceToken}/${path}`;

const headers = () => ({ 'Content-Type': 'application/json', 'Client-Token': env.zapiClientToken });

/**
 * Envia mensagem de texto pela Z-API e devolve o messageId.
 * `phone` aceita telefone (5546...) ou ID de grupo (...-group).
 * `delayTyping` (1–15 s) mostra "digitando..." antes de enviar.
 */
export async function sendText(phone: string, message: string, delayTyping?: number): Promise<string> {
  const res = await fetch(instanceUrl('send-text'), {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ phone, message, ...(delayTyping ? { delayTyping } : {}) }),
  });
  if (!res.ok) {
    throw new Error(`Z-API ${res.status}: ${await res.text()}`);
  }
  const data = (await res.json().catch(() => ({}))) as { messageId?: string; zaapId?: string; id?: string };
  return String(data.messageId ?? data.id ?? data.zaapId ?? `api-${Date.now()}`);
}

export interface Group { phone: string; name: string }

/** Lista os grupos do número conectado (para descobrir o ID a usar em NOTIFY_GROUP_IDS). */
export async function listGroups(): Promise<Group[]> {
  const res = await fetch(instanceUrl('groups?page=1&pageSize=200'), { headers: headers() });
  if (!res.ok) throw new Error(`Z-API ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as any[];
  return data.map((g) => ({ phone: String(g.phone), name: String(g.name ?? '') }));
}

export interface Chat { phone: string; name: string; lastMessageTime: number }

/** Chats individuais do número conectado (para importar quem já conversava com a equipe). */
export async function listChats(): Promise<Chat[]> {
  const chats: Chat[] = [];
  for (let page = 1; page <= 50; page++) {
    const res = await fetch(instanceUrl(`chats?page=${page}&pageSize=500`), { headers: headers() });
    if (!res.ok) throw new Error(`Z-API ${res.status}: ${await res.text()}`);
    const data = (await res.json()) as any[];
    for (const c of data) {
      if (!c.isGroup && /^\d{8,15}$/.test(String(c.phone))) {
        chats.push({ phone: String(c.phone), name: String(c.name ?? ''), lastMessageTime: Number(c.lastMessageTime) || 0 });
      }
    }
    if (data.length < 500) break;
  }
  return chats;
}
