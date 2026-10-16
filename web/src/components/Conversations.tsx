import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Bot, ClipboardList, Hand, Search, SendHorizontal, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { api, type ChatMessage, type Contact } from '@/lib/api';
import { dayKey, fmtDate, fmtPhone, fmtTime } from '@/lib/format';
import { cn } from '@/lib/utils';

type Filter = 'all' | 'waiting' | 'ai' | 'team';

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'waiting', label: 'Aguardando' },
  { value: 'ai', label: 'IA' },
  { value: 'team', label: 'Equipe' },
];

const MOTIVO: Record<string, string> = {
  pedido_pronto: 'Pedido pronto',
  pediu_humano: 'Pediu atendente',
  fora_do_escopo: 'Precisa da equipe',
};

const MEDIA: Record<string, string> = {
  audio: '🎤 Áudio', image: '📷 Imagem', video: '🎬 Vídeo', document: '📄 Documento',
  sticker: 'Figurinha', location: '📍 Localização', contact: '👤 Contato',
};

/** Encaminhada pela IA e ninguém da equipe respondeu ou assumiu ainda (o servidor limpa handoff_at quando isso acontece). */
const isWaiting = (c: Contact) => !!c.handoff_at;

function statusOf(c: Contact, aiOn: boolean): { label: string; className: string } {
  if (c.handoff_at) return { label: MOTIVO[c.handoff_summary?.motivo ?? ''] ?? 'Para a equipe', className: 'border-amber-300 bg-amber-50 text-amber-800' };
  if (c.ai_enabled && aiOn) return { label: 'IA atendendo', className: 'border-brand/25 bg-brand-soft text-brand-deep' };
  return { label: 'Equipe', className: 'border-border bg-muted text-muted-foreground' };
}

const initials = (name: string | null) =>
  (name ?? '').trim().split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join('') || '#';

interface Props {
  contacts: Contact[];
  aiOn: boolean;
  onContactChange: (waId: string, patch: Partial<Contact>) => void;
  onError: (e: unknown, prefix: string) => void;
}

