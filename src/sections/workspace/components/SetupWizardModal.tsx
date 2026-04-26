import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { ArrowRight, KeyRound, Plus, Rss, Sparkles, Trash2, X } from 'lucide-react'
import type { AiProvider, FeedAccentColor, RssFeed } from '../types'

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

const PROVIDERS: Array<{
  id: AiProvider
  label: string
  envVar: string
  link: string
  hint: string
}> = [
  {
    id: 'gemini',
    label: 'Google Gemini',
    envVar: 'GEMINI_API_KEY',
    link: 'https://aistudio.google.com/apikey',
    hint: 'Modèle par défaut : gemini-2.5-flash. Free tier généreux.',
  },
  {
    id: 'anthropic',
    label: 'Anthropic Claude',
    envVar: 'ANTHROPIC_API_KEY',
    link: 'https://console.anthropic.com/settings/keys',
    hint: 'Compatible Claude 4.x. Excellent pour la rédaction longue.',
  },
  {
    id: 'openai',
    label: 'OpenAI',
    envVar: 'OPENAI_API_KEY',
    link: 'https://platform.openai.com/api-keys',
    hint: 'GPT-4 / GPT-4o. Demande une carte bancaire à la création.',
  },
  {
    id: 'custom',
    label: 'Provider personnalisé',
    envVar: 'CUSTOM_API_KEY',
    link: '#',
    hint: 'Endpoint compatible OpenAI à configurer côté serveur.',
  },
]

interface FeedDraft {
  id: string
  title: string
  url: string
  accentColor: FeedAccentColor
}

function newDraftId() {
  return `draft-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`
}

export interface SetupWizardModalProps {
  open: boolean
  initialProvider: AiProvider
  existingFeeds: RssFeed[]
  onProviderChange: (provider: AiProvider) => void
  onCommitFeeds: (drafts: Array<{ title: string; url: string; accentColor: FeedAccentColor }>) => void
  onClose: () => void
  onComplete: () => void
}

const inputBase =
  'w-full bg-paper dark:bg-night border-2 border-ink dark:border-night-text px-2.5 py-2 text-sm text-ink dark:text-night-text focus:outline-none focus:ring-2 focus:ring-vermillion focus:ring-offset-2 focus:ring-offset-paper dark:focus:ring-offset-night-paper'

