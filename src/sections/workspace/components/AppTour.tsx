import { useEffect, useLayoutEffect, useState } from 'react'
import { FocusTrap } from 'focus-trap-react'
import { ArrowRight, X } from 'lucide-react'

export interface TourStep {
  /** Selector that resolves to the highlighted element via `[data-tour="<key>"]`. */
  target: string
  title: string
  body: string
  /** Optional placement hint — auto-flips on small screens. */
  placement?: 'bottom' | 'top' | 'right' | 'left'
}

// eslint-disable-next-line react-refresh/only-export-components
export const DEFAULT_TOUR_STEPS: TourStep[] = [
  {
    target: 'main-nav',
    placement: 'bottom',
    title: 'Bienvenue dans Gazette',
    body: "L'en-tête te suit partout : logo, réglages et thème clair/sombre. Le numéro d'édition se met à jour chaque jour.",
  },
  {
    target: 'rss-panel',
    placement: 'right',
    title: 'Le panneau des sources',
    body: 'Ajoute tes flux RSS, filtre par date, mot-clé, ou tirage. La liste des dépêches reçues apparaît juste en dessous.',
  },
  {
    target: 'filter-controls',
    placement: 'right',
    title: 'Les filtres et les sources actives',
    body: "Clique un tag pour activer/désactiver une source dans la recherche. Clique la croix pour la supprimer définitivement.",
  },
  {
    target: 'newsletter-panel',
    placement: 'left',
    title: "L'édition générée",
    body: "Ton IA compose ici une newsletter structurée à partir des dépêches sélectionnées. Tu peux éditer chaque section, copier en markdown ou HTML.",
  },
  {
    target: 'settings-button',
    placement: 'bottom',
    title: 'Réglages',
    body: 'Ouvre les réglages pour gérer tes flux, ton provider IA, et relancer cette visite à tout moment.',
  },
]

interface Rect {
  top: number
  left: number
  width: number
  height: number
}

function isMobile(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(max-width: 767px)').matches
}

export interface AppTourProps {
  steps?: TourStep[]
  onClose: () => void
  onComplete: () => void
}

