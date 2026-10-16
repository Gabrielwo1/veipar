export interface Sale {
  id: number;
  wa_id: string;
  amount: number | string;
  sold_at: string;
  note?: string | null;
}

export interface SaleWithContact extends Sale {
  contacts: { name: string | null; ad_source_id: string | null } | null;
}

export interface Contact {
  wa_id: string;
  name: string | null;
  /** 'manual' = cliente cadastrado à mão (venda fora do WhatsApp). wa_id "m…" quando sem telefone. */
  source: 'whatsapp' | 'manual';
  line: string | null;
  first_seen_at: string;
  last_message_at: string;
  message_count: number;
  first_reply_at: string | null;
  last_reply_at: string | null;
  ad_source_id: string | null;
  ad_headline: string | null;
  ai_enabled: boolean;
  handoff_at: string | null;
  handoff_summary: HandoffSummary | null;
  last_preview: string | null;
  sales: Sale[];
}

/** Pedido coletado pela IA ao passar a conversa para a equipe. */
export interface HandoffSummary {
  motivo?: 'pedido_pronto' | 'pediu_humano' | 'fora_do_escopo';
  itens?: { produto: string; quantidade: string }[];
  nome_cliente?: string;
  cidade_uf?: string;
  perfil?: string;
  observacoes?: string;
  resumo?: string;
}

export interface ChatMessage {
  id: string;
  author: 'customer' | 'ai' | 'human';
  type: string;
  body: string | null;
  sent_at: string;
}

export interface DashboardData {
  contacts: Contact[];
  sales: SaleWithContact[];
  lines: Record<string, string>;
  timezone: string;
  /** IA configurada no servidor (OPENAI_API_KEY presente e AI_ENABLED != false). */
  ai: boolean;
}

const KEY = 'vf_dash_pwd';

export const session = {
  get: () => { try { return sessionStorage.getItem(KEY) ?? ''; } catch { return ''; } },
  set: (v: string) => { try { v ? sessionStorage.setItem(KEY, v) : sessionStorage.removeItem(KEY); } catch { /* sem storage */ } },
};

export class UnauthorizedError extends Error {}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.get()}` },
  });
  if (res.status === 401) throw new UnauthorizedError('Senha incorreta ou sessão expirada.');
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Erro ${res.status}`);
  return data as T;
}

export const api = {
  dashboard: (days: number) => request<DashboardData>(`/api/contacts?days=${days}`),
  addSale: (body: { wa_id: string; amount: string; sold_at?: string }) =>
    request<{ sale: Sale }>('/api/sales', { method: 'POST', body: JSON.stringify(body) }),
  addManualSale: (body: { name: string; phone?: string; amount: string; sold_at?: string; note?: string }) =>
    request<{ sale: Sale }>('/api/sales', { method: 'POST', body: JSON.stringify(body) }),
  deleteSale: (id: number) => request<{ ok: true }>(`/api/sales?id=${id}`, { method: 'DELETE' }),
  conversations: () => request<{ contacts: Contact[] }>('/api/conversations'),
  messages: (waId: string) => request<{ messages: ChatMessage[] }>(`/api/messages?wa_id=${waId}`),
  send: (waId: string, text: string) =>
    request<{ message: ChatMessage }>('/api/messages', { method: 'POST', body: JSON.stringify({ wa_id: waId, text }) }),
  setAi: (waId: string, enabled: boolean) =>
    request<{ ok: true }>('/api/contacts', { method: 'PATCH', body: JSON.stringify({ wa_id: waId, ai_enabled: enabled }) }),
};
