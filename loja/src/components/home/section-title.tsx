import type { ReactNode } from 'react'
import { Reveal } from '../ui/reveal'

export function SectionTitle({
  eyebrow,
  title,
  text,
  dark,
  center,
  action,
}: {
  eyebrow: string
  title: ReactNode
  text?: string
  dark?: boolean
  center?: boolean
  action?: ReactNode
}) {
  return (
    <Reveal>
      <div className={`flex flex-wrap gap-4 ${center ? 'flex-col items-center text-center' : 'items-end justify-between'}`}>
        <div className="max-w-2xl">
          <p className={`text-xs font-bold uppercase tracking-[0.2em] ${dark ? 'text-cyan' : 'text-royal'}`}>{eyebrow}</p>
          <h2 className={`mt-2 font-display text-3xl font-bold leading-tight tracking-tight md:text-5xl ${dark ? 'text-white' : ''}`}>
            {title}
          </h2>
          {text && <p className={`mt-3 text-base md:text-lg ${dark ? 'text-white/65' : 'text-muted'}`}>{text}</p>}
        </div>
        {action}
      </div>
    </Reveal>
  )
}
