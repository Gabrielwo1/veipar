import { LogOut, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { Period } from '@/lib/metrics';
import { Brand } from './Brand';

const PERIODS: { value: Period; label: string }[] = [
  { value: 1, label: 'Hoje' },
  { value: 7, label: '7 dias' },
  { value: 30, label: '30 dias' },
  { value: 90, label: '90 dias' },
];

interface Props {
  period: Period;
  onPeriod: (p: Period) => void;
  updatedAt: Date | null;
  loading: boolean;
  onRefresh: () => void;
  onLogout: () => void;
}

export function Header({ period, onPeriod, updatedAt, loading, onRefresh, onLogout }: Props) {
  return (
    <header className="sticky top-0 z-30 border-b bg-white/85 backdrop-blur supports-[backdrop-filter]:bg-white/70">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-4">
          <Brand subtitle="Painel WhatsApp" />
          {updatedAt && (
            <span className="hidden items-center gap-1.5 text-xs text-muted-foreground md:flex">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand opacity-60" />
                <span className="relative inline-flex size-2 rounded-full bg-brand" />
              </span>
              Ao vivo · atualizado às {updatedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <ToggleGroup
            type="single" variant="outline" size="sm" value={String(period)}
            onValueChange={(v) => v && onPeriod(Number(v) as Period)}
            className="bg-white"
          >
            {PERIODS.map((p) => (
              <ToggleGroupItem
                key={p.value} value={String(p.value)}
                className="px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
              >
                {p.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon-sm" onClick={onRefresh} aria-label="Atualizar agora">
                <RefreshCw className={cn(loading && 'animate-spin')} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Atualizar agora</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" onClick={onLogout} aria-label="Sair"><LogOut /></Button>
            </TooltipTrigger>
            <TooltipContent>Sair</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </header>
  );
}
