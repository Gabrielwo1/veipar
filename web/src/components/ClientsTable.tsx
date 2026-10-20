import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ChevronsUpDown, Download, History, Loader2, Megaphone, MessagesSquare, PenLine, Plus, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { Contact } from '@/lib/api';
import { brl, dayKey, fmtDate, fmtPhone, fmtTime, int, plural } from '@/lib/format';
import { hasPhone, isManual, isWaiting, replyMs, totalOf } from '@/lib/metrics';
import { cn } from '@/lib/utils';
import { StageBadge } from './Stage';

type SortKey = 'last' | 'name' | 'total';
type Status = 'all' | 'wait' | 'sold' | 'nosale' | 'ad';
const PAGE = 25;

function initials(name: string | null) {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  return parts.length ? (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase() : '?';
}

function StatusBadge({ c }: { c: Contact }) {
  if (isWaiting(c)) return <Badge className="gap-1.5 border-amber-200 bg-amber-50 text-amber-800"><span className="size-1.5 animate-pulse rounded-full bg-amber-500" />Aguardando</Badge>;
  if (c.sales?.length) return <Badge className="gap-1.5 border-brand/25 bg-brand-soft text-brand-deep"><span className="size-1.5 rounded-full bg-brand" />Vendido</Badge>;
  return <Badge variant="outline" className="gap-1.5 text-graphite"><span className="size-1.5 rounded-full bg-graphite/60" />Respondido</Badge>;
}

function SaleInput({ c, onAdd }: { c: Contact; onAdd: (c: Contact, amount: string) => Promise<boolean> }) {
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="flex items-center gap-1.5"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!value.trim() || busy) return;
        setBusy(true);
        if (await onAdd(c, value)) setValue('');
        setBusy(false);
      }}
    >
      <div className="relative">
        <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">R$</span>
        <Input
          inputMode="decimal" placeholder="0,00" value={value} onChange={(e) => setValue(e.target.value)}
          aria-label={`Valor da venda para ${c.name || fmtPhone(c.wa_id)}`}
          className="h-8 w-28 pl-8 tabular" data-sale-input
        />
      </div>
      <Button type="submit" size="icon-sm" className="size-8" disabled={busy} aria-label="Lançar venda">
        {busy ? <Loader2 className="animate-spin" /> : <Plus />}
      </Button>
    </form>
  );
}

interface Props {
  contacts: Contact[];
  lines: Record<string, string>;
  onAdd: (c: Contact, amount: string) => Promise<boolean>;
  onOpenSales: (c: Contact) => void;
  /** Abre a conversa do cliente na aba Conversas. */
  onOpenChat: (c: Contact) => void;
  onNewManual: () => void;
}

