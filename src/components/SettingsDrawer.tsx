import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { FocusTrap } from 'focus-trap-react'
import { ArrowRight, Compass, KeyRound, Plus, RotateCcw, Sparkles, Trash2, Wifi, WifiOff, X } from 'lucide-react'
import type { AiProvider, FeedAccentColor, RssFeed } from '../sections/workspace/types'

const PROVIDER_META: Record<AiProvider, { envVar: string; link: string; hint: string }> = {
  gemini: {
    envVar: 'GEMINI_API_KEY',
    link: 'https://aistudio.google.com/apikey',
    hint: 'Modèle par défaut : gemini-2.5-flash. Free tier généreux.',
  },
  anthropic: {
    envVar: 'ANTHROPIC_API_KEY',
    link: 'https://console.anthropic.com/settings/keys',
    hint: 'Compatible Claude 4.x. Excellent pour la rédaction longue.',
  },
  openai: {
    envVar: 'OPENAI_API_KEY',
    link: 'https://platform.openai.com/api-keys',
    hint: 'GPT-4 / GPT-4o. Demande une carte bancaire à la création.',
  },
  custom: {
    envVar: 'CUSTOM_API_KEY',
    link: '',
    hint: 'Endpoint compatible OpenAI à configurer côté serveur.',
  },
}

const ACCENT_OPTIONS: Array<{ value: FeedAccentColor; className: string; label: string }> = [
  { value: 'sky', className: 'bg-sky-600', label: 'Bleu ciel' },
  { value: 'rose', className: 'bg-rose-600', label: 'Rose' },
  { value: 'amber', className: 'bg-amber-500', label: 'Ambre' },
  { value: 'emerald', className: 'bg-emerald-600', label: 'Émeraude' },
  { value: 'violet', className: 'bg-violet-600', label: 'Violet' },
  { value: 'cyan', className: 'bg-cyan-600', label: 'Cyan' },
  { value: 'orange', className: 'bg-orange-500', label: 'Orange' },
  { value: 'pink', className: 'bg-pink-500', label: 'Magenta' },
]

const ACCENT_DOT_CLASSES: Record<string, string> = Object.fromEntries(
  ACCENT_OPTIONS.map((opt) => [opt.value, opt.className]),
)

const PROVIDER_LABELS: Record<AiProvider, string> = {
  gemini: 'Google Gemini',
  anthropic: 'Anthropic',
  openai: 'OpenAI',
  custom: 'Custom',
}

export type HealthStatus = 'unknown' | 'checking' | 'ok' | 'missing-key' | 'error'

export interface SettingsDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  feeds: RssFeed[]
  provider: AiProvider
  healthStatus: HealthStatus
  healthModel?: string
  onCheckHealth?: () => void
  onProviderChange?: (provider: AiProvider) => void
  onAddFeed: (input: { title: string; url: string; accentColor: FeedAccentColor }) => void
  onRemoveFeed: (feedId: string) => void
  onUpdateFeed: (feedId: string, patch: Partial<RssFeed>) => void
  onResetData: () => void
  onReplayTour?: () => void
  onReopenWizard?: () => void
}

const kicker =
  'font-mono text-[10px] uppercase tracking-[0.24em] text-vermillion'

const inputBase =
  'w-full bg-paper dark:bg-night border-2 border-ink dark:border-night-text px-2.5 py-2 text-sm text-ink dark:text-night-text focus:outline-none focus:ring-2 focus:ring-vermillion focus:ring-offset-2 focus:ring-offset-paper dark:focus:ring-offset-night-paper'

