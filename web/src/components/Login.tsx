import { useState } from 'react';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { brand } from '@/brand';
import { Monogram } from './Brand';

export function Login({ error, onSubmit }: { error?: string; onSubmit: (password: string) => void }) {
  const [password, setPassword] = useState('');
  return (
    <div className="grid min-h-svh place-items-center bg-[radial-gradient(ellipse_at_top,var(--brand-soft),transparent_60%)] px-4">
      <Card className="w-full max-w-sm shadow-xl shadow-black/5">
        <CardContent className="flex flex-col gap-6 pt-2">
          <div className="flex flex-col items-center gap-3">
            <Monogram className="size-16" />
            <span className="text-2xl font-bold tracking-tight">{brand.name}</span>
          </div>
          <div className="text-center">
            <h1 className="text-lg font-semibold">Painel WhatsApp</h1>
            <p className="text-sm text-muted-foreground">Acesso interno da equipe</p>
          </div>
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => { e.preventDefault(); if (password) onSubmit(password); }}
          >
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="password" autoFocus autoComplete="current-password" placeholder="Senha do painel"
                className="h-10 pl-9" value={password} onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" size="lg">Entrar</Button>
            {error && <p className="text-center text-sm text-destructive">{error}</p>}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
