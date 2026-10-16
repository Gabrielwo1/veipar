export interface Sale {
  id: number;
  wa_id: string;
  amount: number | string;
  sold_at: string;
}

export interface SaleWithContact extends Sale {
  contacts: { name: string | null; ad_source_id: string | null } | null;
}

export interface Contact {
  wa_id: string;
  name: string | null;
  line: string | null;
  first_seen_at: string;
  last_message_at: string;
  message_count: number;
  first_reply_at: string | null;
  last_reply_at: string | null;
  ad_source_id: string | null;
  ad_headline: string | null;
  sales: Sale[];
}

export interface DashboardData {
  contacts: Contact[];
  sales: SaleWithContact[];
  lines: Record<string, string>;
  timezone: string;
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
  deleteSale: (id: number) => request<{ ok: true }>(`/api/sales?id=${id}`, { method: 'DELETE' }),
};