export function SettingsDrawer({
  open,
  onOpenChange,
  feeds,
  provider,
  healthStatus,
  healthModel,
  onCheckHealth,
  onProviderChange,
  onAddFeed,
  onRemoveFeed,
  onUpdateFeed,
  onResetData,
  onReplayTour,
  onReopenWizard,
}: SettingsDrawerProps) {
  const [newTitle, setNewTitle] = useState('')
  const [newUrl, setNewUrl] = useState('')
  const [newAccent, setNewAccent] = useState<FeedAccentColor>('sky')
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [urlError, setUrlError] = useState<string | null>(null)

  // Close on Escape
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onOpenChange(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onOpenChange])

  // Scroll-lock body while open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  // Reset form on close
  useEffect(() => {
    if (!open) {
      setNewTitle('')
      setNewUrl('')
      setNewAccent('sky')
      setShowResetConfirm(false)
      setUrlError(null)
    }
  }, [open])

  function handleAddFeed(event: React.FormEvent) {
    event.preventDefault()
    const title = newTitle.trim()
    const url = newUrl.trim()
    setUrlError(null)
    if (!title || !url) return
    try {
      new URL(url)
    } catch {
      setUrlError('URL invalide. Vérifie le protocole (http:// ou https://) et la syntaxe.')
      return
    }
    onAddFeed({ title, url, accentColor: newAccent })
    setNewTitle('')
    setNewUrl('')
  }

  if (!open) return null

  return createPortal(
    <FocusTrap
      focusTrapOptions={{
        escapeDeactivates: true,
        clickOutsideDeactivates: true,
        onDeactivate: () => onOpenChange(false),
        returnFocusOnDeactivate: true,
        initialFocus: false,
      }}
    >
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-drawer-title"
      style={{ position: 'fixed', inset: 0, height: '100dvh', zIndex: 50, display: 'flex', justifyContent: 'flex-end' }}
    >
      {/* Overlay */}
      <div
        onClick={() => onOpenChange(false)}
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(14,14,12,0.7)',
          backdropFilter: 'blur(2px)',
          zIndex: 0,
        }}
      />

      {/* Drawer panel */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100dvh',
          width: 'min(100%, 560px)',
        }}
        className="paper-grain bg-paper dark:bg-night-paper border-l-2 border-ink dark:border-night-text focus:outline-none"
        tabIndex={-1}
      >
        <header className="border-b-2 border-ink dark:border-night-text bg-bone dark:bg-night px-5 pt-5 pb-4 shrink-0">
          <div className="flex items-baseline justify-between gap-4">
            <p className={kicker}>Panneau de contrôle</p>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="cursor-pointer inline-flex h-8 w-8 items-center justify-center border-2 border-ink dark:border-night-text text-ink dark:text-night-text hover:bg-vermillion hover:border-vermillion hover:text-paper transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-vermillion"
              aria-label="Fermer le panneau"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" strokeWidth={2.5} />
            </button>
          </div>
          <h2 id="settings-drawer-title" className="mt-2 font-display font-black tracking-[-0.03em] leading-none text-ink dark:text-night-text text-3xl md:text-4xl">
            Réglages
          </h2>
          <p className="mt-2 font-display italic text-sm text-ink-3 dark:text-night-text-3">
            Choisis ton IA, gère tes sources d'articles et l'état de l'application.
          </p>
          <div aria-hidden="true" className="mt-3 h-1 bg-vermillion" />
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-6 space-y-9">
          <section>
            <h3 className={kicker}>Moteur d'IA</h3>
            <p className="mt-1 text-xs text-ink-3 dark:text-night-text-3">
              L'IA qui rédige tes newsletters à partir des articles sélectionnés.
            </p>
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              {(Object.keys(PROVIDER_LABELS) as AiProvider[]).map((id) => {
                const selected = provider === id
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => onProviderChange?.(id)}
                    className={[
                      'inline-flex items-center justify-center gap-1.5 border-2 px-2 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] transition-colors relative cursor-pointer',
                      selected
                        ? 'bg-vermillion text-paper border-ink dark:border-night-text'
                        : 'bg-paper dark:bg-night text-ink dark:text-night-text border-ink dark:border-night-text hover:bg-bone-2 dark:hover:bg-night-2',
                    ].join(' ')}
                    aria-pressed={selected}
                  >
                    <Sparkles className="h-3 w-3" aria-hidden="true" strokeWidth={2.5} />
                    {PROVIDER_LABELS[id]}
                  </button>
                )
              })}
            </div>
            <p className="mt-1.5 text-[11px] text-ink-3 dark:text-night-text-3 italic">
              Le backend bascule automatiquement sur le provider sélectionné si la clé correspondante est configurée côté serveur.
            </p>

            <div className="mt-3 border-2 border-ink dark:border-night-text bg-paper dark:bg-night p-3 flex items-center gap-3">
              {healthStatus === 'ok' ? (
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center bg-moss text-paper border-2 border-ink dark:border-night-text">
                  <Wifi className="h-3.5 w-3.5" aria-hidden="true" strokeWidth={2.5} />
                </span>
              ) : (
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center bg-vermillion text-paper border-2 border-ink dark:border-night-text">
                  <WifiOff className="h-3.5 w-3.5" aria-hidden="true" strokeWidth={2.5} />
                </span>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-display font-bold text-ink dark:text-night-text leading-tight">
                  {healthStatus === 'ok'
                    ? 'IA connectée'
                    : healthStatus === 'checking'
                      ? 'Vérification…'
                      : healthStatus === 'missing-key'
                        ? 'Clé API manquante'
                        : healthStatus === 'error'
                          ? 'Connexion impossible'
                          : 'Statut inconnu'}
                </p>
                {healthModel && (
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-3 dark:text-night-text-3 truncate">
                    Modèle · {healthModel}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={onCheckHealth}
                className="cursor-pointer border-2 border-ink dark:border-night-text px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-ink dark:text-night-text hover:bg-ink hover:text-paper dark:hover:bg-night-text dark:hover:text-night transition-colors"
              >
                Tester
              </button>
            </div>
            {healthStatus === 'missing-key' && (
              <p className="mt-2 text-xs text-vermillion">
                Aucune clé API détectée côté serveur pour <code className="font-mono bg-bone-2 dark:bg-night-2 px-1">{PROVIDER_META[provider].envVar}</code>. Configure-la (voir ci-dessous) puis clique <strong>Tester</strong>.
              </p>
            )}

            <div className="mt-3 border-2 border-ink dark:border-night-text bg-bone dark:bg-night p-3">
              <h4 className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-vermillion">
                <KeyRound className="h-3 w-3" aria-hidden="true" strokeWidth={2.5} />
                Où est la clé API ?
              </h4>
              <p className="mt-1.5 text-xs text-ink-2 dark:text-night-text-2 leading-snug">
                Pour ta sécurité, la clé n'est <strong>jamais saisie dans le navigateur</strong>. Elle est lue côté serveur via la variable d'environnement{' '}
                <code className="font-mono bg-paper dark:bg-night-paper px-1 border border-ink/60 dark:border-night-text/60">
                  {PROVIDER_META[provider].envVar}
                </code>
                . Configure-la dans ton fichier{' '}
                <code className="font-mono bg-paper dark:bg-night-paper px-1 border border-ink/60 dark:border-night-text/60">.env</code>
                {' '}local ou via{' '}
                <code className="font-mono bg-paper dark:bg-night-paper px-1 border border-ink/60 dark:border-night-text/60">vercel env add</code>
                {' '}en production, puis recharge la page.
              </p>
              <p className="mt-1.5 text-xs text-ink-3 dark:text-night-text-3 italic leading-snug">
                {PROVIDER_META[provider].hint}
              </p>
              {PROVIDER_META[provider].link && (
                <a
                  href={PROVIDER_META[provider].link}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.18em] text-vermillion underline underline-offset-4 hover:text-vermillion-2"
                >
                  Obtenir une clé {PROVIDER_LABELS[provider]}
                  <ArrowRight className="h-3 w-3" aria-hidden="true" strokeWidth={2.5} />
                </a>
              )}
            </div>
          </section>

          <section>
            <div className="flex items-baseline justify-between">
              <h3 className={kicker}>Sources d'articles</h3>
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-4 dark:text-night-text-3">
                {String(feeds.length).padStart(2, '0')} flux
              </span>
            </div>
            <p className="mt-1 text-xs text-ink-3 dark:text-night-text-3">
              Les flux RSS d'où Gazette tire les articles. Décoche pour mettre une source en pause sans la supprimer.
            </p>

            <ul className="mt-2 space-y-2">
              {feeds.map((feed) => (
                <li
                  key={feed.id}
                  className="flex items-center gap-2 border-2 border-ink dark:border-night-text bg-paper dark:bg-night p-3"
                >
                  <span
                    className={`h-3 w-3 shrink-0 border border-ink dark:border-night-text ${ACCENT_DOT_CLASSES[feed.accentColor] ?? 'bg-ink'}`}
                    aria-hidden="true"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-bold text-ink dark:text-night-text leading-tight truncate">
                      {feed.title}
                    </p>
                    <p className="font-mono text-[10px] text-ink-4 dark:text-night-text-3 truncate">
                      {feed.url}
                    </p>
                  </div>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer font-mono text-[10px] uppercase tracking-[0.16em] text-ink-3 dark:text-night-text-3">
                    <input
                      type="checkbox"
                      checked={feed.isActive}
                      onChange={(event) =>
                        onUpdateFeed(feed.id, { isActive: event.target.checked })
                      }
                      className="cursor-pointer accent-vermillion"
                    />
                    Actif
                  </label>
                  <button
                    type="button"
                    onClick={() => onRemoveFeed(feed.id)}
                    className="cursor-pointer inline-flex h-7 w-7 items-center justify-center text-ink-4 hover:bg-vermillion hover:text-paper dark:text-night-text-3 transition-colors"
                    aria-label={`Supprimer ${feed.title}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" strokeWidth={2.25} />
                  </button>
                </li>
              ))}
              {feeds.length === 0 && (
                <li className="text-xs text-ink-3 dark:text-night-text-3 italic">
                  Aucune source. Ajoute-en une ci-dessous.
                </li>
              )}
            </ul>

            <form
              onSubmit={handleAddFeed}
              className="mt-3 border-2 border-dashed border-ink dark:border-night-text p-3 space-y-2 bg-bone dark:bg-night"
              aria-labelledby="add-feed-label"
            >
              <p id="add-feed-label" className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-3 dark:text-night-text-3 mb-1">
                Ajouter une source
              </p>
              <label className="block">
                <span className="sr-only">Nom de la source</span>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(event) => setNewTitle(event.target.value)}
                  placeholder="Nom de la source"
                  className={inputBase}
                  required
                />
              </label>
              <label className="block">
                <span className="sr-only">URL du flux RSS</span>
                <input
                  type="url"
                  value={newUrl}
                  onChange={(event) => {
                    setNewUrl(event.target.value)
                    if (urlError) setUrlError(null)
                  }}
                  placeholder="https://example.com/feed.xml"
                  className={`${inputBase} font-mono text-xs ${urlError ? 'border-vermillion focus:ring-vermillion' : ''}`}
                  required
                  aria-invalid={urlError ? true : undefined}
                  aria-describedby={urlError ? 'add-feed-url-error' : undefined}
                />
              </label>
              {urlError && (
                <p
                  id="add-feed-url-error"
                  role="alert"
                  className="text-xs text-vermillion font-mono leading-snug"
                >
                  {urlError}
                </p>
              )}
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-3 dark:text-night-text-3">
                  Couleur
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {ACCENT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setNewAccent(opt.value)}
                      className={[
                        'cursor-pointer h-6 w-6 transition-transform border-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-vermillion',
                        opt.className,
                        newAccent === opt.value
                          ? 'border-vermillion scale-110'
                          : 'border-ink dark:border-night-text opacity-80 hover:opacity-100',
                      ].join(' ')}
                      aria-label={`Couleur ${opt.label}`}
                      aria-pressed={newAccent === opt.value}
                      title={opt.label}
                    />
                  ))}
                </div>
              </div>
              <button
                type="submit"
                className="cursor-pointer w-full inline-flex items-center justify-center gap-2 bg-ink text-paper dark:bg-night-text dark:text-night font-mono text-[11px] uppercase tracking-[0.2em] py-2.5 border-2 border-ink dark:border-night-text hover:bg-vermillion hover:border-vermillion hover:text-paper dark:hover:bg-vermillion dark:hover:text-paper transition-colors"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" strokeWidth={2.5} />
                Ajouter
              </button>
            </form>
          </section>

          <section>
            <h3 className={kicker}>Prise en main</h3>
            <p className="mt-1 text-xs text-ink-3 dark:text-night-text-3">
              Revoir la présentation de l'app ou refaire la configuration de départ.
            </p>
            <div className="mt-2 grid gap-2">
              <button
                type="button"
                onClick={onReplayTour}
                className="cursor-pointer w-full inline-flex items-center justify-center gap-2 border-2 border-ink dark:border-night-text px-3 py-2.5 font-mono text-[11px] uppercase tracking-[0.2em] text-ink dark:text-night-text hover:bg-ink hover:text-paper dark:hover:bg-night-text dark:hover:text-night transition-colors"
              >
                <Compass className="h-3.5 w-3.5" aria-hidden="true" strokeWidth={2.25} />
                Revoir la visite guidée
              </button>
              <button
                type="button"
                onClick={onReopenWizard}
                className="cursor-pointer w-full inline-flex items-center justify-center gap-2 border-2 border-ink dark:border-night-text px-3 py-2.5 font-mono text-[11px] uppercase tracking-[0.2em] text-ink dark:text-night-text hover:bg-ink hover:text-paper dark:hover:bg-night-text dark:hover:text-night transition-colors"
              >
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" strokeWidth={2.25} />
                Refaire la configuration initiale
              </button>
            </div>
          </section>

          <section>
            <h3 className={kicker}>Zone sensible</h3>
            <p className="mt-1 text-xs text-ink-3 dark:text-night-text-3">
              Toutes tes données restent stockées localement dans ce navigateur. Tu peux tout effacer pour repartir de zéro.
            </p>
            {showResetConfirm ? (
              <div className="mt-2 border-2 border-vermillion bg-vermillion/10 dark:bg-vermillion/15 p-3 space-y-2">
                <p className="text-sm text-ink dark:text-night-text">
                  Sources, filtres, brouillon de newsletter et progression seront <span className="font-bold">définitivement supprimés</span>. Action irréversible.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onResetData()
                      setShowResetConfirm(false)
                    }}
                    className="cursor-pointer flex-1 bg-vermillion text-paper font-mono text-[10px] uppercase tracking-[0.18em] py-2 border-2 border-ink dark:border-night-text hover:bg-vermillion-2"
                  >
                    Oui, tout effacer
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowResetConfirm(false)}
                    className="cursor-pointer border-2 border-ink dark:border-night-text px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-ink dark:text-night-text hover:bg-ink hover:text-paper dark:hover:bg-night-text dark:hover:text-night transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowResetConfirm(true)}
                className="mt-2 cursor-pointer w-full inline-flex items-center justify-center gap-2 border-2 border-vermillion px-3 py-2.5 font-mono text-[11px] uppercase tracking-[0.2em] text-vermillion hover:bg-vermillion hover:text-paper transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" strokeWidth={2.25} />
                Effacer toutes mes données
              </button>
            )}
          </section>
        </div>

        <footer className="border-t-2 border-ink dark:border-night-text bg-bone dark:bg-night px-5 py-3 font-mono text-[9px] uppercase tracking-[0.24em] text-ink-3 dark:text-night-text-3 flex items-center justify-between gap-3 shrink-0">
          <span className="truncate">© 2026 tous droits réservés — Joseph Deffayet | Designer</span>
          <span className="shrink-0">v1.0</span>
        </footer>
      </div>
    </div>
    </FocusTrap>,
    document.body,
  )
}
