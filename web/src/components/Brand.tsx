import { brand } from '@/brand';
import { cn } from '@/lib/utils';

/** Monograma provisório. Para usar a logo, troque por <img src="/logo-icone.png" /> (veja README). */
export function Monogram({ className }: { className?: string }) {
  return (
    <div className={cn('grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-lg font-bold text-primary-foreground shadow-sm', className)}>
      {brand.monogram}
      <span className="sr-only">{brand.name}</span>
    </div>
  );
}

export function Brand({ subtitle }: { subtitle?: string }) {
  return (
    <div className="flex items-center gap-3">
      <Monogram />
      <div className="flex flex-col leading-tight">
        <span className="text-[17px] font-bold tracking-tight">{brand.name}</span>
        {subtitle && <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{subtitle}</span>}
      </div>
    </div>
  );
}
