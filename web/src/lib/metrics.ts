import type { Contact, DashboardData, SaleWithContact } from './api';
import { dayKey, fmtDay, fmtWeekday, hourOf } from './format';

const DAY = 86_400_000;
export type Period = 1 | 7 | 30 | 90;

export const amountOf = (s: { amount: number | string }) => Number(s.amount);
export const sum = (list: { amount: number | string }[]) => list.reduce((t, s) => t + amountOf(s), 0);
export const totalOf = (c: Contact) => sum(c.sales ?? []);
export const replyMs = (c: Contact) =>
  c.first_reply_at ? new Date(c.first_reply_at).getTime() - new Date(c.first_seen_at).getTime() : null;
export const isManual = (c: Contact) => c.source === 'manual';
/** Telefone de verdade (clientes manuais sem telefone têm wa_id "m…"). */
export const hasPhone = (c: Contact) => /^\d+$/.test(c.wa_id);
export const isWaiting = (c: Contact) =>
  !isManual(c) && (!c.last_reply_at || new Date(c.last_reply_at) < new Date(c.last_message_at));

/** Dias a buscar na API: período atual + período anterior (para comparação). */
export const fetchDays = (p: Period) => (p === 1 ? 3 : p * 2 + 1);

/** Janela [início, fim) do período atual e do anterior. "Hoje" usa o dia civil no fuso configurado. */
function windows(p: Period, now = Date.now()) {
  if (p === 1) {
    const today = dayKey(now), yesterday = dayKey(now - DAY);
    return {
      cur: (iso: string) => dayKey(iso) === today,
      prev: (iso: string) => dayKey(iso) === yesterday,
    };
  }
  const start = now - p * DAY, prevStart = now - 2 * p * DAY;
  return {
    cur: (iso: string) => new Date(iso).getTime() >= start,
    prev: (iso: string) => { const t = new Date(iso).getTime(); return t >= prevStart && t < start; },
  };
}

export interface PeriodStats {
  revenue: number;
  adRevenue: number;
  salesCount: number;
  buyers: number;
  newContacts: number;
}

function stats(sales: SaleWithContact[], contacts: Contact[], inRange: (iso: string) => boolean): PeriodStats {
  const s = sales.filter((x) => inRange(x.sold_at));
  return {
    revenue: sum(s),
    adRevenue: sum(s.filter((x) => x.contacts?.ad_source_id)),
    salesCount: s.length,
    buyers: new Set(s.map((x) => x.wa_id)).size,
    newContacts: contacts.filter((c) => !isManual(c) && inRange(c.first_seen_at)).length,
  };
}

export function computeDashboard(data: DashboardData, period: Period, line: string) {
  const win = windows(period);
  const lineOf = new Map(data.contacts.map((c) => [c.wa_id, c.line]));
  const byLine = <T extends { wa_id: string }>(x: T) => !line || lineOf.get(x.wa_id) === line;

  const allContacts = data.contacts.filter(byLine);
  const allSales = data.sales.filter(byLine);
  const contacts = allContacts.filter((c) => win.cur(c.last_message_at) || (c.sales ?? []).some((s) => win.cur(s.sold_at)));
  const sales = allSales.filter((s) => win.cur(s.sold_at));
  const newContacts = contacts.filter((c) => !isManual(c) && win.cur(c.first_seen_at));

  const cur = stats(allSales, allContacts, win.cur);
  const prev = stats(allSales, allContacts, win.prev);

  const replyTimes = contacts.map(replyMs).filter((v): v is number => v != null).sort((a, b) => a - b);
  const waiting = allContacts.filter((c) => Date.now() - new Date(c.last_message_at).getTime() < 7 * DAY && isWaiting(c));

  // Série temporal: horas (Hoje) ou dias.
  const buckets = period === 1
    ? Array.from({ length: 24 }, (_, h) => ({ key: String(h), label: `${h}h`, tip: `Hoje, ${h}h–${h + 1}h` }))
    : Array.from({ length: period }, (_, i) => {
        const d = Date.now() - (period - 1 - i) * DAY;
        return { key: dayKey(d), label: fmtDay(d), tip: fmtWeekday(d) };
      });
  const keyOf = period === 1 ? (iso: string) => String(hourOf(iso)) : dayKey;

  const timeline = buckets.map((b) => ({ ...b, receita: 0, vendas: 0, anuncio: 0, organico: 0 }));
  const idx = new Map(timeline.map((t, i) => [t.key, i]));
  for (const s of sales) {
    const t = timeline[idx.get(keyOf(s.sold_at)) ?? -1];
    if (t) { t.receita += amountOf(s); t.vendas++; }
  }
  for (const c of newContacts) {
    const t = timeline[idx.get(keyOf(c.first_seen_at)) ?? -1];
    if (t) c.ad_source_id ? t.anuncio++ : t.organico++;
  }

  const hours = Array.from({ length: 24 }, (_, h) => ({ hora: `${h}h`, contatos: 0 }));
  newContacts.forEach((c) => hours[hourOf(c.first_seen_at)].contatos++);

  const origin = [
    { origem: 'Anúncio', key: 'anuncio', list: sales.filter((s) => s.contacts?.ad_source_id) },
    { origem: 'Orgânico', key: 'organico', list: sales.filter((s) => !s.contacts?.ad_source_id) },
  ].map((o) => ({ origem: o.origem, key: o.key, receita: sum(o.list), vendas: o.list.length }));

  return {
    contacts,
    sales,
    newContacts,
    cur,
    prev,
    messages: contacts.reduce((t, c) => t + (c.message_count || 0), 0),
    adContacts: newContacts.filter((c) => c.ad_source_id).length,
    waiting: waiting.length,
    medianReply: replyTimes.length ? replyTimes[Math.floor(replyTimes.length / 2)] : null,
    timeline,
    hours,
    origin,
  };
}

export type Dashboard = ReturnType<typeof computeDashboard>;

/** Variação percentual; null quando não há base de comparação. */
export const delta = (cur: number, prev: number) => (prev > 0 ? (cur - prev) / prev : null);