export function ClientsTable({ contacts, lines, onAdd, onOpenSales, onOpenChat, onNewManual }: Props) {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<Status>('all');
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'last', dir: -1 });
  const [limit, setLimit] = useState(PAGE);
  const showLine = Object.keys(lines).length > 1;
  const today = dayKey(Date.now());

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase(), digits = term.replace(/\D/g, '');
    const val: Record<SortKey, (c: Contact) => number | string> = {
      last: (c) => new Date(c.last_message_at).getTime(),
      name: (c) => (c.name ?? '').toLocaleLowerCase('pt-BR'),
      total: totalOf,
    };
    return contacts
      .filter((c) =>
        (!term || (c.name ?? '').toLowerCase().includes(term) || (!!digits && c.wa_id.includes(digits))) &&
        (status !== 'wait' || isWaiting(c)) &&
        (status !== 'sold' || c.sales?.length) &&
        (status !== 'nosale' || !c.sales?.length) &&
        (status !== 'ad' || c.ad_source_id))
      .sort((a, b) => {
        const x = val[sort.key](a), y = val[sort.key](b);
        return (x > y ? 1 : x < y ? -1 : 0) * sort.dir;
      });
  }, [contacts, q, status, sort]);

  const toggleSort = (key: SortKey) =>
    setSort((s) => ({ key, dir: s.key === key ? (-s.dir as 1 | -1) : key === 'name' ? 1 : -1 }));

  const SortHead = ({ k, children, className }: { k: SortKey; children: string; className?: string }) => {
    const Icon = sort.key !== k ? ChevronsUpDown : sort.dir === 1 ? ArrowUp : ArrowDown;
    return (
      <TableHead className={className} aria-sort={sort.key === k ? (sort.dir === 1 ? 'ascending' : 'descending') : undefined}>
        <button type="button" onClick={() => toggleSort(k)} className="inline-flex items-center gap-1 hover:text-foreground">
          {children}<Icon className={cn('size-3.5', sort.key !== k && 'opacity-40')} />
        </button>
      </TableHead>
    );
  };

  function exportCsv() {
    const head = ['ultima_mensagem', 'primeiro_contato', 'nome', 'telefone', 'linha', 'origem', 'anuncio', 'mensagens', 'vendas', 'total_vendido', 'primeira_resposta_min'];
    const body = rows.map((c) => [
      c.last_message_at, c.first_seen_at, c.name ?? '', c.wa_id, lines[c.line ?? ''] ?? c.line ?? '',
      isManual(c) ? 'manual' : c.ad_source_id ? 'anuncio' : 'organico', c.ad_headline ?? '', c.message_count, c.sales?.length ?? 0,
      totalOf(c).toFixed(2).replace('.', ','), replyMs(c) == null ? '' : Math.round(replyMs(c)! / 60000),
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(';'));
    const blob = new Blob(['﻿' + [head.join(';'), ...body].join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `clientes-whatsapp-${today}.csv` });
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const totalShown = rows.reduce((t, c) => t + totalOf(c), 0);

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <div className="flex flex-wrap items-center gap-2 border-b px-5 py-4">
        <div className="mr-auto">
          <h2 className="text-[15px] font-semibold">Clientes</h2>
          <p className="text-sm text-muted-foreground">{plural(rows.length, 'cliente', 'clientes')} · {brl(totalShown)} em vendas</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar nome ou telefone" className="pl-9" value={q} onChange={(e) => { setQ(e.target.value); setLimit(PAGE); }} />
        </div>
        <Select value={status} onValueChange={(v) => { setStatus(v as Status); setLimit(PAGE); }}>
          <SelectTrigger className="w-[190px]" aria-label="Filtrar por status"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="wait">Aguardando resposta</SelectItem>
            <SelectItem value="sold">Com venda</SelectItem>
            <SelectItem value="nosale">Sem venda</SelectItem>
            <SelectItem value="ad">Vieram de anúncio</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={exportCsv}><Download />CSV</Button>
        <Button onClick={onNewManual}><Plus />Venda manual</Button>
      </div>

      <Table className="min-w-[1040px]">
        <TableHeader className="bg-muted/50">
          <TableRow className="text-xs uppercase tracking-wide hover:bg-transparent [&_th]:h-10 [&_th]:text-muted-foreground">
            <SortHead k="last" className="pl-5">Data</SortHead>
            <SortHead k="name">Cliente</SortHead>
            <TableHead>Telefone</TableHead>
            <TableHead>Origem</TableHead>
            <TableHead>Status</TableHead>
            <SortHead k="total" className="text-right">Total vendido</SortHead>
            <TableHead>Lançar venda</TableHead>
            <TableHead className="pr-5 text-right">Contato</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.slice(0, limit).map((c) => {
            const total = totalOf(c);
            const isToday = dayKey(c.last_message_at) === today;
            return (
              <TableRow key={c.wa_id} className="group">
                <TableCell className="pl-5">
                  <div className="font-medium tabular">{isToday ? 'Hoje' : fmtDate(c.last_message_at)}</div>
                  <div className="text-xs text-muted-foreground tabular">{fmtTime(c.last_message_at)} · {plural(c.message_count, 'msg', 'msgs')}</div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-soft to-brand/15 text-xs font-semibold text-brand-deep">
                      {initials(c.name)}
                    </div>
                    <div>
                      <div className="font-medium">{c.name || <span className="text-muted-foreground">Sem nome</span>}</div>
                      <div className="text-xs text-muted-foreground">
                        cliente desde {fmtDate(c.first_seen_at)}{showLine && c.line ? ` · ${lines[c.line] ?? fmtPhone(c.line)}` : ''}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="tabular text-graphite">{fmtPhone(c.wa_id)}</TableCell>
                <TableCell>
                  {isManual(c) ? (
                    <Badge variant="outline" className="gap-1 text-graphite"><PenLine className="size-3" />Manual</Badge>
                  ) : c.ad_source_id ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="outline" className="gap-1 border-primary/15 bg-primary/[0.04] text-foreground"><Megaphone className="size-3" />Anúncio</Badge>
                      </TooltipTrigger>
                      <TooltipContent>{c.ad_headline || `Anúncio ${c.ad_source_id}`}</TooltipContent>
                    </Tooltip>
                  ) : <span className="text-sm text-muted-foreground">Orgânico</span>}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col items-start gap-1">
                    <StageBadge stage={c.stage} />
                    {isWaiting(c) && <StatusBadge c={c} />}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <button type="button" onClick={() => onOpenSales(c)} className="group/total inline-flex flex-col items-end rounded-md px-2 py-1 hover:bg-muted">
                    <span className={cn('font-semibold tabular', !total && 'font-normal text-muted-foreground')}>{total ? brl(total) : '—'}</span>
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground group-hover/total:text-foreground">
                      <History className="size-3" />{c.sales?.length ? plural(c.sales.length, 'venda', 'vendas') : 'histórico'}
                    </span>
                  </button>
                </TableCell>
                <TableCell><SaleInput c={c} onAdd={onAdd} /></TableCell>
                <TableCell className="pr-5 text-right">
                  {hasPhone(c) && (
                    <Button size="sm" onClick={() => onOpenChat(c)} className="bg-[#1fa855] text-white shadow-sm shadow-[#1fa855]/30 hover:bg-[#1a9049]"
                      aria-label={`Abrir conversa com ${c.name || fmtPhone(c.wa_id)}`}>
                      <MessagesSquare className="size-4" />Conversar
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {rows.length === 0 && <div className="py-16 text-center text-sm text-muted-foreground">Nenhum cliente neste filtro.</div>}

      <div className="flex flex-wrap items-center justify-between gap-2 border-t px-5 py-3 text-xs text-muted-foreground">
        <span>Mostrando {int(Math.min(limit, rows.length))} de {int(rows.length)}</span>
        {rows.length > limit
          ? <Button variant="outline" size="sm" onClick={() => setLimit((l) => l + PAGE)}>Mostrar mais</Button>
          : <span>Digite o valor e aperte Enter para lançar a venda com a data de hoje.</span>}
      </div>
    </Card>
  );
}