export function SetupWizardModal({
  open,
  initialProvider,
  existingFeeds,
  onProviderChange,
  onCommitFeeds,
  onClose,
  onComplete,
}: SetupWizardModalProps) {
  const [phase, setPhase] = useState<'provider' | 'feeds' | 'review'>('provider')
  const [provider, setProvider] = useState<AiProvider>(initialProvider)
  const [drafts, setDrafts] = useState<FeedDraft[]>([])
  const [newTitle, setNewTitle] = useState('')
  const [newUrl, setNewUrl] = useState('')
  const [newAccent, setNewAccent] = useState<FeedAccentColor>('sky')
  const [urlError, setUrlError] = useState<string | null>(null)

  const providerMeta = PROVIDERS.find((p) => p.id === provider)!

  function handleSelectProvider(p: AiProvider) {
    setProvider(p)
    onProviderChange(p)
  }

  function handleAddDraft(e: React.FormEvent) {
    e.preventDefault()
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
    setDrafts((prev) => [...prev, { id: newDraftId(), title, url, accentColor: newAccent }])
    setNewTitle('')
    setNewUrl('')
  }

  function handleRemoveDraft(id: string) {
    setDrafts((prev) => prev.filter((d) => d.id !== id))
  }

  function handleFinish() {
    if (drafts.length > 0) {
      onCommitFeeds(drafts.map((d) => ({ title: d.title, url: d.url, accentColor: d.accentColor })))
    }
    onComplete()
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[58] bg-ink/80 backdrop-blur-sm" />
        <Dialog.Content
          className="paper-grain fixed inset-0 z-[59] m-auto flex h-[100dvh] w-full sm:h-auto sm:max-h-[92dvh] sm:max-w-2xl flex-col border-0 sm:border-2 border-ink dark:border-night-text bg-paper dark:bg-night-paper focus:outline-none sm:shadow-[8px_8px_0_0_rgba(14,14,12,1)] dark:sm:shadow-[8px_8px_0_0_rgba(232,226,212,0.4)]"
          aria-describedby={undefined}
        >
          <header className="border-b-2 border-ink dark:border-night-text bg-bone dark:bg-night px-5 pt-5 pb-4 shrink-0">
            <div className="flex items-baseline justify-between gap-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-vermillion">
                Première installation · {phase === 'provider' ? 'I' : phase === 'feeds' ? 'II' : 'III'}/III
              </p>
              <button
                type="button"
                onClick={onClose}
                className="cursor-pointer inline-flex h-7 w-7 items-center justify-center border-2 border-ink dark:border-night-text text-ink dark:text-night-text hover:bg-vermillion hover:border-vermillion hover:text-paper transition-colors"
                aria-label="Fermer"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" strokeWidth={2.5} />
              </button>
            </div>
            <Dialog.Title className="mt-1.5 font-display font-black tracking-[-0.03em] leading-none text-ink dark:text-night-text text-2xl sm:text-3xl">
              {phase === 'provider' && 'Choisis ton moteur IA'}
              {phase === 'feeds' && 'Renseigne tes premiers flux'}
              {phase === 'review' && 'Récapitulatif'}
            </Dialog.Title>
            <p className="mt-1.5 font-display italic text-sm text-ink-3 dark:text-night-text-3">
              {phase === 'provider' && 'Le provider transforme tes dépêches en édition rédigée.'}
              {phase === 'feeds' && 'Ajoute au moins un flux RSS pour démarrer.'}
              {phase === 'review' && 'Vérifie, puis lance la première recherche.'}
            </p>
            <div aria-hidden="true" className="mt-3 h-1 bg-vermillion" />
          </header>

          <div className="flex-1 overflow-y-auto px-5 py-5">
            {phase === 'provider' && (
              <section className="space-y-3">
                <h3 className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-3 dark:text-night-text-3">
                  <Sparkles className="h-3 w-3 text-vermillion" aria-hidden="true" strokeWidth={2.5} />
                  Providers disponibles
                </h3>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {PROVIDERS.map((p) => {
                    const selected = provider === p.id
                    return (
                      <li key={p.id}>
                        <button
                          type="button"
                          onClick={() => handleSelectProvider(p.id)}
                          className={[
                            'cursor-pointer w-full text-left p-3 border-2 transition-colors',
                            selected
                              ? 'border-vermillion bg-vermillion/5 dark:bg-vermillion/10'
                              : 'border-ink dark:border-night-text bg-paper dark:bg-night hover:bg-bone-2 dark:hover:bg-night-2',
                          ].join(' ')}
                          aria-pressed={selected}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={[
                                'inline-block h-2.5 w-2.5 border border-ink dark:border-night-text',
                                selected ? 'bg-vermillion' : 'bg-paper dark:bg-night',
                              ].join(' ')}
                              aria-hidden="true"
                            />
                            <span className="font-display font-bold text-ink dark:text-night-text">
                              {p.label}
                            </span>
                          </div>
                          <p className="mt-1.5 text-xs text-ink-3 dark:text-night-text-3 leading-snug">
                            {p.hint}
                          </p>
                          <p className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.18em] text-ink-4 dark:text-night-text-3">
                            ENV · {p.envVar}
                          </p>
                        </button>
                      </li>
                    )
                  })}
                </ul>

                <div className="mt-3 border-2 border-ink dark:border-night-text bg-bone dark:bg-night p-3">
                  <h4 className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-vermillion">
                    <KeyRound className="h-3 w-3" aria-hidden="true" strokeWidth={2.5} />
                    Configuration de la clé
                  </h4>
                  <p className="mt-1.5 text-xs text-ink-2 dark:text-night-text-2 leading-snug">
                    Pour des raisons de sécurité, la clé API <strong>{providerMeta.envVar}</strong> est lue côté serveur uniquement.
                    Configure-la dans ton <code className="font-mono bg-paper dark:bg-night-paper px-1 border border-ink/60">.env</code> en local
                    ou via <code className="font-mono bg-paper dark:bg-night-paper px-1 border border-ink/60">vercel env add</code> en production.
                  </p>
                  {providerMeta.link !== '#' && (
                    <a
                      href={providerMeta.link}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.18em] text-vermillion underline underline-offset-4 hover:text-vermillion-2"
                    >
                      Obtenir une clé
                      <ArrowRight className="h-3 w-3" aria-hidden="true" strokeWidth={2.5} />
                    </a>
                  )}
                </div>
              </section>
            )}

            {phase === 'feeds' && (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-3 dark:text-night-text-3">
                    <Rss className="h-3 w-3 text-vermillion" aria-hidden="true" strokeWidth={2.5} />
                    Flux à ajouter
                  </h3>
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-4 dark:text-night-text-3">
                    {String(drafts.length).padStart(2, '0')} en attente
                  </span>
                </div>

                {drafts.length > 0 && (
                  <ul className="space-y-2">
                    {drafts.map((draft) => (
                      <li
                        key={draft.id}
                        className="flex items-center gap-2 border-2 border-ink dark:border-night-text bg-paper dark:bg-night p-2.5"
                      >
                        <span
                          aria-hidden="true"
                          className={`h-3 w-3 shrink-0 border border-ink dark:border-night-text ${
                            ACCENT_OPTIONS.find((o) => o.value === draft.accentColor)?.className ?? 'bg-ink'
                          }`}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-display font-bold text-ink dark:text-night-text leading-tight truncate">
                            {draft.title}
                          </p>
                          <p className="font-mono text-[10px] text-ink-4 dark:text-night-text-3 truncate">
                            {draft.url}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveDraft(draft.id)}
                          className="cursor-pointer inline-flex h-7 w-7 items-center justify-center text-ink-4 hover:bg-vermillion hover:text-paper dark:text-night-text-3 transition-colors"
                          aria-label={`Retirer ${draft.title}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" strokeWidth={2.25} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                <form
                  onSubmit={handleAddDraft}
                  className="border-2 border-dashed border-ink dark:border-night-text bg-bone dark:bg-night p-3 space-y-2"
                >
                  <p id="wizard-add-feed-label" className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-3 dark:text-night-text-3 mb-1">
                    Nouveau flux
                  </p>
                  <label className="block">
                    <span className="sr-only">Nom du flux</span>
                    <input
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="Nom du flux (ex. The Verge)"
                      className={inputBase}
                      required
                    />
                  </label>
                  <label className="block">
                    <span className="sr-only">URL du flux RSS</span>
                    <input
                      type="url"
                      value={newUrl}
                      onChange={(e) => {
                        setNewUrl(e.target.value)
                        if (urlError) setUrlError(null)
                      }}
                      placeholder="https://example.com/feed.xml"
                      className={`${inputBase} font-mono text-xs ${urlError ? 'border-vermillion focus:ring-vermillion' : ''}`}
                      required
                      aria-invalid={urlError ? true : undefined}
                      aria-describedby={urlError ? 'wizard-url-error' : undefined}
                    />
                  </label>
                  {urlError && (
                    <p id="wizard-url-error" role="alert" className="text-xs text-vermillion font-mono leading-snug">
                      {urlError}
                    </p>
                  )}
                  <div className="flex items-center gap-2 pt-1">
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-3 dark:text-night-text-3">
                      Couleur
                    </span>
                    <div role="group" aria-label="Couleur du flux" className="flex flex-wrap gap-1.5">
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
                    className="cursor-pointer w-full inline-flex items-center justify-center gap-2 bg-ink text-paper dark:bg-night-text dark:text-night font-mono text-[11px] uppercase tracking-[0.2em] py-2 border-2 border-ink dark:border-night-text hover:bg-vermillion hover:border-vermillion hover:text-paper transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" aria-hidden="true" strokeWidth={2.5} />
                    Ajouter
                  </button>
                </form>

                {existingFeeds.length > 0 && (
                  <div className="text-xs text-ink-3 dark:text-night-text-3">
                    {String(existingFeeds.length).padStart(2, '0')} flux déjà configuré{existingFeeds.length > 1 ? 's' : ''} dans l'app.
                  </div>
                )}
              </section>
            )}

            {phase === 'review' && (
              <section className="space-y-4">
                <div className="border-2 border-ink dark:border-night-text bg-paper dark:bg-night p-3">
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-vermillion">Provider</p>
                  <p className="mt-1 font-display font-bold text-ink dark:text-night-text">
                    {providerMeta.label}
                  </p>
                </div>
                <div className="border-2 border-ink dark:border-night-text bg-paper dark:bg-night p-3">
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-vermillion">Flux</p>
                  <p className="mt-1 text-sm text-ink-2 dark:text-night-text-2">
                    {drafts.length === 0 && existingFeeds.length === 0
                      ? "Aucun flux ajouté pour l'instant. Tu pourras en ajouter ensuite via les réglages."
                      : `${drafts.length + existingFeeds.length} flux total — ${drafts.length} nouveau${drafts.length > 1 ? 'x' : ''}, ${existingFeeds.length} déjà présent${existingFeeds.length > 1 ? 's' : ''}.`}
                  </p>
                </div>
                <p className="text-xs text-ink-3 dark:text-night-text-3 leading-snug">
                  Une fois validé, Gazette enregistre tes flux et lance la première recherche automatiquement.
                </p>
              </section>
            )}
          </div>

          <footer className="border-t-2 border-ink dark:border-night-text bg-bone dark:bg-night px-5 py-3 flex items-center justify-between gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                if (phase === 'provider') onClose()
                else if (phase === 'feeds') setPhase('provider')
                else setPhase('feeds')
              }}
              className="cursor-pointer border-2 border-ink dark:border-night-text px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-ink dark:text-night-text hover:bg-ink hover:text-paper dark:hover:bg-night-text dark:hover:text-night transition-colors"
            >
              {phase === 'provider' ? 'Plus tard' : 'Retour'}
            </button>
            <button
              type="button"
              onClick={() => {
                if (phase === 'provider') setPhase('feeds')
                else if (phase === 'feeds') setPhase('review')
                else handleFinish()
              }}
              disabled={phase === 'feeds' && drafts.length === 0 && existingFeeds.length === 0}
              className="cursor-pointer inline-flex items-center gap-1.5 bg-vermillion text-paper border-2 border-ink dark:border-night-text px-4 py-2 font-mono text-[11px] uppercase tracking-[0.2em] hover:bg-vermillion-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {phase === 'provider' && 'Continuer'}
              {phase === 'feeds' && 'Récapitulatif'}
              {phase === 'review' && 'Valider & lancer'}
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" strokeWidth={2.5} />
            </button>
          </footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
