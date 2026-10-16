import { env } from './env.js';

const instanceUrl = (path: string) =>
  `${env.zapiBaseUrl}/instances/${env.zapiInstanceId}/token/${env.zapiInstanceToken}/${path}`;

const headers = () => ({ 'Content-Type': 'application/json', 'Client-Token': env.zapiClientToken });

/** Envia mensagem de texto pela Z-API. `phone` aceita telefone (5546...) ou ID de grupo (...-group). */
export async function sendText(phone: string, message: string): Promise<void> {
  const res = await fetch(instanceUrl('send-text'), {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ phone, message }),
  });
  if (!res.ok) {
    throw new Error(`Z-API ${res.status}: ${await res.text()}`);
  }
}

export interface Group { phone: string; name: string }

/** Lista os grupos do número conectado (para descobrir o ID a usar em NOTIFY_GROUP_IDS). */
export async function listGroups(): Promise<Group[]> {
  const res = await fetch(instanceUrl('groups?page=1&pageSize=200'), { headers: headers() });
  if (!res.ok) throw new Error(`Z-API ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as any[];
  return data.map((g) => ({ phone: String(g.phone), name: String(g.name ?? '') }));
}
