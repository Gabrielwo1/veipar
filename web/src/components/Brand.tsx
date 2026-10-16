import { brand } from '@/brand';
import { cn } from '@/lib/utils';

/** Ícone da marca (web/public/logo-icone.png). Sem a logo, troque pelo monograma em brand.monogram. */
export function Monogram({ className }: { className?: string }) {
  return <img src="/logo-icone.png" alt={brand.name} className={cn('size-10 shrink-0 rounded-full shadow-sm', className)} />;
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
