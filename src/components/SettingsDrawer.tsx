import { useEffect, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Compass, Plus, RotateCcw, Sparkles, Trash2, Wifi, WifiOff, X } from 'lucide-react'
import type { AiProvider, FeedAccentColor, RssFeed } from '../sections/workspace/types'

const ACCENT_OPTIONS: Array<{ value: FeedAccentColor; className: string }> = [
  { value: 'sky', className: 'bg-sky-600' },
  { value: 'rose', className: 'bg-rose-600' },
  { value: 'amber', className: 'bg-amber-500' },
  { value: 'emerald', className: 'bg-emerald-600' },
  { value: 'violet', className: 'bg-violet-600' },
  { value: 'cyan', className: 'bg-cyan-600' },
  { value: 'orange', className: 'bg-orange-500' },
  { value: 'pink', className: 'bg-pink-500' },
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

  useEffect(() => {
    if (!open) {
      setNewTitle('')
      setNewUrl('')
      setNewAccent('sky')
      setShowResetConfirm(false)
    }
  }, [open])

  function handleAddFeed(event: React.FormEvent) {
    event.preventDefault()
    const title = newTitle.trim()
    const url = newUrl.trim()
    if (!title || !url) return
    try {
      new URL(url)
    } catch {
      window.alert('URL invalide')
      return
    }
    onAddFeed({ title, url, accentColor: newAccent })
    setNewTitle('')
    setNewUrl('')
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-ink/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
        <Dialog.Content className="paper-grain fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l-2 border-ink dark:border-night-text bg-paper dark:bg-night-paper focus:outline-none data-[state=open]:animate-in data-[state=open]:slide-in-from-right data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right">
          <header className="border-b-2 border-ink dark:border-night-text bg-bone dark:bg-night px-5 pt-5 pb-4 shrink-0">
            <div className="flex items-baseline justify-between gap-4">
              <p className={kicker}>Réglages</p>
              <Dialog.Close
                className="cursor-pointer inline-flex h-8 w-8 items-center justify-center border-2 border-ink dark:border-night-text text-ink dark:text-night-text hover:bg-vermillion hover:border-vermillion hover:text-paper transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-vermillion"
                aria-label="Fermer"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" strokeWidth={2.5} />
              </Dialog.Close>
            </div>
            <Dialog.Title className="mt-2 font-display font-black tracking-[-0.03em] leading-none text-ink dark:text-night-text text-3xl md:text-4xl">
              Configuration
            </Dialog.Title>
            <Dialog.Description className="mt-2 font-display italic text-sm text-ink-3 dark:text-night-text-3">
              Provider IA, sources, et données locales.
            </Dialog.Description>
            <div aria-hidden="true" className="mt-3 h-1 bg-vermillion" />
          </header>

          <div className="flex-1 overflow-y-auto px-5 py-6 space-y-9">
            <section>
              <h3 className={kicker}>Provider IA</h3>
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                {(Object.keys(PROVIDER_LABELS) as AiProvider[]).map((id) => {
                  const selected = provider === id
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => onProviderChange?.(id)}
                      className={[
                        'cursor-pointer inline-flex items-center justify-center gap-1.5 border-2 px-2 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] transition-colors',
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
                      ? 'Provider connecté'
                      : healthStatus === 'checking'
                        ? 'Vérification…'
                        : healthStatus === 'missing-key'
                          ? 'Clé API manquante'
                          : healthStatus === 'error'
                            ? 'Erreur de vérification'
                            : 'Non vérifié'}
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
                  Définis la variable d'environnement de ton provider (ex.{' '}
                  <code className="font-mono bg-bone-2 dark:bg-night-2 px-1">GEMINI_API_KEY</code>) côté serveur.
                </p>
              )}
            </section>

            <section>
              <div className="flex items-baseline justify-between">
                <h3 className={kicker}>Sources RSS</h3>
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-4 dark:text-night-text-3">
                  {String(feeds.length).padStart(2, '0')} configurée{feeds.length > 1 ? 's' : ''}
                </span>
              </div>

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
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-3 dark:text-night-text-3 mb-1">
                  Ajouter une source
                </p>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(event) => setNewTitle(event.target.value)}
                  placeholder="Nom de la source"
                  className={inputBase}
                  required
                />
                <input
                  type="url"
                  value={newUrl}
                  onChange={(event) => setNewUrl(event.target.value)}
                  placeholder="https://example.com/feed.xml"
                  className={`${inputBase} font-mono text-xs`}
                  required
                />
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
                          'cursor-pointer h-5 w-5 transition-transform border-2',
                          opt.className,
                          newAccent === opt.value
                            ? 'border-vermillion scale-110'
                            : 'border-ink dark:border-night-text opacity-70 hover:opacity-100',
                        ].join(' ')}
                        aria-label={opt.value}
                        aria-pressed={newAccent === opt.value}
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
              <h3 className={kicker}>Aide & assistance</h3>
              <div className="mt-2 grid gap-2">
                <button
                  type="button"
                  onClick={onReplayTour}
                  className="cursor-pointer w-full inline-flex items-center justify-center gap-2 border-2 border-ink dark:border-night-text px-3 py-2.5 font-mono text-[11px] uppercase tracking-[0.2em] text-ink dark:text-night-text hover:bg-ink hover:text-paper dark:hover:bg-night-text dark:hover:text-night transition-colors"
                >
                  <Compass className="h-3.5 w-3.5" aria-hidden="true" strokeWidth={2.25} />
                  Relancer la visite guidée
                </button>
                <button
                  type="button"
                  onClick={onReopenWizard}
                  className="cursor-pointer w-full inline-flex items-center justify-center gap-2 border-2 border-ink dark:border-night-text px-3 py-2.5 font-mono text-[11px] uppercase tracking-[0.2em] text-ink dark:text-night-text hover:bg-ink hover:text-paper dark:hover:bg-night-text dark:hover:text-night transition-colors"
                >
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" strokeWidth={2.25} />
                  Rouvrir l'assistant d'installation
                </button>
              </div>
            </section>

            <section>
              <h3 className={kicker}>Données locales</h3>
              {showResetConfirm ? (
                <div className="mt-2 border-2 border-vermillion bg-vermillion/10 dark:bg-vermillion/15 p-3 space-y-2">
                  <p className="text-sm text-ink dark:text-night-text">
                    Cette action <span className="font-bold">efface</span> sources, filtres, brouillon et progression. Irréversible.
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
                      Confirmer
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
                  className="mt-2 cursor-pointer w-full inline-flex items-center justify-center gap-2 border-2 border-ink dark:border-night-text px-3 py-2.5 font-mono text-[11px] uppercase tracking-[0.2em] text-ink dark:text-night-text hover:bg-ink hover:text-paper dark:hover:bg-night-text dark:hover:text-night transition-colors"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" strokeWidth={2.25} />
                  Réinitialiser
                </button>
              )}
            </section>
          </div>

          <footer className="border-t-2 border-ink dark:border-night-text bg-bone dark:bg-night px-5 py-3 font-mono text-[9px] uppercase tracking-[0.24em] text-ink-3 dark:text-night-text-3 flex items-center justify-between shrink-0">
            <span>Gazette · Réglages</span>
            <span>v1.0</span>
          </footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
