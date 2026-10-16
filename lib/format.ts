/** 5546999990000 → +55 (46) 99999-0000 */
export function formatPhone(waId: string): string {
  const d = waId.replace(/\D/g, '');
  if (d.startsWith('55') && (d.length === 12 || d.length === 13)) {
    const ddd = d.slice(2, 4);
    const num = d.slice(4);
    const split = num.length - 4;
    return `+55 (${ddd}) ${num.slice(0, split)}-${num.slice(split)}`;
  }
  return '+' + d;
}

export function formatDateTime(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
