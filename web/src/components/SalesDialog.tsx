import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import type { Contact } from '@/lib/api';
import { brl, dayKey, fmtDate, fmtPhone } from '@/lib/format';
import { amountOf, totalOf } from '@/lib/metrics';

interface Props {
  contact: Contact | null;
  onClose: () => void;
  onAdd: (contact: Contact, amount: string, date?: string) => Promise<boolean>;
  onDelete: (contact: Contact, saleId: number) => Promise<void>;
}

export function SalesDialog({ contact, onClose, onAdd, onDelete }: Props) {
  const today = dayKey(Date.now());
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(today);
  const [busy, setBusy] = useState(false);
  const sales = [...(contact?.sales ?? [])].sort((a, b) => b.sold_at.localeCompare(a.sold_at));

  return (
    <Dialog open={!!contact} onOpenChange={(o) => { if (!o) { onClose(); setAmount(''); setDate(today); } }}>
      <DialogContent className="sm:max-w-md">
        {contact && (
          <>
            <DialogHeader>
              <DialogTitle>{contact.name || 'Sem nome'}</DialogTitle>
              <DialogDescription>{fmtPhone(contact.wa_id)} · total vendido <b className="text-foreground">{brl(totalOf(contact))}</b></DialogDescription>
            </DialogHeader>

            <div className="max-h-64 space-y-1 overflow-y-auto">
              {sales.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma venda lançada.</p>}
              {sales.map((s) => (
                <div key={s.id} className="group flex items-center justify-between rounded-lg px-3 py-2 hover:bg-muted">
                  <div>
                    <div className="font-semibold tabular">{brl(amountOf(s))}</div>
                    <div className="text-xs text-muted-foreground">{fmtDate(s.sold_at)}</div>
                  </div>
                  <Button
                    variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-destructive"
                    aria-label={`Excluir venda de ${brl(amountOf(s))}`}
                    onClick={() => { if (confirm(`Excluir a venda de ${brl(amountOf(s))} de ${fmtDate(s.sold_at)}?`)) onDelete(contact, s.id); }}
                  >
                    <Trash2 />
                  </Button>
                </div>
              ))}
            </div>

            <Separator />

            <form
              className="flex flex-wrap items-end gap-2"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!amount.trim()) return;
                setBusy(true);
                if (await onAdd(contact, amount, date !== today ? date : undefined)) setAmount('');
                setBusy(false);
              }}
            >
              <label className="flex flex-1 flex-col gap-1 text-xs font-medium text-muted-foreground">
                Valor
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                  <Input inputMode="decimal" placeholder="0,00" className="pl-9 tabular" value={amount} onChange={(e) => setAmount(e.target.value)} />
                </div>
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
                Data
                <Input type="date" max={today} value={date} onChange={(e) => setDate(e.target.value)} />
              </label>
              <Button type="submit" disabled={busy}>Lançar venda</Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