export function AppTour({ steps = DEFAULT_TOUR_STEPS, onClose, onComplete }: AppTourProps) {
  const [stepIndex, setStepIndex] = useState(0)
  const [rect, setRect] = useState<Rect | null>(null)
  const [mobile, setMobile] = useState(isMobile())
  const step = steps[stepIndex]

  useLayoutEffect(() => {
    function compute() {
      if (!step) return
      const el = document.querySelector(`[data-tour="${step.target}"]`) as HTMLElement | null
      if (!el) {
        setRect(null)
        return
      }
      const r = el.getBoundingClientRect()
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
      // Best-effort scroll into view if off-screen.
      if (r.top < 0 || r.bottom > window.innerHeight) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
    compute()
    setMobile(isMobile())
    const onResize = () => {
      compute()
      setMobile(isMobile())
    }
    window.addEventListener('resize', onResize)
    window.addEventListener('scroll', compute, true)
    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('scroll', compute, true)
    }
  }, [step])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight' || e.key === 'Enter') handleNext()
      if (e.key === 'ArrowLeft') handlePrev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex])

  function handleNext() {
    if (stepIndex >= steps.length - 1) {
      onComplete()
    } else {
      setStepIndex((i) => i + 1)
    }
  }

  function handlePrev() {
    setStepIndex((i) => Math.max(0, i - 1))
  }

  if (!step) return null

  const padding = 6
  const spotlight = rect
    ? {
        top: Math.max(0, rect.top - padding),
        left: Math.max(0, rect.left - padding),
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
      }
    : null

  // Place card relative to spotlight; on mobile, stick to bottom.
  const card = (() => {
    if (mobile || !spotlight) {
      return {
        position: 'fixed' as const,
        left: 12,
        right: 12,
        bottom: 16,
        maxWidth: 'calc(100vw - 24px)',
      }
    }
    const cardWidth = 360
    const margin = 12
    const placement = step.placement ?? 'bottom'
    const vw = window.innerWidth
    const vh = window.innerHeight

    let top = 0
    let left = 0
    if (placement === 'bottom') {
      top = spotlight.top + spotlight.height + margin
      left = Math.min(Math.max(margin, spotlight.left), vw - cardWidth - margin)
    } else if (placement === 'top') {
      top = spotlight.top - margin - 220
      left = Math.min(Math.max(margin, spotlight.left), vw - cardWidth - margin)
    } else if (placement === 'right') {
      top = Math.min(Math.max(margin, spotlight.top), vh - 240)
      left = Math.min(spotlight.left + spotlight.width + margin, vw - cardWidth - margin)
    } else {
      top = Math.min(Math.max(margin, spotlight.top), vh - 240)
      left = Math.max(margin, spotlight.left - cardWidth - margin)
    }
    if (top + 260 > vh) top = Math.max(margin, vh - 260)
    if (top < margin) top = margin
    return { position: 'fixed' as const, top, left, width: cardWidth, maxWidth: 'calc(100vw - 24px)' }
  })()

  // 4 dimming rectangles around spotlight, leaving spotlight area clear of blur/dim.
  const vw = typeof window !== 'undefined' ? window.innerWidth : 0
  const dimClass =
    'absolute bg-ink/75 dark:bg-black/80 backdrop-blur-sm transition-all duration-150'

  return (
    <FocusTrap
      focusTrapOptions={{
        escapeDeactivates: true,
        clickOutsideDeactivates: false,
        onDeactivate: onClose,
        returnFocusOnDeactivate: true,
      }}
    >
    <div className="fixed inset-0 z-[55] pointer-events-auto" role="dialog" aria-modal="true" aria-label="Visite guidée">
      {spotlight ? (
        <>
          <div
            className={dimClass}
            onClick={onClose}
            style={{ top: 0, left: 0, right: 0, height: spotlight.top }}
          />
          <div
            className={dimClass}
            onClick={onClose}
            style={{ top: spotlight.top + spotlight.height, left: 0, right: 0, bottom: 0 }}
          />
          <div
            className={dimClass}
            onClick={onClose}
            style={{ top: spotlight.top, left: 0, width: spotlight.left, height: spotlight.height }}
          />
          <div
            className={dimClass}
            onClick={onClose}
            style={{
              top: spotlight.top,
              left: spotlight.left + spotlight.width,
              width: Math.max(0, vw - (spotlight.left + spotlight.width)),
              height: spotlight.height,
            }}
          />
          <div
            aria-hidden="true"
            className="absolute pointer-events-none border-2 border-vermillion transition-all duration-200"
            style={{
              top: spotlight.top,
              left: spotlight.left,
              width: spotlight.width,
              height: spotlight.height,
            }}
          />
        </>
      ) : (
        <div className="absolute inset-0 bg-ink/75 dark:bg-black/80 backdrop-blur-sm" onClick={onClose} />
      )}

      <div
        style={card}
        className="z-10 paper-grain bg-paper dark:bg-night-paper border-2 border-ink dark:border-night-text shadow-[6px_6px_0_0_rgba(14,14,12,1)] dark:shadow-[6px_6px_0_0_rgba(232,226,212,0.45)]"
      >
        <header className="flex items-baseline justify-between gap-3 border-b-2 border-ink dark:border-night-text px-4 py-2.5 bg-bone dark:bg-night">
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-vermillion">
            Visite · {String(stepIndex + 1).padStart(2, '0')}/{String(steps.length).padStart(2, '0')}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer inline-flex h-6 w-6 items-center justify-center border border-ink dark:border-night-text text-ink dark:text-night-text hover:bg-vermillion hover:border-vermillion hover:text-paper transition-colors"
            aria-label="Quitter la visite"
          >
            <X className="h-3 w-3" aria-hidden="true" strokeWidth={2.5} />
          </button>
        </header>

        <div className="px-4 py-3">
          <h3 className="font-display font-black tracking-tight text-lg leading-tight text-ink dark:text-night-text">
            {step.title}
          </h3>
          <p className="mt-1.5 text-sm leading-snug text-ink-2 dark:text-night-text-2">
            {step.body}
          </p>
        </div>

        <footer className="flex items-center justify-between gap-2 px-4 py-2.5 border-t-2 border-ink dark:border-night-text bg-bone dark:bg-night">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer font-mono text-[10px] uppercase tracking-[0.18em] text-ink-3 dark:text-night-text-3 hover:text-vermillion transition-colors"
          >
            Passer
          </button>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handlePrev}
              disabled={stepIndex === 0}
              className="cursor-pointer border-2 border-ink dark:border-night-text px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-ink dark:text-night-text hover:bg-ink hover:text-paper dark:hover:bg-night-text dark:hover:text-night transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Retour
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="cursor-pointer inline-flex items-center gap-1 bg-vermillion text-paper border-2 border-ink dark:border-night-text px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] hover:bg-vermillion-2 transition-colors"
            >
              {stepIndex === steps.length - 1 ? 'Terminer' : 'Suivant'}
              <ArrowRight className="h-3 w-3" aria-hidden="true" strokeWidth={2.5} />
            </button>
          </div>
        </footer>
      </div>
    </div>
    </FocusTrap>
  )
}
