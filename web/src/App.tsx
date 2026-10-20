import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Charts } from '@/components/Charts';
import { ClientsTable } from '@/components/ClientsTable';
import { Conversations } from '@/components/Conversations';
import { Header, type View } from '@/components/Header';
import { KpiCards } from '@/components/KpiCards';
import { Login } from '@/components/Login';
import { ManualSaleDialog, type ManualSale } from '@/components/ManualSaleDialog';
import { SalesDialog } from '@/components/SalesDialog';
import { api, session, UnauthorizedError, type Contact, type DashboardData } from '@/lib/api';
import { brl, dayKey, fmtPhone, setTimezone } from '@/lib/format';
import { computeDashboard, fetchDays, type Period } from '@/lib/metrics';

const PERIOD_KEY = 'vf_period';
const VIEW_KEY = 'vf_view';
const readView = (): View => { try { return localStorage.getItem(VIEW_KEY) === 'conversas' ? 'conversas' : 'painel'; } catch { return 'painel'; } };
const readPeriod = (): Period => {
  try { const v = Number(localStorage.getItem(PERIOD_KEY)); return ([1, 7, 30, 90] as const).find((p) => p === v) ?? 30; } catch { return 30; }
};

export default function App() {
  const [authed, setAuthed] = useState(() => !!session.get());
  const [loginError, setLoginError] = useState<string>();
  const [period, setPeriod] = useState<Period>(readPeriod);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [salesFor, setSalesFor] = useState<string | null>(null);
  const [view, setView] = useState<View>(readView);
  const [chatWith, setChatWith] = useState<string | null>(null);
  const [chats, setChats] = useState<Contact[] | null>(null);
  const [manualOpen, setManualOpen] = useState(false);

  const logout = useCallback((msg?: string) => {
    session.set(''); setAuthed(false); setData(null); setLoginError(msg);
  }, []);

  const handleError = useCallback((e: unknown, prefix: string) => {
    if (e instanceof UnauthorizedError) logout(e.message);
    else toast.error(`${prefix}: ${e instanceof Error ? e.message : String(e)}`);
  }, [logout]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // A aba Conversas tem lista própria (últimos 180 dias, independente do período do painel).
      const [d, c] = await Promise.all([api.dashboard(fetchDays(period)), view === 'conversas' ? api.conversations() : null]);
      setTimezone(d.timezone);
      setData(d);
      if (c) setChats(c.contacts);
      setUpdatedAt(new Date());
    } catch (e) {
      handleError(e, 'Erro ao carregar');
    } finally {
      setLoading(false);
    }
  }, [period, view, handleError]);

  useEffect(() => { if (authed) load(); }, [authed, load]);

  // Atualização automática (mais rápida nas conversas); no painel, pausa enquanto alguém digita um valor de venda.
  useEffect(() => {
    if (!authed) return;
    const id = setInterval(() => {
      const typing = view === 'painel' && (document.activeElement as HTMLElement | null)?.closest?.('form');
      if (!document.hidden && !typing) load();
    }, view === 'conversas' ? 8_000 : 30_000);
    return () => clearInterval(id);
  }, [authed, load, view]);

  const patchContact = useCallback((waId: string, patch: Partial<Contact>) => {
    setData((d) => d && { ...d, contacts: d.contacts.map((c) => (c.wa_id === waId ? { ...c, ...patch } : c)) });
    setChats((list) => list && list.map((c) => (c.wa_id === waId ? { ...c, ...patch } : c)));
  }, []);
  const waiting = (chats ?? data?.contacts ?? []).filter((c) => c.handoff_at).length;
  // Cliente aberto pela tabela pode estar fora da lista de conversas (ex.: venda manual sem mensagens).
  const chatList = useMemo(() => {
    const list = chats ?? data?.contacts ?? [];
    const extra = chatWith && !list.some((c) => c.wa_id === chatWith) ? data?.contacts.find((c) => c.wa_id === chatWith) : undefined;
    return extra ? [extra, ...list] : list;
  }, [chats, data, chatWith]);

  const dashboard = useMemo(() => (data ? computeDashboard(data, period, '') : null), [data, period]);
  const salesContact = data?.contacts.find((c) => c.wa_id === salesFor) ?? null;

  async function addSale(c: Contact, amount: string, date?: string) {
    try {
      const { sale } = await api.addSale({ wa_id: c.wa_id, amount, ...(date ? { sold_at: `${date}T12:00:00-03:00` } : {}) });
      setData((d) => d && {
        ...d,
        contacts: d.contacts.map((x) => (x.wa_id === c.wa_id ? { ...x, stage: 'faturado' as const, sales: [...(x.sales ?? []), sale] } : x)),
        sales: [{ ...sale, contacts: { name: c.name, ad_source_id: c.ad_source_id } }, ...d.sales],
      });
      setChats((list) => list && list.map((x) => (x.wa_id === c.wa_id ? { ...x, stage: 'faturado' } : x)));
      toast.success(`Venda de ${brl(Number(sale.amount))} lançada`, { description: c.name || fmtPhone(c.wa_id) });
      return true;
    } catch (e) {
      handleError(e, 'Não foi possível lançar');
      return false;
    }
  }

  async function deleteSale(c: Contact, id: number) {
    try {
      await api.deleteSale(id);
      setData((d) => d && {
        ...d,
        contacts: d.contacts.map((x) => (x.wa_id === c.wa_id ? { ...x, sales: x.sales.filter((s) => s.id !== id) } : x)),
        sales: d.sales.filter((s) => s.id !== id),
      });
      toast('Venda excluída');
    } catch (e) {
      handleError(e, 'Não foi possível excluir');
    }
  }

  async function addManualSale(f: ManualSale) {
    try {
      const { sale } = await api.addManualSale({
        name: f.name.trim(), phone: f.phone, amount: f.amount, note: f.note,
        ...(f.date !== dayKey(Date.now()) ? { sold_at: `${f.date}T12:00:00-03:00` } : {}),
      });
      toast.success(`Venda de ${brl(Number(sale.amount))} lançada`, { description: f.name.trim() });
      load();
      return true;
    } catch (e) {
      handleError(e, 'Não foi possível lançar');
      return false;
    }
  }

  const changeView = (v: View) => { setView(v); try { localStorage.setItem(VIEW_KEY, v); } catch { /* sem storage */ } };

  if (!authed) {
    return <Login error={loginError} onSubmit={(pwd) => { session.set(pwd); setLoginError(undefined); setAuthed(true); }} />;
  }

  return (
    <div className="min-h-svh">
      <Header
        view={view} waiting={waiting}
        onView={changeView}
        period={period}
        onPeriod={(p) => { setPeriod(p); try { localStorage.setItem(PERIOD_KEY, String(p)); } catch { /* sem storage */ } }}
        updatedAt={updatedAt} loading={loading} onRefresh={load} onLogout={() => logout()}
      />
      <main className="mx-auto flex max-w-[1400px] flex-col gap-4 px-4 py-6 sm:px-6">
        {view === 'conversas' && data ? (
          <Conversations
            contacts={chatList} aiOn={data.ai} selected={chatWith} onSelect={setChatWith}
            onContactChange={patchContact} onError={handleError}
          />
        ) : !dashboard ? (
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
              <Skeleton className="col-span-2 row-span-2 h-[232px] rounded-xl" />
              <Skeleton className="col-span-2 row-span-2 h-[232px] rounded-xl" />
              {Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
            </div>
            <Skeleton className="h-80 rounded-xl" />
          </div>
        ) : (
          <>
            <KpiCards d={dashboard} period={period} />
            <Charts d={dashboard} period={period} />
            <ClientsTable contacts={dashboard.contacts} lines={data!.lines} onAdd={(c, a) => addSale(c, a)} onOpenSales={(c) => setSalesFor(c.wa_id)}
              onOpenChat={(c) => { setChatWith(c.wa_id); changeView('conversas'); }}
              onNewManual={() => setManualOpen(true)}
            />
          </>
        )}
      </main>
      <ManualSaleDialog open={manualOpen} onClose={() => setManualOpen(false)} onSave={addManualSale} />
      <SalesDialog contact={salesContact} onClose={() => setSalesFor(null)} onAdd={addSale} onDelete={deleteSale} />
    </div>
  );
}