export function Conversations({ contacts, aiOn, onContactChange, onError }: Props) {
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string | null>(null);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const digits = q.replace(/\D/g, '');
    return contacts
      .filter((c) =>
        filter === 'waiting' ? isWaiting(c)
          : filter === 'ai' ? c.ai_enabled && !c.handoff_at
            : filter === 'team' ? !c.ai_enabled && !c.handoff_at
              : true)
      .filter((c) => !q || (c.name ?? '').toLowerCase().includes(q) || (digits && c.wa_id.includes(digits)))
      .sort((a, b) => b.last_message_at.localeCompare(a.last_message_at));
  }, [contacts, filter, query]);

  const waitingCount = useMemo(() => contacts.filter(isWaiting).length, [contacts]);
  const contact = contacts.find((c) => c.wa_id === selected) ?? null;
  const today = dayKey(new Date());

  return (
    <Card className="grid h-[calc(100svh-7.5rem)] min-h-[520px] gap-0 overflow-hidden p-0 md:grid-cols-[340px_1fr]">
      <aside className={cn('flex min-h-0 flex-col border-r', contact && 'max-md:hidden')}>
        <div className="space-y-3 border-b p-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar nome ou telefone" className="pl-9" />
          </div>
          <ToggleGroup type="single" size="sm" variant="outline" value={filter} onValueChange={(v) => v && setFilter(v as Filter)} className="w-full">
            {FILTERS.map((f) => (
              <ToggleGroupItem key={f.value} value={f.value} className="flex-auto gap-1 px-2 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                {f.label}
                {f.value === 'waiting' && waitingCount > 0 && (
                  <span className="rounded-full bg-amber-500 px-1.5 text-[10px] font-semibold text-white">{waitingCount}</span>
                )}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
        <ul className="min-h-0 flex-1 overflow-y-auto">
          {rows.map((c) => {
            const st = statusOf(c, aiOn);
            return (
              <li key={c.wa_id}>
                <button
                  type="button" onClick={() => setSelected(c.wa_id)}
                  className={cn('flex w-full gap-3 border-b px-3 py-3 text-left hover:bg-muted/60', selected === c.wa_id && 'bg-brand-soft/60 hover:bg-brand-soft/60')}
                >
                  <div className="grid size-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-soft to-brand/15 text-xs font-semibold text-brand-deep">
                    {initials(c.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate font-medium">{c.name || fmtPhone(c.wa_id)}</span>
                      <span className="shrink-0 text-[11px] text-muted-foreground tabular">
                        {dayKey(c.last_message_at) === today ? fmtTime(c.last_message_at) : fmtDate(c.last_message_at).slice(0, 5)}
                      </span>
                    </div>
                    <div className="truncate text-sm text-muted-foreground">{c.last_preview ?? '—'}</div>
                    <Badge variant="outline" className={cn('mt-1.5 h-5 px-1.5 text-[10px]', st.className)}>{st.label}</Badge>
                  </div>
                </button>
              </li>
            );
          })}
          {rows.length === 0 && <li className="p-8 text-center text-sm text-muted-foreground">Nenhuma conversa neste filtro.</li>}
        </ul>
      </aside>

      {contact ? (
        <Thread key={contact.wa_id} contact={contact} aiOn={aiOn} onBack={() => setSelected(null)} onContactChange={onContactChange} onError={onError} />
      ) : (
        <div className="hidden flex-col items-center justify-center gap-2 bg-muted/30 text-center text-sm text-muted-foreground md:flex">
          <Bot className="size-8 text-brand" />
          Escolha uma conversa para ver as mensagens.
          {aiOn ? <span>A IA responde sozinha até o pedido ficar pronto.</span> : <span>IA desligada: configure ANTHROPIC_API_KEY na Vercel.</span>}
        </div>
      )}
    </Card>
  );
}

function Thread({ contact, aiOn, onBack, onContactChange, onError }: {
  contact: Contact; aiOn: boolean; onBack: () => void;
  onContactChange: Props['onContactChange']; onError: Props['onError'];
}) {
  const [messages, setMessages] = useState<ChatMessage[] | null>(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);
  const waId = contact.wa_id;

  const load = useCallback(async () => {
    try {
      const { messages } = await api.messages(waId);
      setMessages((prev) => (prev && prev.length === messages.length && prev.at(-1)?.id === messages.at(-1)?.id ? prev : messages));
    } catch (e) {
      onError(e, 'Erro ao abrir a conversa');
    }
  }, [waId, onError]);

  useEffect(() => {
    load();
    const id = setInterval(() => { if (!document.hidden) load(); }, 4000);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => { bottom.current?.scrollIntoView({ block: 'end' }); }, [messages]);

  async function send() {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      const { message } = await api.send(waId, body);
      setMessages((m) => [...(m ?? []), message]);
      setText('');
      onContactChange(waId, { ai_enabled: false, handoff_at: null, last_preview: body, last_reply_at: message.sent_at });
    } catch (e) {
      onError(e, 'Não foi possível enviar');
    } finally {
      setSending(false);
    }
  }

  const aiActive = contact.ai_enabled && !contact.handoff_at;

  async function toggleAi() {
    const enable = !aiActive && !contact.handoff_at;
    try {
      await api.setAi(waId, enable);
      onContactChange(waId, { ai_enabled: enable, handoff_at: null });
      toast(enable ? 'A IA voltou a atender esta conversa' : 'Você assumiu a conversa. A IA não responde mais aqui.');
    } catch (e) {
      onError(e, 'Não foi possível alterar');
    }
  }

  const st = statusOf(contact, aiOn);
  const s = contact.handoff_summary;

  return (
    <section className="flex min-h-0 flex-col">
      <header className="flex items-center gap-3 border-b px-4 py-3">
        <Button variant="ghost" size="icon-sm" className="md:hidden" onClick={onBack} aria-label="Voltar"><ArrowLeft /></Button>
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold">{contact.name || fmtPhone(waId)}</div>
          <div className="text-xs text-muted-foreground tabular">{fmtPhone(waId)}</div>
        </div>
        <Badge variant="outline" className={cn('hidden sm:inline-flex', st.className)}>{st.label}</Badge>
        {aiOn && (
          <Button variant="outline" size="sm" onClick={toggleAi}>
            {aiActive || contact.handoff_at ? <><Hand />Assumir</> : <><Bot />Devolver para IA</>}
          </Button>
        )}
      </header>

      {s && (
        <div className="border-b bg-amber-50/70 px-4 py-3 text-sm">
          <div className="mb-1 flex items-center gap-2 font-semibold text-amber-900">
            <ClipboardList className="size-4" />Resumo da IA · {MOTIVO[s.motivo ?? ''] ?? 'Encaminhado'}
          </div>
          {s.resumo && <p className="text-amber-950">{s.resumo}</p>}
          {!!s.itens?.length && (
            <ul className="mt-1 list-inside list-disc text-amber-950">
              {s.itens.map((i, n) => <li key={n}><b>{i.quantidade}</b> · {i.produto}</li>)}
            </ul>
          )}
          <div className="mt-1 flex flex-wrap gap-x-4 text-xs text-amber-900/80">
            {s.nome_cliente && <span>Nome: {s.nome_cliente}</span>}
            {s.cidade_uf && <span>Cidade: {s.cidade_uf}</span>}
            {s.perfil && <span>Perfil: {s.perfil}</span>}
            {s.observacoes && <span>Obs.: {s.observacoes}</span>}
          </div>
        </div>
      )}

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto bg-muted/30 px-4 py-4">
        {messages === null && <div className="py-10 text-center text-sm text-muted-foreground">Carregando…</div>}
        {messages?.length === 0 && <div className="py-10 text-center text-sm text-muted-foreground">Sem mensagens gravadas.</div>}
        {messages?.map((m, i) => {
          const mine = m.author !== 'customer';
          const newDay = i === 0 || dayKey(messages[i - 1]!.sent_at) !== dayKey(m.sent_at);
          return (
            <div key={m.id}>
              {newDay && <div className="my-3 text-center text-[11px] font-medium text-muted-foreground">{fmtDate(m.sent_at)}</div>}
              <div className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
                <div className={cn(
                  'max-w-[78%] whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-sm shadow-sm',
                  m.author === 'customer' && 'rounded-bl-sm bg-white',
                  m.author === 'ai' && 'rounded-br-sm bg-brand-soft text-foreground',
                  m.author === 'human' && 'rounded-br-sm bg-primary text-primary-foreground',
                )}>
                  {mine && (
                    <div className={cn('mb-0.5 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide', m.author === 'ai' ? 'text-brand-deep' : 'text-primary-foreground/70')}>
                      {m.author === 'ai' ? <><Bot className="size-3" />IA</> : <><UserRound className="size-3" />Equipe</>}
                    </div>
                  )}
                  {m.body ?? <span className="italic opacity-70">{MEDIA[m.type] ?? 'Mensagem sem texto'}</span>}
                  <div className={cn('mt-0.5 text-right text-[10px] tabular', m.author === 'human' ? 'text-primary-foreground/60' : 'text-muted-foreground')}>{fmtTime(m.sent_at)}</div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottom} />
      </div>

      <form className="flex items-end gap-2 border-t bg-white p-3" onSubmit={(e) => { e.preventDefault(); send(); }}>
        <textarea
          value={text} onChange={(e) => setText(e.target.value)} rows={1} maxLength={4000}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder={aiActive ? 'Escreva para assumir a conversa (a IA para de responder)…' : 'Escreva uma mensagem…'}
          className="max-h-40 min-h-10 flex-1 resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        />
        <Button type="submit" disabled={!text.trim() || sending} aria-label="Enviar"><SendHorizontal /></Button>
      </form>
    </section>
  );
}
