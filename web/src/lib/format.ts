export const TZ_DEFAULT = 'America/Sao_Paulo';
let tz = TZ_DEFAULT;
export const setTimezone = (value: string) => { tz = value || TZ_DEFAULT; };

const cache = new Map<string, Intl.DateTimeFormat>();
function dtf(locale: string, opts: Intl.DateTimeFormatOptions) {
  const key = locale + tz + JSON.stringify(opts);
  let f = cache.get(key);
  if (!f) cache.set(key, (f = new Intl.DateTimeFormat(locale, { timeZone: tz, ...opts })));
  return f;
}

export const brl = (n: number, cents = true) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL',
    minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: cents ? 2 : 0,
  }).format(n || 0);

export const brlCompact = (n: number) =>
  n >= 1000
    ? 'R$ ' + new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 }).format(n)
    : brl(n, false);

export const int = (n: number) => new Intl.NumberFormat('pt-BR').format(n);
export const plural = (n: number, one: string, many: string) => `${int(n)} ${n === 1 ? one : many}`;

export const dayKey = (d: string | number | Date) => dtf('en-CA', {}).format(new Date(d));
export const hourOf = (d: string | number | Date) =>
  Number(dtf('en-US', { hour: 'numeric', hourCycle: 'h23' }).format(new Date(d)));
export const fmtDay = (d: string | number | Date) => dtf('pt-BR', { day: '2-digit', month: '2-digit' }).format(new Date(d));
export const fmtWeekday = (d: string | number | Date) =>
  dtf('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' }).format(new Date(d));
export const fmtDate = (d: string | number | Date) =>
  dtf('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(d));
export const fmtTime = (d: string | number | Date) => dtf('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(d));

export function fmtPhone(waId: string) {
  if (!/^\d+$/.test(waId)) return 'Sem telefone'; // cliente manual sem telefone
  const d = waId;
  if (d.startsWith('55') && (d.length === 12 || d.length === 13)) {
    const num = d.slice(4), s = num.length - 4;
    return `(${d.slice(2, 4)}) ${num.slice(0, s)}-${num.slice(s)}`;
  }
  return '+' + d;
}

export function fmtDuration(ms: number | null) {
  if (ms == null || ms < 0) return '—';
  const m = Math.round(ms / 60000);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  return h < 24 ? `${h}h${String(m % 60).padStart(2, '0')}` : `${Math.floor(h / 24)}d ${h % 24}h`;
}
