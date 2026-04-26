import { useEffect, useState } from 'react'

export interface SplashscreenProps {
  onDone: () => void
  /** Total visible duration in ms before fade-out resolves. */
  duration?: number
}

export function Splashscreen({ onDone, duration = 1700 }: SplashscreenProps) {
  const [phase, setPhase] = useState<'in' | 'visible' | 'out'>('in')

  useEffect(() => {
    // Respect prefers-reduced-motion: skip the splash animation entirely.
    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion) {
      onDone()
      return
    }
    const t1 = window.setTimeout(() => setPhase('visible'), 30)
    const t2 = window.setTimeout(() => setPhase('out'), Math.max(600, duration - 350))
    const t3 = window.setTimeout(() => onDone(), duration)
    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
      window.clearTimeout(t3)
    }
  }, [duration, onDone])

  return (
    <div
      role="status"
      aria-live="polite"
      className={[
        'paper-grain fixed inset-0 z-[60] flex flex-col items-center justify-center bg-bone dark:bg-night transition-opacity duration-300 ease-out',
        phase === 'out' ? 'opacity-0 pointer-events-none' : 'opacity-100',
      ].join(' ')}
    >
      <div
        className={[
          'flex flex-col items-center text-center px-6 transition-all duration-500 ease-out',
          phase === 'in' ? 'opacity-0 translate-y-3' : 'opacity-100 translate-y-0',
        ].join(' ')}
      >
        <div className="flex items-center gap-3 mb-5">
          <img
            src="/logo.png"
            alt=""
            aria-hidden="true"
            className="h-12 w-12 sm:h-14 sm:w-14 object-contain"
          />
          <h1 className="font-display font-black tracking-[-0.04em] text-[44px] sm:text-[56px] leading-none text-ink dark:text-night-text">
            Gazette
          </h1>
        </div>

        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-vermillion mb-2">
          Édition № 001
        </p>
        <p className="font-display italic text-base sm:text-lg text-ink-3 dark:text-night-text-3 max-w-sm">
          Bienvenue. On prépare la salle de rédaction…
        </p>

        <div
          aria-hidden="true"
          className="mt-7 h-0.5 w-32 overflow-hidden bg-rule dark:bg-night-rule"
        >
          <div className="h-full w-1/3 bg-vermillion animate-[splashbar_1.2s_ease-in-out_infinite]" />
        </div>

        <button
          type="button"
          onClick={onDone}
          className="cursor-pointer mt-6 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-3 dark:text-night-text-3 hover:text-vermillion underline underline-offset-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-vermillion px-2 py-1"
        >
          Passer
        </button>
      </div>

      <style>{`@keyframes splashbar { 0% { transform: translateX(-100%); } 100% { transform: translateX(400%); } }`}</style>
    </div>
  )
}
