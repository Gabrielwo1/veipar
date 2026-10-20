import { ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import type { Stage } from '@/lib/api';
import { cn } from '@/lib/utils';

export const STAGE: Record<Stage, { label: string; className: string; dot: string }> = {
  esperando: { label: 'Esperando contato', className: 'border-amber-300 bg-amber-50 text-amber-800', dot: 'bg-amber-500' },
  pedido: { label: 'Pedido realizado', className: 'border-sky-300 bg-sky-50 text-sky-800', dot: 'bg-sky-500' },
  faturado: { label: 'Faturamento realizado', className: 'border-emerald-300 bg-emerald-50 text-emerald-800', dot: 'bg-emerald-500' },
};
const ORDER: Stage[] = ['esperando', 'pedido', 'faturado'];

export function StageBadge({ stage, className }: { stage: Stage; className?: string }) {
  const s = STAGE[stage] ?? STAGE.esperando;
  return (
    <Badge variant="outline" className={cn('gap-1.5', s.className, className)}>
      <span className={cn('size-1.5 rounded-full', s.dot)} />{s.label}
    </Badge>
  );
}

/** Tag clicável para mudar a etapa da conversa. */
export function StageSelect({ stage, onChange }: { stage: Stage; onChange: (s: Stage) => void }) {
  const s = STAGE[stage] ?? STAGE.esperando;
  return (
    <Select value={stage} onValueChange={(v) => v !== stage && onChange(v as Stage)}>
      <SelectTrigger
        size="sm" aria-label="Etapa da conversa"
        className={cn('h-7 gap-1.5 rounded-full border px-2.5 text-xs font-semibold shadow-none [&>svg:last-child]:hidden', s.className)}
      >
        <span className={cn('size-1.5 rounded-full', s.dot)} />{s.label}<ChevronDown className="size-3 opacity-70" />
      </SelectTrigger>
      <SelectContent position="popper" align="start" sideOffset={4}>
        {ORDER.map((k) => (
          <SelectItem key={k} value={k} className="text-sm">
            <span className={cn('size-2 rounded-full', STAGE[k].dot)} />{STAGE[k].label}
            {k === 'faturado' && <span className="text-xs text-muted-foreground">· automático ao lançar venda</span>}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
