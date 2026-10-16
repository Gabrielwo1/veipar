import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { dayKey } from '@/lib/format';

export interface ManualSale { name: string; phone: string; amount: string; date: string; note: string }

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (sale: ManualSale) => Promise<boolean>;
}

/** Lança uma venda que não passou pelo WhatsApp (balcão, telefone, indicação...). */
export function ManualSaleDialog({ open, onClose, onSave }: Props) {
  const today = dayKey(Date.now());
  const empty: ManualSale = { name: '', phone: '', amount: '', date: today, note: '' };
  const [form, setForm] = useState<ManualSale>(empty);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof ManualSale) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const close = () => { setForm(empty); onClose(); };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) close(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Lançar venda manual</DialogTitle>
          <DialogDescription>
            Para vendas que não passaram pelo WhatsApp. Se o telefone já for de um cliente, a venda entra no histórico dele.
          </DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-3"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            if (await onSave(form)) close();
            setBusy(false);
          }}
        >
          <label className="grid gap-1 text-xs font-medium text-muted-foreground">
            Nome do cliente *
            <Input required autoFocus maxLength={120} value={form.name} onChange={set('name')} placeholder="Ex.: Construtora Silva" />
          </label>
          <label className="grid gap-1 text-xs font-medium text-muted-foreground">
            Telefone (opcional)
            <Input inputMode="tel" value={form.phone} onChange={set('phone')} placeholder="(46) 99999-0000" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1 text-xs font-medium text-muted-foreground">
              Valor *
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                <Input required inputMode="decimal" placeholder="0,00" className="pl-9 tabular" value={form.amount} onChange={set('amount')} />
              </div>
            </label>
            <label className="grid gap-1 text-xs font-medium text-muted-foreground">
              Data
              <Input type="date" max={today} value={form.date} onChange={set('date')} />
            </label>
          </div>
          <label className="grid gap-1 text-xs font-medium text-muted-foreground">
            Observação (opcional)
            <Input maxLength={500} value={form.note} onChange={set('note')} placeholder="Ex.: 1000 peças + 2 bicos, retirada no balcão" />
          </label>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={close}>Cancelar</Button>
            <Button type="submit" disabled={busy || !form.name.trim() || !form.amount.trim()}>Lançar venda</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
